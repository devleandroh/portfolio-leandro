import type { Locale } from "@/i18n/config";
import { decisions, milestones, risks, tasks } from "./atlas";
import { documents } from "./documents";
import { ask, type Mechanism, type SamiAnswer } from "./engine";
import { REF_PATTERN } from "./links";

/**
 * Suíte de avaliação do motor. Cada caso declara o mecanismo esperado e os registros
 * e documentos que uma resposta correta precisa citar. `npm run sami:eval` grava o
 * resultado em src/content/sami-eval.json, exibido na página do case.
 *
 * Atenção: os casos foram escritos junto com o motor — medem regressão, não generalização.
 */

export interface EvalCase {
  lang: Locale;
  q: string;
  mechanism: Mechanism;
  noneReason?: "no_evidence" | "unsupported";
  records?: string[];
  docs?: string[];
}

const both = (pt: string, en: string, expect: Omit<EvalCase, "lang" | "q">): EvalCase[] => [
  { lang: "pt", q: pt, ...expect },
  { lang: "en", q: en, ...expect },
];

export const evalCases: EvalCase[] = [
  ...both("Quais tarefas estão bloqueando o Projeto Atlas?", "Which tasks are blocking Project Atlas?", {
    mechanism: "structured",
    records: ["T-05", "T-08", "T-06", "O-02"],
  }),
  ...both(
    "Quais decisões arquiteturais foram tomadas e onde estão documentadas?",
    "Which architecture decisions were made and where are they documented?",
    { mechanism: "hybrid", records: ["D-01", "D-02", "D-03", "D-04"], docs: ["ADR-001", "ADR-002", "ADR-003", "ADR-004"] },
  ),
  ...both("Quais riscos ameaçam a próxima entrega?", "Which risks threaten the next delivery?", {
    mechanism: "structured",
    records: ["R-01", "R-02", "R-03", "R-04", "M2"],
  }),
  ...both("O que acontece se a integração principal atrasar cinco dias?", "What happens if the main integration is delayed by five days?", {
    mechanism: "structured",
    records: ["T-05", "T-09", "T-11", "M2"],
  }),
  ...both("O que sabemos sobre um assunto que não existe na documentação?", "What do we know about a subject that does not exist in the documentation?", {
    mechanism: "none",
    noneReason: "no_evidence",
  }),
  ...both("Quais tarefas estão atrasadas?", "Which tasks are overdue?", { mechanism: "structured", records: ["T-06", "O-02", "T-05"] }),
  ...both("Quais riscos são críticos?", "Which risks are critical?", { mechanism: "structured", records: ["R-01", "R-02"] }),
  ...both("Quais decisões ainda estão pendentes?", "Which decisions are still pending?", { mechanism: "structured", records: ["D-06", "D-05"] }),
  ...both("Quais tarefas precisam ser concluídas primeiro?", "Which tasks need to be finished first?", {
    mechanism: "structured",
    records: ["O-02", "T-06", "T-05", "T-08", "T-07", "T-10"],
  }),
  ...both("O que está bloqueando a próxima entrega?", "What is blocking the next delivery?", {
    mechanism: "structured",
    records: ["T-05", "T-08", "T-06", "O-02", "M2"],
  }),
  ...both("Qual o impacto de um atraso de 3 dias na T-06?", "What is the impact of a 3 day delay on T-06?", {
    mechanism: "structured",
    records: ["T-06", "T-05", "T-09", "T-11", "M2"],
  }),
  ...both("Por que a T-05 está bloqueada?", "Why is T-05 blocked?", { mechanism: "hybrid", records: ["T-05", "T-06"], docs: ["MTG-1014"] }),
  ...both("Quando é o go-live?", "When is the go-live?", { mechanism: "structured", records: ["M4"] }),
  ...both("Quais tarefas a Bianca tem?", "Which tasks does Bianca have?", { mechanism: "structured", records: ["T-05"] }),
  ...both("Onde está documentado o limite de chamadas do ERP?", "Where is the ERP call limit documented?", {
    mechanism: "retrieval",
    docs: ["ADR-002", "INC-007"],
  }),
  ...both("Como funciona a autenticação SSO?", "How does SSO authentication work?", { mechanism: "retrieval", docs: ["ADR-003", "REQ-001"] }),
  ...both("Qual a alternativa para o catálogo do Órion?", "What is the alternative for the Orion catalog?", {
    mechanism: "retrieval",
    docs: ["ORI-001", "MTG-1014"],
  }),
  ...both("Qual a receita de bolo de cenoura?", "What is the recipe for carrot cake?", { mechanism: "none", noneReason: "no_evidence" }),
  ...both("Qual é a política de férias da empresa?", "What is the company vacation policy?", { mechanism: "none", noneReason: "no_evidence" }),
  ...both("E se a integração atrasar 5 dias?", "What if the integration slips 5 days?", { mechanism: "none", noneReason: "unsupported" }),
];

