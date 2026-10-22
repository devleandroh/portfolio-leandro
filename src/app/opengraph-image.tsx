import { ImageResponse } from "next/og";
import { profile } from "@/config/profile";

/**
 * Imagem de pré-visualização (Open Graph) usada quando o link é compartilhado
 * no LinkedIn, WhatsApp etc. Sem ela, o link aparece sem imagem no feed.
 */
export const alt = `${profile.name} — ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PROBLEMAS = ["Dados em planilhas", "Processos manuais", "Dashboards que não decidem"];

export default function OpengraphImage() {
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
            {PROBLEMAS.map((p) => (
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
          <div>3 cases com demonstração funcional</div>
        </div>
      </div>
    ),
    size,
  );
}
