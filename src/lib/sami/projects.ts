import { decisions, milestones, REFERENCE_DATE, risks, tasks } from "./atlas";
import type { Milestone, Priority, Risk, RiskLevel, Task } from "./types";

/**
 * Consultas determinísticas sobre os registros do Projeto Atlas (funções puras).
 *
 * O cronograma é projetado como no método do caminho crítico, em dias corridos:
 * - passagem para frente: cada tarefa começa no maior entre o início planejado, a data
 *   de referência e o dia seguinte ao fim da última dependência;
 * - passagem para trás: o fim mais tarde permitido vem do prazo do marco e do início
 *   mais tarde das sucessoras; a diferença é a folga.
 */

const DAY = 86_400_000;
export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY);
const maxIso = (a: string, b: string) => (a > b ? a : b);

const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const taskById = new Map(tasks.map((t) => [t.id, t]));
export const milestoneById = new Map(milestones.map((m) => [m.id, m]));

export const isOpen = (t: Task) => t.status !== "done";
export const isOverdue = (t: Task, ref = REFERENCE_DATE) => isOpen(t) && t.due < ref;
const openDeps = (t: Task) => t.dependsOn.map((id) => taskById.get(id)!).filter(isOpen);

/* ------------------------------------------------------------------ */
/* Projeção do cronograma                                              */
/* ------------------------------------------------------------------ */

export interface TaskForecast {
  start: string;
  finish: string;
  /** Fim mais tarde sem atrasar marcos; folga = latestFinish − finish (negativa = já atrasa). */
  latestFinish: string;
  slack: number;
}

/** Projeta início/fim de todas as tarefas. `extraDelay` acrescenta dias ao fim de tarefas específicas. */
export function forecast(extraDelay: Record<string, number> = {}, ref = REFERENCE_DATE): Map<string, TaskForecast> {
  const span = new Map<string, { start: string; finish: string }>();

  const visit = (t: Task): { start: string; finish: string } => {
    const known = span.get(t.id);
    if (known) return known;
    let start: string;
    let finish: string;
    if (t.status === "done") {
      start = t.start;
      finish = t.finished!;
    } else {
      const depsEnd = t.dependsOn.map((id) => visit(taskById.get(id)!).finish).reduce(maxIso, "");
      const earliest = maxIso(maxIso(t.start, ref), depsEnd ? addDays(depsEnd, 1) : "");
      const duration = t.status === "todo" ? diffDays(t.due, t.start) + 1 : t.remaining!;
      start = t.status === "in_progress" ? maxIso(ref, depsEnd ? addDays(depsEnd, 1) : "") : earliest;
      finish = addDays(start, duration - 1);
    }
    finish = addDays(finish, extraDelay[t.id] ?? 0);
    const s = { start, finish };
    span.set(t.id, s);
    return s;
  };
  tasks.forEach(visit);

  // Passagem para trás, das tarefas sem sucessoras para as anteriores.
  const successors = new Map<string, Task[]>();
  for (const t of tasks) for (const d of t.dependsOn) successors.set(d, [...(successors.get(d) ?? []), t]);
  const latest = new Map<string, string>();
  const late = (t: Task): string => {
    const known = latest.get(t.id);
    if (known) return known;
    let lf = milestoneById.get(t.milestone)!.due;
    for (const s of successors.get(t.id) ?? []) {
      if (!isOpen(s)) continue;
      const sSpan = span.get(s.id)!;
      const sDuration = diffDays(sSpan.finish, sSpan.start) + 1;
      const sLatestStart = addDays(late(s), -(sDuration - 1));
      const candidate = addDays(sLatestStart, -1);
      if (candidate < lf) lf = candidate;
    }
    latest.set(t.id, lf);
    return lf;
  };

  const out = new Map<string, TaskForecast>();
  for (const t of tasks) {
    const s = span.get(t.id)!;
    const lf = late(t);
    out.set(t.id, { ...s, latestFinish: lf, slack: diffDays(lf, s.finish) });
  }
  return out;
}

