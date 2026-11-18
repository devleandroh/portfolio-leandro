/**
 * Snippet de tema para o portfólio — identidade "dados & software".
 *
 * Tailwind v3: cole o bloco `theme.extend` no seu tailwind.config.ts.
 * Tailwind v4: os tokens já vivem em CSS vars (theme-tokens.css); aqui ficam
 *              só os aliases de cor para ganhar `bg-ink-900`, `text-brand-400` etc.
 *
 * Os valores são literais (hex) de propósito: facilita autocomplete e o
 * `opacity modifier` do Tailwind (ex.: bg-brand-500/20), que não funciona
 * com var(--x) sem a sintaxe <alpha-value>.
 */

import type { Config } from "tailwindcss";

export const brandTheme = {
  colors: {
    // superfícies (navy profundo dos banners)
    ink: {
      900: "#040A16",
      800: "#06101F",
      700: "#0A1B33",
      600: "#0E2A4E",
    },
    // azul de marca
    brand: {
      600: "#0B74E5",
      500: "#1E9BFF",
      400: "#38BDF8",
      300: "#8AD4FF",
    },
    // verde neon
    signal: {
      500: "#00C85A",
      400: "#22E27A",
      300: "#7BF2B0",
    },
    // texto
    ice: {
      DEFAULT: "#EAF2FF",
      soft: "#B9CCE8",
      muted: "#8AA3C6",
    },
    // bordas (use como border-line / border-line-strong)
    line: {
      DEFAULT: "rgba(94,169,255,.16)",
      strong: "rgba(94,169,255,.34)",
      green: "rgba(34,226,122,.38)",
    },
  },

  backgroundImage: {
    "grad-brand": "linear-gradient(90deg,#1E9BFF 0%,#00C85A 100%)",
    "grad-text": "linear-gradient(90deg,#8AD4FF 0%,#22E27A 100%)",
    "grad-card":
      "linear-gradient(160deg, rgba(18,46,86,.80) 0%, rgba(7,18,36,.78) 100%)",
    "grad-page":
      "radial-gradient(1200px 700px at 78% -8%, #11386B 0%, transparent 60%), radial-gradient(900px 600px at 0% 12%, #0A2448 0%, transparent 55%), linear-gradient(180deg,#040A16 0%,#061428 48%,#040A16 100%)",
    // padrão de pontos: combine com bg-[length:13px_13px]
    dots: "radial-gradient(circle, rgba(56,189,248,.55) 1.4px, transparent 1.4px)",
  },

  boxShadow: {
    "glow-blue": "0 18px 50px -20px rgba(30,155,255,.65)",
    "glow-green": "0 18px 50px -20px rgba(0,200,90,.55)",
    "glow-soft":
      "inset 0 1px 0 rgba(255,255,255,.05), 0 24px 60px -32px rgba(0,0,0,.9)",
    "ring-blue": "0 0 0 1px rgba(56,189,248,.25)",
  },

  borderRadius: {
    brand: "20px",
    "brand-lg": "28px",
  },

  fontFamily: {
    sans: ["var(--font-inter)", "system-ui", "sans-serif"],
    mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
  },

  keyframes: {
    "pulse-dot": {
      "0%,100%": { opacity: "1" },
      "50%": { opacity: ".35" },
    },
    "fade-up": {
      from: { opacity: "0", transform: "translateY(22px)" },
      to: { opacity: "1", transform: "none" },
    },
  },
  animation: {
    "pulse-dot": "pulse-dot 1.8s ease-in-out infinite",
    "fade-up": "fade-up .7s ease forwards",
  },
} satisfies Config["theme"];

/* --------------------------------------------------------------------------
   Exemplo de tailwind.config.ts completo
   --------------------------------------------------------------------------
import type { Config } from "tailwindcss";
import { brandTheme } from "./tailwind-theme";

export default {
  content: ["./src/**!/!*.{ts,tsx,mdx}"],
  theme: { extend: brandTheme },
  plugins: [],
} satisfies Config;
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   Receitas rápidas (classes equivalentes ao preview HTML)

   body        → bg-ink-900 text-ice bg-grad-page
   card        → rounded-brand border border-line bg-grad-card shadow-glow-soft
                 hover:-translate-y-1 hover:border-line-strong hover:shadow-glow-blue
                 transition
   botão CTA   → rounded-full bg-grad-brand text-[#03121F] font-bold px-7 py-3.5
                 shadow-glow-blue hover:brightness-110
   tag         → font-mono text-[11.5px] px-2.5 py-1.5 rounded-full
                 border border-line text-ice-soft bg-brand-400/[.07]
   eyebrow     → font-mono text-xs tracking-[.18em] uppercase text-brand-300
   título grad → bg-grad-text bg-clip-text text-transparent
   ícone tile  → size-[50px] grid place-items-center rounded-[14px]
                 border border-line-strong text-brand-400
                 bg-[linear-gradient(150deg,rgba(30,155,255,.18),rgba(7,18,36,.5))]
   status dot  → size-2 rounded-full bg-signal-400 shadow-[0_0_12px_#22E27A]
                 animate-pulse-dot
   -------------------------------------------------------------------------- */
