import Link from "next/link";
import { FileText } from "lucide-react";
import { Kpi } from "@/components/ui/dashboard";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatters } from "@/lib/format";
import { decisions, personName, projects, REFERENCE_DATE, risks, tasks } from "@/lib/sami/atlas";
import { documents } from "@/lib/sami/documents";
import { forecast, isOverdue, milestoneForecasts, projectSummary, riskLevel, riskScore } from "@/lib/sami/projects";
import type { RiskLevel, TaskStatus } from "@/lib/sami/types";
import { RefText } from "./RefText";

const STATUS_STYLE: Record<TaskStatus, string> = {
  done: "bg-good/10 text-good-text",
  in_progress: "bg-accent-soft/60 text-accent-strong",
  blocked: "bg-critical/10 text-critical",
  todo: "bg-wash text-ink-2",
};

const LEVEL_DOT: Record<RiskLevel, string> = { critical: "bg-critical", high: "bg-serious", medium: "bg-warning", low: "bg-good" };

/** Linhas com destaque quando abertas por uma referência do chat (#rec-T-05). */
const ROW = "scroll-mt-24 border-t border-line target:bg-accent-soft/40";

/** Painel do Projeto Atlas: lê os mesmos registros e cálculos usados pelo motor do chat. */
export function AtlasPanel({ lang }: { lang: Locale }) {
  const d = getDictionary(lang).sami;
  const t = d.panel;
  const e = d.engine;
  const { fmtDate } = formatters(lang);
  const fc = forecast();
  const summary = projectSummary();
  const ms = milestoneForecasts(fc);

  const slackText = (n: number) => (n < 0 ? t.milestones.late(-n) : n === 0 ? "0" : `+${n}`);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label={t.kpis.tasks} value={String(summary.total)} hint={`${summary.byStatus.done} ${e.status.done}`} />
        <Kpi label={t.kpis.overdue} value={String(summary.overdue)} tone={summary.overdue ? "critical" : undefined} />
        <Kpi label={t.kpis.blocked} value={String(summary.byStatus.blocked)} tone={summary.byStatus.blocked ? "critical" : undefined} />
        <Kpi label={t.kpis.criticalRisks} value={String(summary.criticalRisks)} tone={summary.criticalRisks ? "warning" : undefined} />
        <Kpi label={t.kpis.pendingDecisions} value={String(summary.pendingDecisions)} tone={summary.pendingDecisions ? "warning" : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card title={t.projects}>
          <ul className="space-y-3 text-sm">
            {projects.map((p) => (
              <li key={p.id}>
                <p className="font-medium">
                  <span className="font-mono text-xs text-muted">{p.id}</span> {p.name[lang]}
                </p>
                <p className="mt-0.5 text-ink-2">{p.summary[lang]}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted">
                  {personName(p.owner)} · {fmtDate(p.start)} → {fmtDate(p.end)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-xs text-ink-2">
            <RefText lang={lang} text={t.dependsOnOrion} />
          </p>
        </Card>

        <Card title={t.milestones.title}>
          <ul className="divide-y divide-line text-sm">
            {ms.map((m) => (
              <li key={m.milestone.id} id={`rec-${m.milestone.id}`} className="scroll-mt-24 py-2 target:bg-accent-soft/40">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p>
                    <span className="font-mono text-xs text-muted">{m.milestone.id}</span> {m.milestone.name[lang]}
                  </p>
                  <span
                    className={`font-mono text-[11px] ${m.milestone.reached ? "text-good-text" : m.slip > 0 ? "text-critical" : m.slip === 0 ? "text-[#7a5200]" : "text-good-text"}`}
                  >
                    {m.milestone.reached
                      ? t.milestones.reached(fmtDate(m.milestone.reached))
                      : m.slip > 0
                        ? t.milestones.late(m.slip)
                        : m.slip === 0
                          ? t.milestones.onTime
                          : t.milestones.slack(-m.slip)}
                  </span>
                </div>
                {!m.milestone.reached && (
                  <p className="mt-0.5 font-mono text-[11px] text-muted">
                    {t.milestones.due} {fmtDate(m.milestone.due)} · {t.milestones.projected} {fmtDate(m.projected)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title={t.tasks.title} flush>
        <p className="px-4 pb-2 text-xs text-muted md:hidden">{t.scrollHint}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="font-mono text-[11px] tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-2 font-normal">{t.tasks.id}</th>
                <th className="px-2 py-2 font-normal">{t.tasks.task}</th>
                <th className="px-2 py-2 font-normal">{t.tasks.owner}</th>
                <th className="px-2 py-2 font-normal">{t.tasks.status}</th>
                <th className="px-2 py-2 font-normal">{t.tasks.priority}</th>
                <th className="px-2 py-2 font-normal">{t.tasks.due}</th>
                <th className="px-2 py-2 font-normal">{t.tasks.forecast}</th>
                <th className="px-2 py-2 text-right font-normal">{t.tasks.slack}</th>
                <th className="px-4 py-2 font-normal">{t.tasks.deps}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const f = fc.get(task.id)!;
                const late = isOverdue(task);
                return (
                  <tr key={task.id} id={`rec-${task.id}`} className={ROW}>
                    <td className="px-4 py-2 font-mono text-xs">{task.id}</td>
                    <td className="px-2 py-2">
                      {task.title[lang]}
                      {task.project !== "ATLAS" && <span className="ml-1.5 font-mono text-[10px] text-muted">{task.project}</span>}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-ink-2">{personName(task.owner)}</td>
                    <td className="px-2 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs whitespace-nowrap ${STATUS_STYLE[task.status]}`}>{e.status[task.status]}</span>
                    </td>
                    <td className="px-2 py-2 text-xs text-ink-2">{e.priority[task.priority]}</td>
                    <td className={`tabular px-2 py-2 whitespace-nowrap ${late ? "font-medium text-critical" : "text-ink-2"}`}>{fmtDate(task.due)}</td>
                    <td className="tabular px-2 py-2 whitespace-nowrap text-ink-2">{fmtDate(task.status === "done" ? task.finished : f.finish)}</td>
                    <td className={`tabular px-2 py-2 text-right font-mono text-xs ${task.status === "done" ? "text-muted" : f.slack < 0 ? "text-critical" : f.slack === 0 ? "text-[#7a5200]" : "text-ink-2"}`}>
                      {task.status === "done" ? "—" : slackText(f.slack)}
                    </td>
                    <td className="px-4 py-2 text-xs">{task.dependsOn.length ? <RefText lang={lang} text={task.dependsOn.join(", ")} /> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={t.risks.title} flush>
          <ul>
            {risks.map((r) => (
              <li key={r.id} id={`rec-${r.id}`} className={`${ROW} px-4 py-3 text-sm first:border-t-0`}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-xs text-muted">{r.id}</span>
                  <span className="font-medium">{r.title[lang]}</span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className={`h-2 w-2 rounded-full ${r.status === "mitigated" ? "bg-axis" : LEVEL_DOT[riskLevel(r)]}`} />
                    {r.status === "mitigated" ? t.risks.mitigated : e.level[riskLevel(r)]}
                  </span>
                  <span className="font-mono">
                    {t.risks.score} {r.probability}×{r.impact} = {riskScore(r)}
                  </span>
                  <span>
                    {t.risks.tasks}: <RefText lang={lang} text={r.tasks.join(", ")} />
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-2">
                  {t.risks.mitigation}: <RefText lang={lang} text={r.mitigation[lang]} />
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={t.decisions.title} flush>
          <ul>
            {decisions.map((dec) => (
              <li key={dec.id} id={`rec-${dec.id}`} className={`${ROW} px-4 py-3 text-sm first:border-t-0`}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-xs text-muted">{dec.id}</span>
                  <span className="font-medium">{dec.title[lang]}</span>
                </div>
                <p className="mt-1 text-xs text-ink-2">{dec.summary[lang]}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 font-mono text-[11px] text-muted">
                  <span className={dec.status === "pending" ? "text-[#7a5200]" : "text-good-text"}>{e.decisionStatus[dec.status]}</span>
                  <span>{dec.status === "pending" ? `${e.common.decideBy} ${fmtDate(dec.date)}` : fmtDate(dec.date)}</span>
                  <span>
                    {t.decisions.doc}: <RefText lang={lang} text={dec.doc} />
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title={t.documents.title}>
        <p className="text-sm text-ink-2">{t.documents.text}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={localePath(lang, `/sami/docs/${doc.id}`)}
                className="flex h-full items-start gap-2.5 rounded-md border border-line bg-page p-3 transition-colors hover:border-accent"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
                <span className="min-w-0">
                  <span className="block font-mono text-[11px] text-muted">
                    {doc.id} · {d.docs.types[doc.type]} · {fmtDate(doc.date)}
                  </span>
                  <span className="block text-sm leading-snug">{doc.title[lang]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <p className="font-mono text-[11px] text-muted">{t.reference(fmtDate(REFERENCE_DATE))}</p>
    </div>
  );
}

function Card({ title, flush = false, children }: { title: string; flush?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface">
      <h3 className="px-4 pt-3 pb-2 font-mono text-[11px] tracking-wide text-muted uppercase">{title}</h3>
      <div className={flush ? "" : "px-4 pb-4"}>{children}</div>
    </section>
  );
}
