/**
 * Normalização e tokenização compartilhadas pela recuperação, pelo roteador de
 * intenções e pelo destaque de termos na interface (funções puras, sem dependências).
 */

/** Minúsculas e sem acentos: "Integração" → "integracao". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const STOPWORDS = new Set(
  (
    // português
    "a o os as um uma uns umas de do da dos das d em no na nos nas num numa por pelo pela pelos pelas para pra com sem sob " +
    "sobre que qual quais quem como quando onde e ou se ja ao aos a e sao foi foram ser sera esta estao estava estavam " +
    "ter tem tinha temos tenho isso isto esse essa esses essas este estes aquele aquela ele ela eles elas eu nos voce voces " +
    "lhe mais menos muito muita pouco ate entre apos tambem nao sim ha seu sua seus suas meu minha nosso nossa so ainda " +
    "ja cada todo toda todos todas outro outra me te vai vao pode podem deve devem algum alguma " +
    // inglês
    "the an of to in on for with without about what which who whom how when where and or if is are was were be been being " +
    "do does did has have had this that these those it its we you they our there their them from by at as not no yes any " +
    "all can could would should will shall may might than then so into out up us me my your his her i"
  ).split(" "),
);

/**
 * Palavras que descrevem a própria pergunta ("o que a documentação diz sobre…")
 * e não o assunto procurado. São removidas apenas da consulta, nunca dos documentos.
 */
const QUERY_FILLER = new Set(
  (
    "sabemos saber sabe diz dizem dizer falam fala mostre mostrar liste listar informe informar explique conte existe existem " +
    "documento documentos documentacao documentado documentada documentadas documentados registrado registrada registro " +
    "registros informacao informacoes consta constam algo alguma coisa assunto tema " +
    "know tell show list explain say says said exist exists document documents documentation documented recorded record " +
    "records information info anything something topic subject"
  ).split(" "),
);

/**
 * Stemming leve e independente de idioma: remove plurais comuns e trunca em 6 letras.
 * "integração"/"integration" → "integr"; "decisões" → "decisa". É deliberadamente simples:
 * aproxima variações de uma palavra sem depender de bibliotecas de NLP.
 */
export function stem(token: string): string {
  let t = token;
  if (t.length > 4) {
    if (t.endsWith("oes") || t.endsWith("aes")) t = `${t.slice(0, -3)}ao`;
    else if (t.endsWith("ies")) t = `${t.slice(0, -3)}y`;
    else if (t.endsWith("ais") || t.endsWith("eis")) t = `${t.slice(0, -2)}l`;
    else if (t.endsWith("s") && !t.endsWith("ss")) t = t.slice(0, -1);
  }
  return t.length > 6 ? t.slice(0, 6) : t;
}

/** Palavras do texto, normalizadas (com stopwords). */
export function words(text: string): string[] {
  return normalize(text).match(/[a-z0-9]+/g) ?? [];
}

/** Termos indexáveis: sem stopwords, com stemming. */
export function terms(text: string): string[] {
  return words(text)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
}

/** Termos de uma consulta: além das stopwords, descarta as palavras que só descrevem a pergunta. */
export function queryTerms(text: string): string[] {
  const seen = new Set<string>();
  for (const w of words(text)) {
    if (w.length < 2 || STOPWORDS.has(w) || QUERY_FILLER.has(w)) continue;
    seen.add(stem(w));
  }
  return [...seen];
}
