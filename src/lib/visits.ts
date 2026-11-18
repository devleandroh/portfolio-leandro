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
  periodo: { visualizacoes: number; visitantes: number };
  hoje: { visualizacoes: number; visitantes: number };
  serie: { dia: string; visualizacoes: number; visitantes: number }[];
  paginas: Ranking[];
  origens: Ranking[];
  paises: Ranking[];
  dispositivos: Ranking[];
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

/** Domínio de origem, sem "www."; null quando é o próprio site ou não há referência. */
export function referrerHost(referrer: unknown, ownHost: string | null): string | null {
  if (typeof referrer !== "string" || !referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || (ownHost && host === ownHost.replace(/^www\./, "").split(":")[0].toLowerCase())) return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

export async function recordVisit(visit: {
  path: string;
  origin: string | null;
  country: string | null;
  device: "desktop" | "mobile" | "tablet";
  visitor: string;
}): Promise<void> {
  const sb = getClient();
  if (!sb) return;
  const { error } = await sb.rpc("registrar_visita", {
    p_caminho: visit.path,
    p_origem: visit.origin,
    p_pais: visit.country,
    p_dispositivo: visit.device,
    p_visitante: visit.visitor,
  });
  if (error) console.error("[visitas] falha ao registrar:", error.message);
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