/* ------------------------------------------------------------------ */

const KNOWN = new Set<string>([
  ...tasks.map((t) => t.id),
  ...risks.map((r) => r.id),
  ...decisions.map((d) => d.id),
  ...milestones.map((m) => m.id),
  ...documents.map((d) => d.id),
  ...documents.flatMap((d) => d.sections.map((_, i) => `${d.id}§${i + 1}`)),
]);

/** Todas as referências citadas numa resposta (registros, trechos e IDs no texto). */
export function citedRefs(a: SamiAnswer): string[] {
  const inText = [a.lead, ...a.points, ...a.limitations].flatMap((s) => [...s.matchAll(REF_PATTERN)].map((m) => m[0]));
  return [...a.records.map((r) => r.id), ...a.passages.map((p) => p.chunkId), ...inText];
}

export const refExists = (ref: string) => KNOWN.has(ref);

export interface CaseResult {
  lang: Locale;
  q: string;
  expected: Mechanism;
  got: Mechanism;
  noneReason?: string;
  ok: boolean;
  missingRecords: string[];
  extraRecords: string[];
  missingDocs: string[];
  extraDocs: string[];
}

export interface EvalReport {
  cases: number;
  mechanism: { correct: number; total: number };
  records: { found: number; expected: number; relevant: number; returned: number };
  docs: { found: number; expected: number; relevant: number; returned: number };
  refusals: { correct: number; total: number };
  falseRefusals: { count: number; total: number };
  references: { valid: number; total: number };
  failures: CaseResult[];
}

const pctile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];

export function runEval(cases = evalCases): EvalReport {
  const report: EvalReport = {
    cases: cases.length,
    mechanism: { correct: 0, total: cases.length },
    records: { found: 0, expected: 0, relevant: 0, returned: 0 },
    docs: { found: 0, expected: 0, relevant: 0, returned: 0 },
    refusals: { correct: 0, total: 0 },
    falseRefusals: { count: 0, total: 0 },
    references: { valid: 0, total: 0 },
    failures: [],
  };

  for (const c of cases) {
    const a = ask(c.q, c.lang);
    const mechOk = a.mechanism === c.mechanism && (!c.noneReason || a.noneReason === c.noneReason);
    if (mechOk) report.mechanism.correct++;

    if (c.mechanism === "none") {
      report.refusals.total++;
      if (a.mechanism === "none") report.refusals.correct++;
    } else {
      report.falseRefusals.total++;
      if (a.mechanism === "none") report.falseRefusals.count++;
    }

    const gotRecords = [...new Set(a.records.map((r) => r.id))];
    const gotDocs = [...new Set(a.passages.map((p) => p.docId))];
    const expRecords = c.records ?? [];
    const expDocs = c.docs ?? [];
    // Precisão só é medida quando o caso declara o que é relevante.
    if (c.records) {
      report.records.expected += expRecords.length;
      report.records.found += expRecords.filter((r) => gotRecords.includes(r)).length;
      report.records.returned += gotRecords.length;
      report.records.relevant += gotRecords.filter((r) => expRecords.includes(r)).length;
    }
    if (c.docs) {
      report.docs.expected += expDocs.length;
      report.docs.found += expDocs.filter((d) => gotDocs.includes(d)).length;
      report.docs.returned += gotDocs.length;
      report.docs.relevant += gotDocs.filter((d) => expDocs.includes(d)).length;
    }

    for (const ref of citedRefs(a)) {
      report.references.total++;
      if (refExists(ref)) report.references.valid++;
    }

    const result: CaseResult = {
      lang: c.lang,
      q: c.q,
      expected: c.mechanism,
      got: a.mechanism,
      noneReason: a.noneReason,
      ok: mechOk,
      missingRecords: expRecords.filter((r) => !gotRecords.includes(r)),
      extraRecords: c.records ? gotRecords.filter((r) => !expRecords.includes(r)) : [],
      missingDocs: expDocs.filter((d) => !gotDocs.includes(d)),
      extraDocs: c.docs ? gotDocs.filter((d) => !expDocs.includes(d)) : [],
    };
    if (!result.ok || result.missingRecords.length || result.extraRecords.length || result.missingDocs.length || result.extraDocs.length) {
      report.failures.push(result);
    }
  }
  return report;
}

/** Latência do motor (ms) em `rounds` execuções de cada caso, após um aquecimento. */
export function measureLatency(rounds = 20, cases = evalCases) {
  cases.forEach((c) => ask(c.q, c.lang));
  const samples: number[] = [];
  for (let r = 0; r < rounds; r++) for (const c of cases) samples.push(ask(c.q, c.lang).elapsedMs);
  samples.sort((a, b) => a - b);
  const round = (v: number) => Math.round(v * 1000) / 1000;
  return { p50: round(pctile(samples, 50)), p95: round(pctile(samples, 95)), max: round(samples[samples.length - 1]), runs: samples.length };
}
