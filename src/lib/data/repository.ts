/**
 * Camada de acesso a dados (somente servidor).
 *
 * - Com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY definidos,
 *   lê as views públicas do Supabase.
 * - Sem essas variáveis (ou se o banco estiver indisponível), usa o gerador
 *   sintético em memória — as demos continuam funcionando.
 *
 * Os conjuntos são pequenos (milhares de linhas), então são carregados uma vez
 * e mantidos em cache por alguns minutos; as agregações rodam no servidor.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateComprasTables } from "../synthetic/compras";
import { generateFaturamentoTables } from "../synthetic/faturamento";
import { generateLegalTables } from "../synthetic/legal";
import { anchorDate } from "../synthetic/random";
import { buildComprasViews, buildFaturamentoViews, buildLegalViews } from "../synthetic/views";
import type {
  ComprasDataset, DataSourceKind, FaturamentoDataset, ItemDocumentoCompra, LegalDataset,
  MovimentacaoJuridica, NotaCompra,
} from "./types";

const CACHE_TTL_MS = 10 * 60 * 1000;
const FALLBACK_TTL_MS = 30 * 1000;
const PAGE_SIZE = 1000;

export interface Loaded<T> {
  data: T;
  source: DataSourceKind;
  /** Data de referência (yyyy-mm-dd) usada para "hoje" nos cálculos. */
  today: string;
  /** Preenchido quando o Supabase está configurado mas falhou e caímos no modo local. */
  warning?: string;
}

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const forced = process.env.DATA_SOURCE?.trim();
  if (forced === "synthetic" || !url || !key) return null;
  return { url, key };
}

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient | null {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  client ??= createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
  return client;
}

export function configuredSource(): DataSourceKind {
  return supabaseConfig() ? "supabase" : "synthetic";
}

const todayIso = () => anchorDate().toISOString().slice(0, 10);

/** Lê uma view inteira, paginando de 1000 em 1000 (limite padrão da API). */
async function fetchAll<T>(sb: SupabaseClient, view: string, columns: string, orderBy: string): Promise<T[]> {
  const { count, error } = await sb.from(view).select(orderBy, { count: "exact", head: true });
  if (error) throw new Error(`${view}: ${error.message}`);
  const total = count ?? 0;
  const pages = await Promise.all(
    Array.from({ length: Math.ceil(total / PAGE_SIZE) }, async (_, i) => {
      const { data, error: e } = await sb
        .from(view)
        .select(columns)
        .order(orderBy)
        .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1);
      if (e) throw new Error(`${view}: ${e.message}`);
      return (data ?? []) as T[];
    }),
  );
  return pages.flat();
}

/** PostgREST devolve `numeric` como número; garantimos o tipo de colunas numéricas por segurança. */
function numbers<T extends object>(rows: T[], keys: (keyof T)[]): T[] {
  for (const r of rows) {
    for (const k of keys) {
      const v = r[k] as unknown;
      if (typeof v === "string") (r as Record<keyof T, unknown>)[k] = Number(v);
    }
  }
  return rows;
}

// ---------------------------------------------------------------------
// Cache simples em memória (por instância do servidor)
// ---------------------------------------------------------------------
const cache = new Map<string, { at: number; value: Promise<Loaded<unknown>> }>();

function cached<T>(key: string, loader: () => Promise<Loaded<T>>): Promise<Loaded<T>> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as Promise<Loaded<T>>;
  const entry = { at: Date.now(), value: undefined as unknown as Promise<Loaded<unknown>> };
  const value = loader().then(
    (loaded) => {
      // Resultado de fallback (banco indisponível) expira rápido para tentar de novo.
      if (loaded.warning) entry.at = Date.now() - CACHE_TTL_MS + FALLBACK_TTL_MS;
      return loaded;
    },
    (err) => {
      cache.delete(key);
      throw err;
    },
  );
  entry.value = value;
  cache.set(key, entry);
  return value;
}

async function withFallback<T>(remote: (sb: SupabaseClient) => Promise<T>, local: () => T): Promise<Loaded<T>> {
  const sb = getClient();
  const today = todayIso();
  if (!sb) return { data: local(), source: "synthetic", today };
  try {
    return { data: await remote(sb), source: "supabase", today };
  } catch (err) {
    console.error("[dados] Falha ao consultar o Supabase; usando dados sintéticos locais.", err);
    return {
      data: local(),
      source: "synthetic",
      today,
      warning: "Banco de dados indisponível no momento — exibindo a cópia local dos dados demonstrativos.",
    };
  }
}

