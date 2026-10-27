import type { NextRequest } from "next/server";
import { hasLocale } from "@/i18n/config";
import { ask, MAX_QUERY_LENGTH } from "@/lib/sami/engine";

/**
 * POST /api/sami — { q: string, lang: "pt" | "en" } → resposta do motor da demonstração.
 *
 * Somente leitura sobre dados fictícios embutidos no código: não acessa banco, rede,
 * arquivos nem executa código enviado pelo visitante.
 */

const MAX_BODY_BYTES = 2_048;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

// Limite por IP em memória: vale por instância do servidor (melhor esforço, não global).
const hits = new Map<string, number[]>();

function rateLimit(ip: string, now = Date.now()): number {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return 0;
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const retryAfter = rateLimit(ip);
  if (retryAfter) return json({ error: "rate_limited", retryAfter }, 429, { "Retry-After": String(retryAfter) });

  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "invalid" }, 415);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return json({ error: "invalid" }, 413);

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json({ error: "invalid" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid" }, 400);
  }

  const { q, lang } = (body ?? {}) as { q?: unknown; lang?: unknown };
  if (typeof q !== "string" || typeof lang !== "string" || !hasLocale(lang)) return json({ error: "invalid" }, 400);
  const query = q.trim();
  if (query.length < 2 || query.length > MAX_QUERY_LENGTH) return json({ error: "invalid" }, 400);

  try {
    return json(ask(query, lang));
  } catch (err) {
    console.error("[api/sami]", err);
    return json({ error: "server" }, 500);
  }
}