export interface MilestoneForecast {
  milestone: Milestone;
  projected: string;
  /** Dias de atraso projetado (negativo = folga). */
  slip: number;
  openTasks: number;
}

export function milestoneForecasts(fc = forecast()): MilestoneForecast[] {
  return milestones.map((m) => {
    const ts = tasks.filter((t) => t.milestone === m.id);
    const projected = m.reached ?? ts.map((t) => fc.get(t.id)!.finish).reduce(maxIso, "");
    return { milestone: m, projected, slip: m.reached ? 0 : diffDays(projected, m.due), openTasks: ts.filter(isOpen).length };
  });
}

/** Próxima entrega: o marco aberto do Atlas com o prazo mais próximo. */
export function nextMilestone(project = "ATLAS"): Milestone {
  return milestones.filter((m) => m.project === project && !m.reached).sort((a, b) => a.due.localeCompare(b.due))[0];
}

/* ------------------------------------------------------------------ */
/* Bloqueios e causas                                                  */
/* ------------------------------------------------------------------ */

const isProblem = (t: Task) => t.status === "blocked" || isOverdue(t);

/** Tarefas que dependem, direta ou indiretamente, de `id`. */
export function downstream(id: string): Task[] {
  const out = new Map<string, Task>();
  const walk = (cur: string) => {
    for (const t of tasks) {
      if (t.dependsOn.includes(cur) && !out.has(t.id)) {
        out.set(t.id, t);
        walk(t.id);
      }
    }
  };
  walk(id);
  return [...out.values()];
}

/** Causas-raiz: tarefas problemáticas alcançáveis pelas dependências abertas e que não dependem de outra problemática. */
export function rootCauses(id: string): Task[] {
  const out = new Map<string, Task>();
  const seen = new Set<string>();
  const walk = (t: Task) => {
    if (seen.has(t.id)) return;
    seen.add(t.id);
    const problemDeps = openDeps(t).filter(isProblem);
    if (problemDeps.length === 0 && isProblem(t) && t.id !== id) out.set(t.id, t);
    for (const d of openDeps(t)) walk(d);
  };
  walk(taskById.get(id)!);
  return [...out.values()];
}

export interface Blocker {
  task: Task;
  waitingOn: Task[];
  roots: Task[];
  impacted: Task[];
  milestones: string[];
}

/** Tarefas bloqueadas, com o que esperam, a causa-raiz e o que travam adiante. */
export function blockers(scope?: { milestone?: string; taskId?: string }): Blocker[] {
  let list = tasks.filter((t) => t.status === "blocked");
  if (scope?.taskId) {
    const target = taskById.get(scope.taskId)!;
    const chain = new Set([target.id, ...rootCauses(target.id).map((t) => t.id)]);
    // Inclui bloqueios que estão no caminho da tarefa perguntada.
    const upstream = new Set<string>();
    const walk = (t: Task) => openDeps(t).forEach((d) => (upstream.add(d.id), walk(d)));
    walk(target);
    list = list.filter((t) => chain.has(t.id) || upstream.has(t.id));
  }
  if (scope?.milestone) {
    const ms = scope.milestone;
    list = list.filter((t) => t.milestone === ms || downstream(t.id).some((d) => d.milestone === ms));
  }
  return list.map((task) => {
    const impacted = downstream(task.id).filter(isOpen);
    return {
      task,
      waitingOn: openDeps(task),
      roots: rootCauses(task.id),
      impacted,
      milestones: [...new Set([task.milestone, ...impacted.map((t) => t.milestone)])],
    };
  });
}

export const overdueTasks = (ref = REFERENCE_DATE) => tasks.filter((t) => isOverdue(t, ref)).sort((a, b) => a.due.localeCompare(b.due));

/* ------------------------------------------------------------------ */
/* Simulação de atraso                                                 */
/* ------------------------------------------------------------------ */

export interface DelayImpact {
  task: Task;
  days: number;
  shifted: { task: Task; before: string; after: string; shift: number }[];
  /** Tarefas sucessoras que absorveram o atraso pela folga. */
  absorbed: Task[];
  milestones: { milestone: Milestone; before: string; after: string; slipBefore: number; slipAfter: number }[];
}

