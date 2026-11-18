import { userAgent, type NextRequest } from "next/server";
import { cleanUtm, OWNER_COOKIE, recordVisit, referrerHost, trackingEnabled, visitorId } from "@/lib/visits";

/**
 * POST /api/visit — { path, referrer, utm?, language? } → registra uma visualização de página.
 *
 * Ignora robôs, o navegador do dono do site (cookie do painel) e ambientes que não são produção.
 * Localização: país, estado e cidade aproximados que a Vercel deduz do IP (cabeçalhos x-vercel-ip-*);
 * o IP não é gravado. Sempre responde 204: o visitante não percebe nada, mesmo se o banco falhar.
 */

const MAX_BODY_BYTES = 2_048;
const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

function header(request: NextRequest, name: string, max: number): string | null {
  const raw = request.headers.get(name);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).trim().slice(0, max) || null; // a Vercel codifica a cidade (ex.: S%C3%A3o%20Paulo)
  } catch {
    return raw.trim().slice(0, max) || null;
  }
}

export async function POST(request: NextRequest) {
  if (!trackingEnabled() || request.cookies.has(OWNER_COOKIE)) return noContent();

  const ua = userAgent(request);
  if (ua.isBot || /bot|crawl|spider|preview|headless|lighthouse|vercel|slurp|facebookexternalhit/i.test(ua.ua)) {
    return noContent();
  }

  let body: { path?: unknown; referrer?: unknown; utm?: Record<string, unknown>; language?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return noContent();
    body = JSON.parse(raw);
  } catch {
    return noContent();
  }

  const path = typeof body.path === "string" ? body.path.split(/[?#]/)[0].slice(0, 200) : "";
  if (!path.startsWith("/") || /\/painel(\/|$)/.test(path)) return noContent();

  const utm = body.utm && typeof body.utm === "object" ? body.utm : {};
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const device = ua.device.type === "mobile" || ua.device.type === "tablet" ? ua.device.type : "desktop";
  const language =
    (typeof body.language === "string" ? body.language : request.headers.get("accept-language")?.split(",")[0]) ?? "";

  await recordVisit({
    path,
    origin: referrerHost(body.referrer, request.headers.get("host")),
    country: header(request, "x-vercel-ip-country", 2)?.toUpperCase() ?? null,
    region: header(request, "x-vercel-ip-country-region", 10)?.toUpperCase() ?? null,
    city: header(request, "x-vercel-ip-city", 80),
    device,
    visitor: visitorId(ip, ua.ua),
    utmSource: cleanUtm(utm.source),
    utmMedium: cleanUtm(utm.medium),
    utmCampaign: cleanUtm(utm.campaign, 80),
    browser: ua.browser.name?.slice(0, 40) ?? null,
    os: ua.os.name?.slice(0, 40) ?? null,
    language: /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$/.test(language.trim()) ? language.trim() : null,
  });
  return noContent();
}
