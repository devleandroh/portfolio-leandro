/**
 * Contador de visitas (somente servidor).
 *
 * Usa a mesma chave pública do Supabase das demos: o schema `visitas` não é exposto,
 * e as estatísticas só saem da função `estatisticas_visitas` com a senha do painel.
 */
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Cookie (httpOnly) com a senha do painel. Também marca o navegador do dono: as visitas dele não contam. */
export const OWNER_COOKIE = "painel_chave";

export interface Ranking {
  nome: string;
  total: number;
}

export interface VisitStats {
  dias: number;
  total: number;
  primeiraVisita: string | null;
  periodo: {
    visualizacoes: number;
    visitantes: number;
    visitas?: number;
    paginasPorVisita?: number | null;
    duracaoMediaSeg?: number | null;
  };
  hoje: { visualizacoes: number; visitantes: number };
  serie: { dia: string; visualizacoes: number; visitantes: number }[];
  paginas: Ranking[];
  origens: Ranking[];
  paises: Ranking[];
  dispositivos: Ranking[];
  // Campos da migration 20261118000200 (ausentes enquanto ela não for aplicada).
  entradas?: Ranking[];
  campanhas?: Ranking[];
  estados?: Ranking[];
  cidades?: Ranking[];
  navegadores?: Ranking[];
  sistemas?: Ranking[];
  idiomas?: Ranking[];
  ultimas?: Sessao[];
}

/** Um visitante num dia. */
export interface Sessao {
  inicio: string;
  paginas: number;
  entrada: string;
  fonte: string;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  dispositivo: string;
  duracaoSeg: number;
  caminhos: string[];
}

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function visitsConfigured(): boolean {
  return getClient() !== null;
}

/** Só conta visitas no deploy de produção (ou localmente, com TRACK_VISITS=1). */
export function trackingEnabled(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.TRACK_VISITS === "1";
}

/** Identificador anônimo: hash de IP + navegador + mês. Nenhum dado pessoal é gravado. */
export function visitorId(ip: string, userAgent: string, now = new Date()): string {
  const month = now.toISOString().slice(0, 7);
  return createHash("sha256").update(`${month}|${ip}|${userAgent}`).digest("hex");
}

/** Apps e domínios curtos que representam a mesma origem. */
const ORIGEM_ALIAS: [RegExp, string][] = [
  [/(^|\.)linkedin\.(com|android)$|^lnkd\.in$|^com\.linkedin\./, "linkedin.com"],
  [/^com\.google\.android\.gm$|^mail\.google\.com$/, "gmail"],
  [/(^|\.)google\.[a-z.]+$|^com\.google\.android\.googlequicksearchbox$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/^t\.co$|(^|\.)(twitter|x)\.com$/, "x.com"],
  [/(^|\.)facebook\.com$|^fb\.me$|^com\.facebook\./, "facebook.com"],
  [/(^|\.)instagram\.com$|^com\.instagram\./, "instagram.com"],
  [/(^|\.)whatsapp\.(com|net)$|^wa\.me$|^com\.whatsapp/, "whatsapp"],
  [/(^|\.)github\.com$/, "github.com"],
  [/(^|\.)teams\.(microsoft|live)\.com$/, "teams"],
  [/(^|\.)outlook\.(live|office|office365)\.com$/, "outlook"],
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "chatgpt"],
  [/(^|\.)claude\.ai$/, "claude.ai"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
];

/** Nomes curtos usados em ?utm_source=… */
const UTM_ALIAS: Record<string, string> = {
  linkedin: "linkedin.com", li: "linkedin.com", lnkd: "linkedin.com",
  github: "github.com", gh: "github.com",
  instagram: "instagram.com", ig: "instagram.com",
  facebook: "facebook.com", fb: "facebook.com",
  twitter: "x.com", x: "x.com",
  whatsapp: "whatsapp", wa: "whatsapp", zap: "whatsapp",
  email: "e-mail", "e-mail": "e-mail", mail: "e-mail",
};

export function normalizeOrigin(host: string): string {
  const h = host.replace(/^www\./, "").toLowerCase();
  return UTM_ALIAS[h] ?? ORIGEM_ALIAS.find(([re]) => re.test(h))?.[1] ?? h;
}

/** Origem normalizada (ex.: app do LinkedIn → linkedin.com); null quando é o próprio site ou não há referência. */
export function referrerHost(referrer: unknown, ownHost: string | null): string | null {
  if (typeof referrer !== "string" || !referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || (ownHost && host === ownHost.replace(/^www\./, "").split(":")[0].toLowerCase())) return null;
    if (host === "localhost" || host.endsWith(".vercel.app")) return null;
    return normalizeOrigin(host).slice(0, 100);
  } catch {
    return null;
  }
}

/** Texto curto e seguro para os campos de UTM. */
export function cleanUtm(value: unknown, max = 60): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase().replace(/[^a-z0-9_.\- ]/g, "").slice(0, max);
  return v || null;
}

export interface Visit {
  path: string;
  origin: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device: "desktop" | "mobile" | "tablet";
  visitor: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  browser: string | null;
  os: string | null;
  language: string | null;
}

export async function recordVisit(v: Visit): Promise<void> {
  const sb = getClient();
  if (!sb) return;
  const { error } = await sb.rpc("registrar_visita", {
    p_dados: {
      caminho: v.path,
      origem: v.origin,
      pais: v.country,
      estado: v.region,
      cidade: v.city,
      dispositivo: v.device,
      visitante: v.visitor,
      utm_origem: v.utmSource ? normalizeOrigin(v.utmSource) : null,
      utm_meio: v.utmMedium,
      utm_campanha: v.utmCampaign,
      navegador: v.browser,
      sistema: v.os,
      idioma: v.language,
    },
  });
  if (!error) return;
  // Migration 20261118000200 ainda não aplicada: grava pelo formato antigo, sem os campos novos.
  const old = await sb.rpc("registrar_visita", {
    p_caminho: v.path,
    p_origem: v.utmSource ? normalizeOrigin(v.utmSource) : v.origin,
    p_pais: v.country,
    p_dispositivo: v.device,
    p_visitante: v.visitor,
  });
  if (old.error) console.error("[visitas] falha ao registrar:", error.message, "|", old.error.message);
}

/** Devolve null quando a senha está errada (ou a senha ainda não foi definida no banco). */
export async function fetchVisitStats(key: string, days = 30): Promise<VisitStats | null> {
  const sb = getClient();
  if (!sb || !key) return null;
  const { data, error } = await sb.rpc("estatisticas_visitas", { p_chave: key, p_dias: days });
  if (error) {
    console.error("[visitas] falha ao ler estatísticas:", error.message);
    return null;
  }
  return (data as VisitStats | null) ?? null;
}
