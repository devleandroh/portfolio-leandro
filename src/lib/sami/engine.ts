import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatters } from "@/lib/format";
import { decisions, milestones, people, personName, REFERENCE_DATE, risks, tasks } from "./atlas";
import {
  blockers,
  diffDays,
  executionOrder,
  forecast,
  isOverdue,
  milestoneById,
  milestoneForecasts,
  nextMilestone,
  openRisks,
  overdueTasks,
  pendingDecisions,
  projectSummary,
  riskLevel,
  riskScore,
  simulateDelay,
  taskById,
} from "./projects";
import { bestSentence, search, type Hit } from "./retrieval";
import { normalize, queryTerms, terms } from "./text";
import type { Decision, Milestone, Risk, RiskLevel, Task } from "./types";

/**
 * Motor de perguntas da demonstração da S.A.M.I.
 *
 *   pergunta → roteador por regras → consulta estruturada e/ou BM25 → resposta com fontes
 *
 * Nenhum modelo generativo participa: o texto é montado a partir dos registros
 * consultados e dos trechos recuperados, e cada resposta traz o rastro do que foi executado.
 */

export const MAX_QUERY_LENGTH = 300;

export type Mechanism = "structured" | "retrieval" | "hybrid" | "none";
export type Intent =
  | "delay_impact"
  | "blockers"
  | "risks"
  | "decisions"
  | "overdue"
  | "execution_order"
  | "milestone"
  | "owner_tasks"
  | "task_detail"
  | "project_status"
  | "document_search";

export interface RecordRef {
  id: string;
  kind: "task" | "risk" | "decision" | "milestone";
  label: string;
  detail: string;
}

export interface Passage {
  chunkId: string;
  docId: string;
  section: number;
  docTitle: string;
  heading: string;
  text: string;
  /** Frase do trecho com mais termos da consulta. */
  sentence: string;
  score: number;
  matched: string[];
  coverage: number;
}

export interface TraceStep {
  step: string;
  detail: string;
  ms: number;
}

export interface SamiAnswer {
  query: string;
  lang: Locale;
  intent: Intent | null;
  mechanism: Mechanism;
  noneReason?: "no_evidence" | "unsupported";
  lead: string;
  points: string[];
  records: RecordRef[];
  passages: Passage[];
  limitations: string[];
  trace: TraceStep[];
  elapsedMs: number;
}

/* ------------------------------------------------------------------ */
/* Roteamento                                                          */
/* ------------------------------------------------------------------ */

interface Entities {
  taskId?: string;
  milestoneId?: string;
  personId?: string;
  days?: number;
}

export interface Route {
  intent: Intent;
  entities: Entities;
  /** A pergunta pede onde está registrado / por quê → anexar trechos de documentos. */
  wantsEvidence: boolean;
  /** Regra que decidiu a intenção (exibida no rastro). */
  rule: string;
}

const NUMBER_WORDS: Record<string, number> = {
  um: 1, uma: 1, one: 1, a: 1, dois: 2, duas: 2, two: 2, tres: 3, three: 3, quatro: 4, four: 4, cinco: 5, five: 5,
  seis: 6, six: 6, sete: 7, seven: 7, oito: 8, eight: 8, nove: 9, nine: 9, dez: 10, ten: 10, quinze: 15, fifteen: 15,
  vinte: 20, twenty: 20, trinta: 30, thirty: 30,
};

