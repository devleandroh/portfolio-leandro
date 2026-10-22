import { ImageResponse } from "next/og";
import { getProfile } from "@/config/profile";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Imagem de pré-visualização (Open Graph) usada quando o link é compartilhado
 * no LinkedIn, WhatsApp etc. Sem ela, o link aparece sem imagem no feed.
 * Gerada uma vez por idioma.
 */
export const alt = `${getProfile(defaultLocale).name} — ${getProfile(defaultLocale).role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const value = (await params).lang;
  const lang = hasLocale(value) ? value : defaultLocale;
  const profile = getProfile(lang);
  const t = getDictionary(lang).og;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#111110",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 20, height: 20, background: "#2a78d6" }} />
          <div style={{ fontSize: 28, color: "#cde2fb", letterSpacing: 2, textTransform: "uppercase" }}>
            {profile.role}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 }}>{profile.headline}</div>
          <div style={{ display: "flex", gap: 14 }}>
            {t.problems.map((p) => (
              <div
                key={p}
                style={{
                  fontSize: 24,
                  padding: "8px 16px",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 6,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "rgba(255,255,255,0.6)" }}>
          <div>{profile.name}</div>
          <div>{t.footer}</div>
        </div>
      </div>
    ),
    size,
  );
}
