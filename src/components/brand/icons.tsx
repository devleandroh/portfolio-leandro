/**
 * Ícones outline da identidade dark (copiados do preview de referência).
 * Todos decorativos: aria-hidden, nunca substituem um rótulo de texto.
 */
type P = { className?: string };
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": true } as const;

export const IconDatabase = ({ className }: P) => (
  <svg {...base} strokeWidth={1.8} className={className}>
    <ellipse cx="12" cy="5.5" rx="8" ry="3" />
    <path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    <path d="M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </svg>
);

export const IconBars = ({ className }: P) => (
  <svg {...base} strokeWidth={1.8} strokeLinecap="round" className={className}>
    <path d="M5 20V10M12 20V4M19 20v-7" />
  </svg>
);

export const IconGear = ({ className }: P) => (
  <svg {...base} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
  </svg>
);

export const IconCode = ({ className }: P) => (
  <svg {...base} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 17l-5-5 5-5M16 7l5 5-5 5" />
  </svg>
);

export const IconArrow = ({ className }: P) => (
  <svg {...base} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconCheck = ({ className }: P) => (
  <svg {...base} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const IconCalendar = ({ className }: P) => (
  <svg {...base} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </svg>
);

export const IconInfo = ({ className }: P) => (
  <svg {...base} strokeWidth={1.9} strokeLinecap="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.6v.4" />
  </svg>
);

export const IconMail = ({ className }: P) => (
  <svg {...base} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export const IconExternal = ({ className }: P) => (
  <svg {...base} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 17L17 7M8 7h9v9" />
  </svg>
);

export const IconGitHub = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .27.18.58.69.48A10 10 0 0012 2z" />
  </svg>
);
