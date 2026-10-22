import { lang } from "next/root-params";
import { defaultLocale, hasLocale, type Locale } from "./config";

/**
 * Idioma da requisição atual, lido do segmento raiz app/[lang] (somente Server Components).
 * Útil em componentes genéricos que não recebem `lang` por props.
 */
export async function currentLocale(): Promise<Locale> {
  const value = await lang();
  return hasLocale(value) ? value : defaultLocale;
}
