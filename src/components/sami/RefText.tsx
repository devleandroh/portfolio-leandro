import type { Locale } from "@/i18n/config";
import { samiHref, splitRefs } from "@/lib/sami/links";

/** Texto com os IDs citados (T-05, R-01, ADR-002§2…) transformados em links verificáveis. */
export function RefText({ lang, text }: { lang: Locale; text: string }) {
  return (
    <>
      {splitRefs(text).map((p, i) =>
        p.ref ? (
          <a key={i} href={samiHref(lang, p.ref)} className="font-mono text-[0.92em] text-accent-strong underline decoration-accent/30 underline-offset-2 hover:decoration-accent">
            {p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
