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
          background: "linear-gradient(160deg, #0E2A4E 0%, #040A16 60%)",
          color: "#EAF2FF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(90deg, #1E9BFF, #00C85A)" }} />
          <div style={{ fontSize: 28, color: "#8AD4FF", letterSpacing: 2, textTransform: "uppercase" }}>
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
                  border: "1px solid rgba(94,169,255,0.34)",
                  borderRadius: 6,
                  color: "#B9CCE8",
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#A3B8D6" }}>
          <div>{profile.name}</div>
          <div>{t.footer}</div>
        </div>
      </div>
    ),
    size,
  );
}
