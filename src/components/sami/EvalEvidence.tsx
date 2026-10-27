import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatters } from "@/lib/format";
import evalResult from "@/content/sami-eval.json";

/** Métricas da última execução de `npm run sami:eval` (arquivo versionado e verificado por teste). */
export function EvalEvidence({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).sami.evidence;
  const { fmtPct, fmtDate } = formatters(lang);
  const r = evalResult;
  const ratio = (a: number, b: number) => (b ? fmtPct(a / b) : "—");

  const items: { label: string; value: string; detail: string }[] = [
    { label: t.metrics.questions, value: String(r.cases), detail: "PT + EN" },
    { label: t.metrics.routing, value: ratio(r.mechanism.correct, r.mechanism.total), detail: t.of(r.mechanism.correct, r.mechanism.total) },
    { label: t.metrics.recordRecall, value: ratio(r.records.found, r.records.expected), detail: t.of(r.records.found, r.records.expected) },
    { label: t.metrics.recordPrecision, value: ratio(r.records.relevant, r.records.returned), detail: t.of(r.records.relevant, r.records.returned) },
    { label: t.metrics.docRecall, value: ratio(r.docs.found, r.docs.expected), detail: t.of(r.docs.found, r.docs.expected) },
    { label: t.metrics.docPrecision, value: ratio(r.docs.relevant, r.docs.returned), detail: t.of(r.docs.relevant, r.docs.returned) },
    { label: t.metrics.refusals, value: ratio(r.refusals.correct, r.refusals.total), detail: t.of(r.refusals.correct, r.refusals.total) },
    { label: t.metrics.falseRefusals, value: String(r.falseRefusals.count), detail: t.of(r.falseRefusals.count, r.falseRefusals.total) },
    { label: t.metrics.validRefs, value: ratio(r.references.valid, r.references.total), detail: t.of(r.references.valid, r.references.total) },
    { label: t.metrics.latency, value: `${r.latencyMs.p50} / ${r.latencyMs.p95} ms`, detail: `n = ${r.latencyMs.runs}` },
  ];

  return (
    <div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col bg-surface p-4">
            <dt className="text-xs leading-snug text-ink-2">{it.label}</dt>
            <dd className="mt-auto pt-2">
              <span className="block text-xl font-semibold tracking-tight">{it.value}</span>
              <span className="font-mono text-[11px] text-muted">{it.detail}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 font-mono text-[11px] text-muted">{t.runAt(fmtDate(r.generatedAt), r.environment)}</p>
      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ink-2">{t.caveat}</p>
    </div>
  );
}
