"use client";

import { usePathname, useRouter } from "next/navigation";
import { htmlLang, LOCALE_COOKIE, localePath, locales, stripLocale, type Locale } from "@/i18n/config";

/**
 * Seletor de idioma (PT | EN). Leva à mesma página no outro idioma, preservando
 * filtros (query string) e âncora, e grava a escolha em cookie para as próximas visitas.
 */
export function LanguageSwitcher({
  lang,
  label,
  names,
}: {
  lang: Locale;
  label: string;
  names: Record<Locale, string>;
}) {
  const pathname = stripLocale(usePathname());
  const router = useRouter();

  return (
    <nav aria-label={label} className="flex rounded-md border border-line bg-page p-0.5 font-mono text-[11px]">
      {locales.map((l) => {
        const active = l === lang;
        const href = localePath(l, pathname);
        return (
          <a
            key={l}
            href={href}
            hrefLang={htmlLang[l]}
            lang={htmlLang[l]}
            title={names[l]}
            aria-current={active ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault();
              document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
              if (!active) router.push(`${href}${window.location.search}${window.location.hash}`, { scroll: false });
            }}
            className={`rounded px-2 py-1 uppercase transition-colors ${
              active ? "bg-ink text-surface" : "text-ink-2 hover:text-ink"
            }`}
          >
            {l}
          </a>
        );
      })}
    </nav>
  );
}
