import { localePath, type Locale } from "@/i18n/config";

/**
 * Referências citáveis da demonstração. Usado no servidor e no cliente (sem importar os dados):
 * registros apontam para a linha do painel; documentos e trechos, para a página do documento.
 */
export const REF_PATTERN = /\b(?:[TO]-\d{2}|[RD]-\d{2}|MO1|M[1-4]|(?:REQ|ADR|INC|SCH|TEC|CHG|ORI)-\d{3}|MTG-\d{4})(?:§\d+)?/g;

const DOC_ID = /^(?:REQ|ADR|INC|SCH|TEC|CHG|ORI)-\d{3}$|^MTG-\d{4}$/;

export const isDocId = (id: string) => DOC_ID.test(id);

export function samiHref(lang: Locale, ref: string): string {
  const [id, section] = ref.split("§");
  if (isDocId(id)) return localePath(lang, `/sami/docs/${id}${section ? `#s-${section}` : ""}`);
  return localePath(lang, `/sami#rec-${id}`);
}

/** Divide um texto em partes simples e referências linkáveis. */
export function splitRefs(text: string): { text: string; ref?: string }[] {
  const out: { text: string; ref?: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(REF_PATTERN)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], ref: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
