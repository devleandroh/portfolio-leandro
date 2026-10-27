import type { Locale } from "@/i18n/config";
import { documents } from "./documents";
import { queryTerms, terms } from "./text";
import type { DocType } from "./types";

/**
 * Recuperação lexical com BM25 sobre trechos (seções) dos documentos.
 * Não há embeddings nem busca vetorial: a relevância vem da frequência dos termos
 * no trecho e da raridade deles na base (IDF).
 */

const K1 = 1.2;
const B = 0.75;
/** Fração mínima dos termos da consulta que um trecho precisa conter para contar como evidência. */
export const MIN_COVERAGE = 0.5;

export interface Chunk {
  /** "<docId>§<n>", com n a partir de 1. */
  id: string;
  docId: string;
  section: number;
  docTitle: string;
  docType: DocType;
  date: string;
  heading: string;
  text: string;
  /** Termos indexados (título do documento + título da seção + corpo). */
  terms: string[];
}

interface Index {
  chunks: Chunk[];
  tf: Map<string, number>[];
  df: Map<string, number>;
  avgLen: number;
}

const indexes = new Map<Locale, Index>();

function buildIndex(lang: Locale): Index {
  const chunks: Chunk[] = documents.flatMap((d) =>
    d.sections.map((s, i) => ({
      id: `${d.id}§${i + 1}`,
      docId: d.id,
      section: i + 1,
      docTitle: d.title[lang],
      docType: d.type,
      date: d.date,
      heading: s.heading[lang],
      text: s.body[lang],
      terms: terms(`${d.title[lang]} ${s.heading[lang]} ${s.body[lang]}`),
    })),
  );
  const df = new Map<string, number>();
  const tf = chunks.map((c) => {
    const m = new Map<string, number>();
    for (const t of c.terms) m.set(t, (m.get(t) ?? 0) + 1);
    for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return m;
  });
  const avgLen = chunks.reduce((s, c) => s + c.terms.length, 0) / chunks.length;
  return { chunks, tf, df, avgLen };
}

export function getIndex(lang: Locale): Index {
  let idx = indexes.get(lang);
  if (!idx) indexes.set(lang, (idx = buildIndex(lang)));
  return idx;
}

export interface Hit {
  chunk: Chunk;
  score: number;
  /** Termos da consulta presentes no trecho. */
  matched: string[];
  /** matched / termos da consulta. */
  coverage: number;
}

export interface SearchResult {
  queryTerms: string[];
  /** Trechos aceitos como evidência, do mais ao menos relevante. */
  hits: Hit[];
  /** Melhor candidato rejeitado pelo limiar de cobertura (para transparência). */
  bestRejected?: Hit;
  /** Quantos trechos tiveram pontuação maior que zero. */
  candidates: number;
}

function score(idx: Index, i: number, q: string[]): Hit {
  const N = idx.chunks.length;
  const tf = idx.tf[i];
  const len = idx.chunks[i].terms.length;
  let s = 0;
  const matched: string[] = [];
  for (const t of q) {
    const f = tf.get(t);
    if (!f) continue;
    matched.push(t);
    const n = idx.df.get(t) ?? 0;
    const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
    s += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * len) / idx.avgLen)));
  }
  return { chunk: idx.chunks[i], score: s, matched, coverage: q.length ? matched.length / q.length : 0 };
}

/** Exige todos os termos em consultas de até 2 termos; a partir de 3, ao menos MIN_COVERAGE. */
export function requiredMatches(n: number): number {
  return n <= 2 ? n : Math.ceil(n * MIN_COVERAGE);
}

/**
 * Busca os trechos mais relevantes. `onlyDocs` restringe a busca a documentos
 * específicos (usado para localizar a evidência de um registro estruturado).
 */
export function search(
  lang: Locale,
  query: string | string[],
  { limit = 4, onlyDocs, minMatches }: { limit?: number; onlyDocs?: string[]; minMatches?: number } = {},
): SearchResult {
  const idx = getIndex(lang);
  const q = Array.isArray(query) ? [...new Set(query)] : queryTerms(query);
  if (q.length === 0) return { queryTerms: q, hits: [], candidates: 0 };
  const need = minMatches ?? requiredMatches(q.length);

  const scored: Hit[] = [];
  idx.chunks.forEach((c, i) => {
    if (onlyDocs && !onlyDocs.includes(c.docId)) return;
    const h = score(idx, i, q);
    if (h.score > 0) scored.push(h);
  });
  scored.sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));

  const accepted = scored.filter((h) => h.matched.length >= need);
  return {
    queryTerms: q,
    hits: accepted.slice(0, limit),
    bestRejected: accepted.length === 0 ? scored[0] : undefined,
    candidates: scored.length,
  };
}

/** Frase do trecho que contém mais termos da consulta (resposta extrativa). */
export function bestSentence(text: string, matched: string[]): string {
  const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  let best = sentences[0];
  let bestCount = -1;
  for (const s of sentences) {
    const set = new Set(terms(s));
    const count = matched.filter((t) => set.has(t)).length;
    if (count > bestCount) {
      best = s;
      bestCount = count;
    }
  }
  return best;
}