export function simulateDelay(taskId: string, days: number): DelayImpact {
  const task = taskById.get(taskId)!;
  const base = forecast();
  const delayed = forecast({ [taskId]: days });
  const shifted = tasks
    .filter((t) => isOpen(t))
    .map((t) => ({ task: t, before: base.get(t.id)!.finish, after: delayed.get(t.id)!.finish }))
    .map((x) => ({ ...x, shift: diffDays(x.after, x.before) }))
    .filter((x) => x.shift > 0)
    .sort((a, b) => a.after.localeCompare(b.after) || a.task.id.localeCompare(b.task.id));
  const shiftedIds = new Set(shifted.map((s) => s.task.id));
  const absorbed = downstream(taskId).filter((t) => isOpen(t) && !shiftedIds.has(t.id));
  const mBefore = milestoneForecasts(base);
  const mAfter = milestoneForecasts(delayed);
  const ms = mBefore
    .map((b, i) => ({ milestone: b.milestone, before: b.projected, after: mAfter[i].projected, slipBefore: b.slip, slipAfter: mAfter[i].slip }))
    .filter((m) => m.before !== m.after);
  return { task, days, shifted, absorbed, milestones: ms };
}

/* ------------------------------------------------------------------ */
/* Ordem de execução                                                   */
/* ------------------------------------------------------------------ */

/**
 * Ordem sugerida para as tarefas abertas: respeita as dependências (ordenação topológica)
 * e, entre as liberadas, escolhe a de menor folga, depois a de maior prioridade.
 */
export function executionOrder(fc = forecast()): { task: Task; slack: number }[] {
  const open = tasks.filter(isOpen);
  const pending = new Set(open.map((t) => t.id));
  const out: { task: Task; slack: number }[] = [];
  while (pending.size) {
    const ready = open.filter((t) => pending.has(t.id) && t.dependsOn.every((d) => !pending.has(d)));
    ready.sort(
      (a, b) =>
        fc.get(a.id)!.slack - fc.get(b.id)!.slack ||
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        fc.get(a.id)!.start.localeCompare(fc.get(b.id)!.start),
    );
    const next = ready[0];
    pending.delete(next.id);
    out.push({ task: next, slack: fc.get(next.id)!.slack });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Riscos e decisões                                                   */
/* ------------------------------------------------------------------ */

export const riskScore = (r: Risk) => r.probability * r.impact;

/** Severidade pela matriz probabilidade × impacto (1–25). */
export function riskLevel(r: Risk): RiskLevel {
  const s = riskScore(r);
  return s >= 15 ? "critical" : s >= 10 ? "high" : s >= 5 ? "medium" : "low";
}

export function openRisks({ level, milestone }: { level?: RiskLevel[]; milestone?: string } = {}): Risk[] {
  return risks
    .filter((r) => r.status === "open")
    .filter((r) => !level || level.includes(riskLevel(r)))
    .filter((r) => !milestone || r.tasks.some((id) => taskById.get(id)!.milestone === milestone))
    .sort((a, b) => riskScore(b) - riskScore(a) || a.id.localeCompare(b.id));
}

export const pendingDecisions = () => decisions.filter((d) => d.status === "pending").sort((a, b) => a.date.localeCompare(b.date));

/** Visão geral usada no painel e na pergunta "qual a situação do projeto?". */
export function projectSummary(project = "ATLAS") {
  const ts = tasks.filter((t) => t.project === project);
  const byStatus = { done: 0, in_progress: 0, blocked: 0, todo: 0 };
  ts.forEach((t) => byStatus[t.status]++);
  return {
    total: ts.length,
    byStatus,
    overdue: ts.filter((t) => isOverdue(t)).length,
    criticalRisks: openRisks({ level: ["critical"] }).filter((r) => r.project === project).length,
    pendingDecisions: pendingDecisions().filter((d) => d.project === project).length,
  };
}