const RX = {
  delay: /\b(atras\w*|adia\w*|posterg\w*|escorreg\w*|delay\w*|slip\w*|postpon\w*)\b/,
  hypothetical: /\b(o que acontece|e se|caso|impacto|consequencia\w*|what happens|what if|impact\w*|consequence\w*)\b/,
  blockers: /\b(bloque\w*|trava\w*|impede\w*|impedi\w*|block\w*|holding up|stuck)\b/,
  risks: /\b(risco\w*|ameac\w*|risk\w*|threat\w*)\b/,
  decisions: /\b(decis\w*|decid\w*|adrs?|decision\w*)\b/,
  overdue: /\b(atrasad\w*|vencid\w*|em atraso|overdue|late|behind schedule)\b/,
  order: /\b(primeiro|primeiras?|antes|prioridade\w*|priorizar|ordem|sequencia|first|priorit\w*|order|sequence|focus)\b/,
  milestone: /\b(marco\w*|entrega\w*|release\w*|go-?live|milestone\w*|deliver\w*|deadline\w*|prazo final)\b/,
  status: /\b(status|situacao|andamento|resumo|visao geral|overview|summary|progress|como esta|how is)\b/,
  evidence:
    /\b(onde|documentad\w*|registrad\w*|por que|porque|motivo\w*|causa\w*|fonte\w*|evidenc\w*|justific\w*|where|documented|recorded|why|reason\w*|cause\w*|source\w*|evidence|justif\w*)\b/,
  pending: /\b(pendente\w*|em aberto|abertas?|aguard\w*|a decidir|pending|open|undecided|awaiting|to be decided|outstanding)\b/,
  decided: /\b(tomad\w*|decidid\w*|aprovad\w*|made|taken|decided|approved)\b/,
  architecture: /\b(arquitet\w*|architect\w*|tecnic\w*|technical)\b/,
  critical: /\b(critic\w*|grave\w*|severo\w*|critical|severe)\b/,
  high: /\b(alto\w*|altas?|high)\b/,
  nextDelivery: /\b(proxim[oa] (entrega|marco|release)|next (delivery|milestone|release)|upcoming (delivery|milestone|release))\b/,
};

function findDays(q: string): number | undefined {
  const m = q.match(/\b(\d{1,3}|[a-z]+)\s+(dias?|days?|semanas?|weeks?)\b/);
  if (!m) return undefined;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUMBER_WORDS[m[1]];
  if (!n) return undefined;
  return /^(semana|week)/.test(m[2]) ? n * 7 : n;
}

/** Tarefa citada por ID ("T-05", "t05") ou por um apelido/título ("integração principal"). */
function findTask(q: string): string | undefined {
  const id = q.match(/\b([to])-?(\d{2})\b/);
  if (id) {
    const key = `${id[1].toUpperCase()}-${id[2]}`;
    if (taskById.has(key)) return key;
  }
  let best: { id: string; len: number } | undefined;
  for (const t of tasks) {
    const phrases = [t.title.pt, t.title.en, ...t.aliases.flatMap((a) => [a.pt, a.en])].map(normalize);
    for (const p of phrases) if (q.includes(p) && (!best || p.length > best.len)) best = { id: t.id, len: p.length };
  }
  return best?.id;
}

function findMilestone(q: string): string | undefined {
  if (RX.nextDelivery.test(q)) return nextMilestone().id;
  const m = q.match(/\bmo?([1-4])\b/);
  if (m) return milestoneById.has(m[0].toUpperCase()) ? m[0].toUpperCase() : undefined;
  if (/\brelease\s*1\b|\bmvp\b/.test(q)) return "M2";
  if (/\brelease\s*2\b/.test(q)) return "M3";
  if (/\bgo-?live\b/.test(q)) return "M4";
  return undefined;
}

function findPerson(q: string): string | undefined {
  return people.find((p) => new RegExp(`\\b${normalize(p.name.split(" ")[0])}\\b`).test(q))?.id;
}

export function route(query: string): Route {
  const q = normalize(query);
  const entities: Entities = {
    taskId: findTask(q),
    milestoneId: findMilestone(q),
    personId: findPerson(q),
    days: findDays(q),
  };
  const wantsEvidence = RX.evidence.test(q);
  const r = (intent: Intent, rule: string): Route => ({ intent, entities, wantsEvidence, rule });

  if (RX.delay.test(q) && (entities.days !== undefined || RX.hypothetical.test(q))) return r("delay_impact", "delay+days|hypothetical");
  if (RX.blockers.test(q)) return r("blockers", "blockers");
  if (RX.risks.test(q)) return r("risks", "risks");
  if (RX.decisions.test(q)) return r("decisions", "decisions");
  if (RX.overdue.test(q)) return r("overdue", "overdue");
  if (RX.order.test(q) && !entities.taskId) return r("execution_order", "order");
  if (entities.personId) return r("owner_tasks", "person");
  if (entities.taskId) return r("task_detail", "task");
  if (RX.milestone.test(q) || entities.milestoneId) return r("milestone", "milestone");
  if (RX.status.test(q)) return r("project_status", "status");
  return r("document_search", "fallback:bm25");
}

