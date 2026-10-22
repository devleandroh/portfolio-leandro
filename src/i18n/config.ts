/**
 * Idiomas do site. O português é o padrão e fica nas URLs sem prefixo
 * (/, /demo/compras…); os demais idiomas ganham prefixo (/en, /en/demo/compras…).
 * O proxy (src/proxy.ts) reescreve internamente as URLs sem prefixo para /pt.
 */
export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Cookie que guarda o idioma escolhido no seletor. */
export const LOCALE_COOKIE = "lang";

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

/** Atributo `lang` do HTML, `locale` do Open Graph e locale do Intl. */
export const htmlLang: Record<Locale, string> = { pt: "pt-BR", en: "en-US" };
export const ogLocale: Record<Locale, string> = { pt: "pt_BR", en: "en_US" };

/** Caminho no idioma informado: localePath("en", "/demo/compras") → "/en/demo/compras". */
export function localePath(lang: Locale, path: string): string {
  if (lang === defaultLocale) return path;
  if (path === "/") return `/${lang}`;
  if (path.startsWith("/#") || path.startsWith("/?")) return `/${lang}${path.slice(1)}`;
  return `/${lang}${path}`;
}

/** Remove o prefixo de idioma de um caminho: "/en/demo/compras" → "/demo/compras". */
export function stripLocale(pathname: string): string {
  for (const l of locales) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}