// Gerações locais memorizadas (determinísticas para o dia corrente).
let localKey = "";
let local: {
  compras: ReturnType<typeof buildComprasViews>;
  faturamento: ReturnType<typeof buildFaturamentoViews>;
  legal: ReturnType<typeof buildLegalViews>;
} | null = null;
function localData() {
  const today = todayIso();
  if (!local || localKey !== today) {
    const anchor = anchorDate();
    local = {
      compras: buildComprasViews(generateComprasTables(anchor)),
      faturamento: buildFaturamentoViews(generateFaturamentoTables(anchor)),
      legal: buildLegalViews(generateLegalTables(anchor)),
    };
    localKey = today;
  }
  return local;
}

// ---------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------
export function getComprasDataset(): Promise<Loaded<ComprasDataset>> {
  return cached("compras", () =>
    withFallback(
      async (sb) => ({
        processos: numbers(await fetchAll(sb, "compras_v_processos", "*", "solicitacao_id"), [
          "sc_valor_estimado", "pc_valor", "nf_valor",
        ]),
      }),
      () => ({ processos: localData().compras.processos }),
    ),
  );
}

export interface DetalheCompra {
  itensSolicitacao: ItemDocumentoCompra[];
  itensPedido: ItemDocumentoCompra[];
  notas: NotaCompra[];
}

export async function getCompraDetalhe(scNumero: string, pcNumero: string | null): Promise<DetalheCompra> {
  const loaded = await withFallback<DetalheCompra>(
    async (sb) => {
      const [sc, pc, nf] = await Promise.all([
        sb.from("compras_v_itens_solicitacao").select("*").eq("documento", scNumero).order("item_id"),
        pcNumero
          ? sb.from("compras_v_itens_pedido").select("*").eq("documento", pcNumero).order("item_id")
          : Promise.resolve({ data: [], error: null }),
        pcNumero
          ? sb.from("compras_v_notas").select("*").eq("pc_numero", pcNumero).order("data_recebimento")
          : Promise.resolve({ data: [], error: null }),
      ]);
      const err = sc.error ?? pc.error ?? nf.error;
      if (err) throw new Error(err.message);
      return {
        itensSolicitacao: numbers((sc.data ?? []) as ItemDocumentoCompra[], ["quantidade", "valor_unitario", "valor_total"]),
        itensPedido: numbers((pc.data ?? []) as ItemDocumentoCompra[], ["quantidade", "valor_unitario", "valor_total"]),
        notas: numbers((nf.data ?? []) as NotaCompra[], ["valor_total"]),
      };
    },
    () => {
      const c = localData().compras;
      return {
        itensSolicitacao: c.itensSolicitacao.filter((i) => i.documento === scNumero),
        itensPedido: pcNumero ? c.itensPedido.filter((i) => i.documento === pcNumero) : [],
        notas: pcNumero
          ? c.notas.filter((n) => n.pc_numero === pcNumero).sort((a, b) => a.data_recebimento.localeCompare(b.data_recebimento))
          : [],
      };
    },
  );
  return loaded.data;
}

export function getFaturamentoDataset(): Promise<Loaded<FaturamentoDataset>> {
  return cached("faturamento", () =>
    withFallback(
      async (sb) => ({
        itens: numbers(await fetchAll(sb, "faturamento_v_itens", "*", "item_id"), ["quantidade", "valor_total"]),
      }),
      () => ({ itens: localData().faturamento }),
    ),
  );
}

export function getLegalDataset(): Promise<Loaded<LegalDataset>> {
  return cached("legal", () =>
    withFallback(
      async (sb) => {
        const [processos, prazos] = await Promise.all([
          fetchAll(sb, "legal_v_processos", "*", "id"),
          fetchAll(sb, "legal_v_prazos", "*", "id"),
        ]);
        return {
          processos: numbers(processos as LegalDataset["processos"], ["valor_causa", "valor_provisao"]),
          prazos: prazos as LegalDataset["prazos"],
        };
      },
      () => ({ processos: localData().legal.processos, prazos: localData().legal.prazos }),
    ),
  );
}

export async function getMovimentacoes(processoNumero: string): Promise<MovimentacaoJuridica[]> {
  const loaded = await withFallback<MovimentacaoJuridica[]>(
    async (sb) => {
      const { data, error } = await sb
        .from("legal_v_movimentacoes")
        .select("*")
        .eq("processo_numero", processoNumero)
        .order("data", { ascending: false })
        .order("id", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as MovimentacaoJuridica[];
    },
    () =>
      localData()
        .legal.movimentacoes.filter((m) => m.processo_numero === processoNumero)
        .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id),
  );
  return loaded.data;
}