/* ------------------------------------------------------------------ */
/* Composição                                                          */
/* ------------------------------------------------------------------ */

type Draft = Omit<SamiAnswer, "query" | "lang" | "trace" | "elapsedMs" | "intent"> & { docsForEvidence?: string[]; evidenceTerms?: string[] };

function toPassage(h: Hit): Passage {
  return {
    chunkId: h.chunk.id,
    docId: h.chunk.docId,
    section: h.chunk.section,
    docTitle: h.chunk.docTitle,
    heading: h.chunk.heading,
    text: h.chunk.text,
    sentence: bestSentence(h.chunk.text, h.matched),
    score: Math.round(h.score * 100) / 100,
    matched: h.matched,
    coverage: Math.round(h.coverage * 100) / 100,
  };
}

export function ask(rawQuery: string, lang: Locale): SamiAnswer {
  const t0 = performance.now();
  let last = t0;
  const trace: TraceStep[] = [];
  const S = getDictionary(lang).sami.engine;
  const mark = (step: string, detail: string) => {
    const now = performance.now();
    trace.push({ step, detail, ms: Math.round((now - last) * 1000) / 1000 });
    last = now;
  };

  const query = rawQuery.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
  const rt = route(query);
  const ent = rt.entities;
  mark(
    S.trace.route,
    S.trace.routeDetail(
      rt.intent,
      rt.rule,
      Object.entries(ent)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${v}`),
    ),
  );

  const ctx = new Compose(lang);
  let draft: Draft;
  switch (rt.intent) {
    case "delay_impact":
      draft = ctx.delay(ent.taskId, ent.days);
      break;
    case "blockers":
      draft = ctx.blockers(ent.milestoneId, ent.taskId);
      break;
    case "risks":
      draft = ctx.risks(normalize(query), ent.milestoneId);
      break;
    case "decisions":
      draft = ctx.decisions(normalize(query), rt.wantsEvidence);
      break;
    case "overdue":
      draft = ctx.overdue();
      break;
    case "execution_order":
      draft = ctx.order();
      break;
    case "owner_tasks":
      draft = ctx.owner(ent.personId!);
      break;
    case "task_detail":
      draft = ctx.task(ent.taskId!);
      break;
    case "milestone":
      draft = ctx.milestone(ent.milestoneId);
      break;
    case "project_status":
      draft = ctx.status();
      break;
    default:
      draft = { mechanism: "retrieval", lead: "", points: [], records: [], passages: [], limitations: [] };
  }
  if (rt.intent !== "document_search") mark(S.trace.structured, S.trace.structuredDetail(draft.records.length));

  // Recuperação: busca livre, ou evidência para os registros de uma resposta estruturada.
  if (rt.intent === "document_search") {
    const res = search(lang, query);
    mark(S.trace.retrieval, S.trace.retrievalDetail(res.queryTerms, res.candidates, res.hits.length, requiredFor(res.queryTerms.length)));
    draft = ctx.searchAnswer(res.queryTerms, res.hits, res.bestRejected);
  } else if (draft.mechanism === "structured" && rt.wantsEvidence && draft.docsForEvidence?.length) {
    const q = [...new Set([...queryTerms(query), ...(draft.evidenceTerms ?? [])])];
    const res = search(lang, q, { onlyDocs: draft.docsForEvidence, limit: 3, minMatches: 2 });
    mark(S.trace.retrieval, S.trace.evidenceDetail(draft.docsForEvidence, res.hits.length));
    if (res.hits.length) {
      draft.passages = res.hits.map((h) => toPassage(h));
      draft.mechanism = "hybrid";
    } else {
      draft.limitations.push(S.common.noSupportingPassage);
    }
  }

  const { docsForEvidence: _d, evidenceTerms: _e, ...answer } = draft;
  void _d;
  void _e;
  mark(S.trace.compose, S.trace.composeDetail(answer.points.length, answer.records.length, answer.passages.length));
  return {
    query,
    lang,
    intent: answer.mechanism === "none" && answer.noneReason === "unsupported" ? null : rt.intent,
    ...answer,
    trace,
    elapsedMs: Math.round((performance.now() - t0) * 1000) / 1000,
  };
}

const requiredFor = (n: number) => (n <= 2 ? n : Math.ceil(n * 0.5));

class Compose {
  private S;
  private f;
  private fc = forecast();
  constructor(private lang: Locale) {
    this.S = getDictionary(lang).sami.engine;
    this.f = formatters(lang);
  }

  private d = (iso: string) => this.f.fmtDate(iso);
  private title = (t: Task | Risk | Decision | Milestone) => ("title" in t ? t.title : t.name)[this.lang];

  private taskRef(t: Task): RecordRef {
    const S = this.S;
    const late = isOverdue(t) ? ` · ${S.common.daysLate(diffDays(REFERENCE_DATE, t.due))}` : "";
    return {
      id: t.id,
      kind: "task",
      label: this.title(t),
      detail: `${S.status[t.status]} · ${personName(t.owner)} · ${S.common.due} ${this.d(t.due)}${late}`,
    };
  }
  private riskRef(r: Risk): RecordRef {
    return { id: r.id, kind: "risk", label: this.title(r), detail: `${this.S.level[riskLevel(r)]} · P${r.probability}×I${r.impact} = ${riskScore(r)}` };
  }
  private decisionRef(d: Decision): RecordRef {
    const S = this.S;
    return {
      id: d.id,
      kind: "decision",
      label: this.title(d),
      detail: `${S.decisionStatus[d.status]} · ${d.status === "decided" ? this.d(d.date) : `${S.common.decideBy} ${this.d(d.date)}`} · ${d.doc}`,
    };
  }
  private milestoneRef(m: Milestone): RecordRef {
    const mf = milestoneForecasts(this.fc).find((x) => x.milestone.id === m.id)!;
    return { id: m.id, kind: "milestone", label: this.title(m), detail: `${this.S.common.due} ${this.d(m.due)} · ${this.S.common.projected} ${this.d(mf.projected)}` };
  }
  private refs(...groups: RecordRef[][]): RecordRef[] {
    const seen = new Map<string, RecordRef>();
    for (const g of groups) for (const r of g) if (!seen.has(r.id)) seen.set(r.id, r);
    return [...seen.values()];
  }
  private list = (ids: string[]) => ids.join(", ");
  private base(): Pick<Draft, "passages" | "limitations"> {
    return { passages: [], limitations: [] };
  }

  /* ---------- atraso hipotético ---------- */
  delay(taskId: string | undefined, days: number | undefined): Draft {
    const S = this.S.delay;
    if (!taskId) {
      const examples = ["T-05", "T-06", "O-02"].map((id) => `${id} (${this.title(taskById.get(id)!)})`);
      return { mechanism: "none", noneReason: "unsupported", lead: S.needTask, points: [S.examples(examples)], records: [], ...this.base() };
    }
    const task = taskById.get(taskId)!;
    if (task.status === "done") {
      return { mechanism: "structured", lead: S.alreadyDone(task.id, this.title(task), this.d(task.finished!)), points: [], records: [this.taskRef(task)], ...this.base() };
    }
    if (!days) {
      const fc = this.fc.get(taskId)!;
      const sim = simulateDelay(taskId, Math.max(fc.slack, 0) + 1);
      return {
        mechanism: "structured",
        lead: S.noDays(task.id, this.title(task), fc.slack, this.d(fc.finish)),
        points: [
          S.successors(sim.shifted.filter((s) => s.task.id !== taskId).map((s) => s.task.id)),
          ...sim.milestones.map((m) => S.firstImpact(m.milestone.id, this.title(m.milestone), Math.max(fc.slack, 0) + 1)),
        ],
        records: this.refs([this.taskRef(task)], sim.milestones.map((m) => this.milestoneRef(m.milestone))),
        ...this.base(),
        limitations: [this.S.common.calendarDays, S.askDays],
        docsForEvidence: task.docs,
        evidenceTerms: terms(this.title(task)),
      };
    }
    const sim = simulateDelay(taskId, days);
    const points = [
      ...sim.shifted.map((s) => S.shift(s.task.id, this.title(s.task), this.d(s.before), this.d(s.after), s.shift)),
      ...(sim.absorbed.length ? [S.absorbed(this.list(sim.absorbed.map((t) => t.id)))] : []),
      ...(sim.milestones.length
        ? sim.milestones.map((m) => S.milestone(m.milestone.id, this.title(m.milestone), this.d(m.milestone.due), this.d(m.before), this.d(m.after), m.slipAfter))
        : [S.noMilestone]),
    ];
    const worst = sim.milestones.filter((m) => m.slipAfter > 0);
    return {
      mechanism: "structured",
      lead: S.lead(task.id, this.title(task), days, sim.shifted.length - 1, worst.map((m) => m.milestone.id)),
      points,
      records: this.refs(
        [this.taskRef(task)],
        sim.shifted.map((s) => this.taskRef(s.task)),
        sim.milestones.map((m) => this.milestoneRef(m.milestone)),
      ),
      ...this.base(),
      limitations: [this.S.common.calendarDays, S.noReplan],
      docsForEvidence: task.docs,
      evidenceTerms: terms(this.title(task)),
    };
  }

  /* ---------- bloqueios ---------- */
  blockers(milestoneId?: string, taskId?: string): Draft {
    const S = this.S.blockers;
    const list = blockers({ milestone: milestoneId, taskId });
    const m = milestoneId ? milestoneById.get(milestoneId) : undefined;
    const scope = taskId ? `${taskId}` : m ? `${m.id} (${this.title(m)})` : this.S.common.projectAtlas;
    if (!list.length) {
      return {
        mechanism: "structured",
        lead: S.none(scope),
        points: [],
        records: this.refs(taskId ? [this.taskRef(taskById.get(taskId)!)] : [], m ? [this.milestoneRef(m)] : []),
        ...this.base(),
      };
    }
    const points = list.flatMap((b) => {
      const roots = b.roots.map((r) => S.root(r.id, this.title(r), personName(r.owner), this.d(r.due), isOverdue(r) ? diffDays(REFERENCE_DATE, r.due) : 0, r.project !== b.task.project));
      return [
        S.item(b.task.id, this.title(b.task), personName(b.task.owner), this.list(b.waitingOn.map((w) => w.id)), b.task.blockedReason?.[this.lang] ?? ""),
        ...roots,
        S.impact(b.impacted.length, this.list(b.impacted.map((t) => t.id)), this.list(b.milestones)),
      ];
    });
    return {
      mechanism: "structured",
      lead: S.lead(list.length, scope),
      points,
      records: this.refs(
        list.map((b) => this.taskRef(b.task)),
        list.flatMap((b) => b.roots.map((t) => this.taskRef(t))),
        m ? [this.milestoneRef(m)] : [],
      ),
      ...this.base(),
      limitations: [S.definition],
      docsForEvidence: [...new Set(list.flatMap((b) => [...b.task.docs, ...b.roots.flatMap((r) => r.docs)]))],
      evidenceTerms: list.flatMap((b) => terms(this.title(b.task))),
    };
  }

  /* ---------- riscos ---------- */
  risks(q: string, milestoneId?: string): Draft {
    const S = this.S.risks;
    const level: RiskLevel[] | undefined = RX.critical.test(q) ? ["critical"] : RX.high.test(q) ? ["critical", "high"] : undefined;
    const list = openRisks({ level, milestone: milestoneId });
    const m = milestoneId ? milestoneById.get(milestoneId) : undefined;
    const scope = m ? `${m.id} (${this.title(m)})` : this.S.common.projectAtlas;
    const mitigated = risks.filter((r) => r.status === "mitigated").length;
    return {
      mechanism: "structured",
      lead: list.length ? S.lead(list.length, level ? level.map((l) => this.S.level[l]).join("/") : "", scope) : S.none(scope),
      points: list.map((r) =>
        S.item(r.id, this.title(r), this.S.level[riskLevel(r)], r.probability, r.impact, riskScore(r), this.list(r.tasks), r.mitigation[this.lang]),
      ),
      records: this.refs(list.map((r) => this.riskRef(r)), m ? [this.milestoneRef(m)] : []),
      ...this.base(),
      limitations: [S.scale, ...(mitigated ? [S.mitigatedHidden(mitigated)] : [])],
      docsForEvidence: [...new Set(list.flatMap((r) => r.docs))],
      evidenceTerms: list.flatMap((r) => terms(this.title(r))),
    };
  }

  /* ---------- decisões ---------- */
  decisions(q: string, wantsEvidence: boolean): Draft {
    const S = this.S.decisions;
    const status = RX.pending.test(q) ? "pending" : RX.decided.test(q) ? "decided" : undefined;
    const arch = RX.architecture.test(q);
    let list = status === "pending" ? pendingDecisions() : decisions.filter((d) => !status || d.status === status);
    if (arch) list = list.filter((d) => d.category === "architecture");
    const filterLabel = [status ? this.S.decisionStatus[status] : "", arch ? S.architecture : ""].filter(Boolean).join(", ");

    const points = list.map((d) =>
      d.status === "decided"
        ? S.decided(d.id, this.title(d), this.d(d.date), personName(d.owner), d.doc)
        : S.pending(d.id, this.title(d), this.d(d.date), diffDays(d.date, REFERENCE_DATE), personName(d.owner), d.doc),
    );
    const draft: Draft = {
      mechanism: "structured",
      lead: list.length ? S.lead(list.length, filterLabel) : S.none(filterLabel),
      points,
      records: list.map((d) => this.decisionRef(d)),
      ...this.base(),
    };
    if (wantsEvidence && list.length) {
      // Para cada decisão, o trecho do documento de origem que melhor descreve a decisão.
      const passages = list.flatMap((d) => {
        const hit = search(this.lang, [...terms(this.title(d)), ...terms(S.headingHint)], { onlyDocs: [d.doc], limit: 1, minMatches: 1 }).hits[0];
        return hit ? [toPassage(hit)] : [];
      });
      if (passages.length) {
        draft.passages = passages;
        draft.mechanism = "hybrid";
      }
      if (passages.length < list.length) draft.limitations.push(this.S.common.noSupportingPassage);
    }
    return draft;
  }

  /* ---------- atrasadas ---------- */
  overdue(): Draft {
    const S = this.S.overdue;
    const list = overdueTasks();
    return {
      mechanism: "structured",
      lead: list.length ? S.lead(list.length, this.d(REFERENCE_DATE)) : S.none(this.d(REFERENCE_DATE)),
      points: list.map((t) =>
        S.item(t.id, this.title(t), personName(t.owner), this.d(t.due), diffDays(REFERENCE_DATE, t.due), this.S.status[t.status], this.d(this.fc.get(t.id)!.finish)),
      ),
      records: list.map((t) => this.taskRef(t)),
      ...this.base(),
      limitations: [S.definition],
      docsForEvidence: [...new Set(list.flatMap((t) => t.docs))],
      evidenceTerms: list.flatMap((t) => terms(this.title(t))),
    };
  }

  /* ---------- ordem de execução ---------- */
  order(): Draft {
    const S = this.S.order;
    const top = executionOrder(this.fc).slice(0, 6);
    return {
      mechanism: "structured",
      lead: S.lead(top.length),
      points: top.map((x, i) => S.item(i + 1, x.task.id, this.title(x.task), x.slack, this.S.priority[x.task.priority], x.task.milestone)),
      records: top.map((x) => this.taskRef(x.task)),
      ...this.base(),
      limitations: [S.criterion, this.S.common.calendarDays],
    };
  }

  /* ---------- tarefas de uma pessoa ---------- */
  owner(personId: string): Draft {
    const S = this.S.owner;
    const list = tasks.filter((t) => t.owner === personId).sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.due.localeCompare(b.due));
    const person = people.find((p) => p.id === personId)!;
    return {
      mechanism: "structured",
      lead: S.lead(person.name, person.role[this.lang], list.filter((t) => t.status !== "done").length, list.length),
      points: list.map((t) => S.item(t.id, this.title(t), this.S.status[t.status], this.d(t.due))),
      records: list.map((t) => this.taskRef(t)),
      ...this.base(),
    };
  }

  /* ---------- detalhe de uma tarefa ---------- */
  task(taskId: string): Draft {
    const S = this.S.task;
    const t = taskById.get(taskId)!;
    const fc = this.fc.get(taskId)!;
    const deps = t.dependsOn.map((id) => taskById.get(id)!);
    const dependents = tasks.filter((x) => x.dependsOn.includes(taskId));
    const linkedRisks = risks.filter((r) => r.tasks.includes(taskId));
    const points = [
      S.owner(personName(t.owner), this.S.priority[t.priority], this.S.status[t.status]),
      S.dates(this.d(t.start), this.d(t.due), t.status === "done" ? this.d(t.finished!) : this.d(fc.finish), t.status === "done", fc.slack),
      ...(t.blockedReason ? [S.blocked(t.blockedReason[this.lang])] : []),
      S.deps(deps.length ? deps.map((x) => `${x.id} (${this.S.status[x.status]})`).join(", ") : "—"),
      S.dependents(dependents.length ? this.list(dependents.map((x) => x.id)) : "—"),
      ...(linkedRisks.length ? [S.risks(this.list(linkedRisks.map((r) => r.id)))] : []),
      S.docs(this.list(t.docs)),
    ];
    return {
      mechanism: "structured",
      lead: S.lead(t.id, this.title(t), milestoneById.get(t.milestone)!.id),
      points,
      records: this.refs([this.taskRef(t)], deps.map((x) => this.taskRef(x)), linkedRisks.map((r) => this.riskRef(r))),
      ...this.base(),
      docsForEvidence: t.docs,
      evidenceTerms: terms(this.title(t)),
    };
  }

  /* ---------- marcos ---------- */
  milestone(milestoneId?: string): Draft {
    const S = this.S.milestone;
    const all = milestoneForecasts(this.fc).filter((m) => !m.milestone.reached);
    const list = milestoneId ? all.filter((m) => m.milestone.id === milestoneId) : all.filter((m) => m.milestone.project === "ATLAS");
    if (!list.length) {
      const m = milestones.find((x) => x.id === milestoneId)!;
      return { mechanism: "structured", lead: S.reached(m.id, this.title(m), this.d(m.reached!)), points: [], records: [this.milestoneRef(m)], ...this.base() };
    }
    const points = list.map((m) => {
      const critical = tasks.filter((t) => t.milestone === m.milestone.id && t.status !== "done" && this.fc.get(t.id)!.slack <= 0).map((t) => t.id);
      return S.item(m.milestone.id, this.title(m.milestone), this.d(m.milestone.due), this.d(m.projected), m.slip, m.openTasks, this.list(critical));
    });
    return {
      mechanism: "structured",
      lead: S.lead(list.length),
      points,
      records: list.map((m) => this.milestoneRef(m.milestone)),
      ...this.base(),
      limitations: [this.S.common.calendarDays],
    };
  }

  /* ---------- situação geral ---------- */
  status(): Draft {
    const S = this.S.summary;
    const s = projectSummary();
    const next = milestoneForecasts(this.fc).find((m) => m.milestone.id === nextMilestone().id)!;
    const blocked = blockers();
    return {
      mechanism: "structured",
      lead: S.lead(s.total, s.byStatus.done, s.byStatus.in_progress, s.byStatus.blocked, s.byStatus.todo),
      points: [
        S.overdue(s.overdue),
        S.next(next.milestone.id, this.title(next.milestone), this.d(next.milestone.due), this.d(next.projected), next.slip),
        S.risks(s.criticalRisks),
        S.decisions(s.pendingDecisions),
      ],
      records: this.refs([this.milestoneRef(next.milestone)], blocked.map((b) => this.taskRef(b.task))),
      ...this.base(),
    };
  }

  /* ---------- busca documental ---------- */
  searchAnswer(qTerms: string[], hits: Hit[], bestRejected?: Hit): Draft {
    const S = this.S.search;
    if (qTerms.length === 0) {
      return { mechanism: "none", noneReason: "no_evidence", lead: S.noTerms, points: [S.tryExamples], records: [], ...this.base() };
    }
    if (!hits.length) {
      return {
        mechanism: "none",
        noneReason: "no_evidence",
        lead: S.noEvidence,
        points: [
          S.searched(qTerms.join(", ")),
          bestRejected
            ? S.closest(bestRejected.chunk.id, bestRejected.matched.length, qTerms.length, requiredFor(qTerms.length))
            : S.nothingMatched,
        ],
        records: [],
        ...this.base(),
        limitations: [S.lexicalLimit, S.corpusLimit],
      };
    }
    const passages = hits.map((h) => toPassage(h));
    return {
      mechanism: "retrieval",
      lead: S.lead(passages.length, new Set(passages.map((p) => p.docId)).size),
      points: passages.map((p) => S.quote(p.sentence, p.chunkId)),
      records: [],
      passages,
      limitations: [S.extractive, S.lexicalLimit],
    };
  }
}
