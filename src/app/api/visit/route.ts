import { userAgent, type NextRequest } from "next/server";
import { OWNER_COOKIE, recordVisit, referrerHost, trackingEnabled, visitorId } from "@/lib/visits";

/**
 * POST /api/visit — { path, referrer } → registra uma visualização de página.
 *
 * Ignora robôs, o navegador do dono do site (cookie do painel) e ambientes que não são produção.
 * Sempre responde 204: o visitante não percebe nada, mesmo se o banco falhar.
 */

const MAX_BODY_BYTES = 1_024;
const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (!trackingEnabled() || request.cookies.has(OWNER_COOKIE)) return noContent();

  const ua = userAgent(request);
  if (ua.isBot || /bot|crawl|spider|preview|headless|lighthouse|vercel/i.test(ua.ua)) return noContent();

  let body: { path?: unknown; referrer?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return noContent();
    body = JSON.parse(raw);
  } catch {
    return noContent();
  }

  const path = typeof body.path === "string" ? body.path.split(/[?#]/)[0].slice(0, 200) : "";
  if (!path.startsWith("/") || /\/painel(\/|$)/.test(path)) return noContent();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? null;
  const device = ua.device.type === "mobile" || ua.device.type === "tablet" ? ua.device.type : "desktop";

  await recordVisit({
    path,
    origin: referrerHost(body.referrer, request.headers.get("host")),
    country,
    device,
    visitor: visitorId(ip, ua.ua),
  });
  return noContent();
}
