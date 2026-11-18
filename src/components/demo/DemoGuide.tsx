import Link from "next/link";
import { ArrowRight, ChevronDown, Compass, Layers } from "lucide-react";
import { getCase } from "@/content/cases";
import { localePath, type Locale } from "@/i18n/config";
import { getGuide, guideLabels, type GuideKey } from "@/i18n/guides";

/**
 * Guia discreto da demo: dois botões recolhidos ("Como navegar" e "Arquitetura").
 * Usa <details> nativo — funciona sem JavaScript e não ocupa espaço até ser aberto.
 */
export function DemoGuide({ lang, guide }: { lang: Locale; guide: GuideKey }) {
  const g = getGuide(lang, guide);
  const c = getCase(lang, g.caseSlug);
  const l = guideLabels[lang];

  return (
    <div className="mt-3 grid items-start gap-2 md:grid-cols-2">
      <Section icon={<Compass className="h-3.5 w-3.5" />} label={l.howTo}>
        <ol className="grid gap-y-2">
          {g.steps.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-ink-2">
              <span className="mt-px font-mono text-[11px] text-accent-strong">{String(i + 1).padStart(2, "0")}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        {guide !== "remessa" && guide !== "bancoPipeline" && (
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] text-muted">{l.tip}</p>
        )}
      </Section>

      {c && (
        <Section icon={<Layers className="h-3.5 w-3.5" />} label={l.architecture}>
          <ol className="flex flex-wrap items-center gap-1.5" aria-label={l.architecture}>
            {c.pipeline.map((step, i) => (
              <li key={step} className="flex items-center gap-1.5">
                {i > 0 && <ArrowRight aria-hidden className="h-3.5 w-3.5 text-muted" />}
                <span className="rounded border border-line bg-page px-2 py-1 text-xs">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-ink-2">
            <span className="font-medium text-ink">{l.runtime}:</span> {g.runtime}
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted">
            {l.stack}: {c.stack.join(" · ")}
          </p>
          <Link
            href={localePath(lang, `/cases/${c.slug}#arquitetura`)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent-strong hover:underline"
          >
            {l.more} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Section>
      )}
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-md border border-line bg-surface/60 open:bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-1.5 text-xs font-medium text-ink-2 select-none hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="text-accent-strong">{icon}</span>
        {label}
        <ChevronDown aria-hidden className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-3 py-3">{children}</div>
    </details>
  );
}
