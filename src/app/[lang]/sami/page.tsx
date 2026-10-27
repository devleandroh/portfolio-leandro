import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { AtlasPanel } from "@/components/sami/AtlasPanel";
import { EvalEvidence } from "@/components/sami/EvalEvidence";
import { SamiArchitecture } from "@/components/sami/SamiArchitecture";
import { SamiChat } from "@/components/sami/SamiChat";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/sami">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang).sami.meta;
  return { title: t.title, description: t.description };
}

export default async function SamiPage({ params }: PageProps<"/[lang]/sami">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang).sami;
  const STATE_BY_MODE = ["live", "partial", "documented"] as const;

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="flex-1">
        {/* APRESENTAÇÃO */}
        <section className="blueprint border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <Link href={localePath(lang, "/#cases")} className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> {d.hero.allCases}
            </Link>
            <p className="mt-8 font-mono text-xs text-muted">{d.hero.eyebrow}</p>
            <h1 className="mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">S.A.M.I.</h1>
            <p className="mt-2 font-mono text-sm text-accent-strong">{d.hero.expanded}</p>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <p className="leading-relaxed text-ink-2">{d.hero.problem}</p>
              <p className="leading-relaxed">{d.hero.value}</p>
            </div>
            <div className="mt-8">
              <p className="font-mono text-[11px] tracking-wide text-muted uppercase">{d.hero.stackLabel}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {d.hero.stack.map((s) => (
                  <li key={s} className="rounded border border-line bg-surface px-2 py-0.5 text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#demo" className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent-strong">
                {d.hero.ctaDemo} <ArrowDown className="h-4 w-4" />
              </a>
              <a href="#arquitetura" className="inline-flex items-center gap-2 rounded-md border border-axis bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink">
                {d.hero.ctaArch}
              </a>
            </div>
            <div className="mt-8 max-w-3xl">
              <DemoNotice lang={lang} />
              <p className="mt-2 text-xs text-ink-2">{d.hero.notice}</p>
            </div>
          </div>
        </section>

        {/* MODOS */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionTitle eyebrow={d.modes.eyebrow} title={d.modes.title} text={d.modes.text} />
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {d.modes.items.map((m, i) => {
                const state = STATE_BY_MODE[i];
                return (
                  <li key={m.key} className="flex flex-col rounded-lg border border-line bg-surface p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted">{d.modes.label} {m.key}</span>
                      <StateBadge state={state} label={d.states[state]} />
                    </div>
                    <h3 className="mt-3 font-semibold">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">{m.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* DEMONSTRAÇÃO */}
        <section id="demo" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
            <SectionTitle eyebrow={d.chat.eyebrow} title={d.chat.title} text={d.chat.text} />
            <div className="mt-8">
              <SamiChat lang={lang} />
            </div>
          </div>
        </section>

        {/* PAINEL */}
        <section id="painel" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionTitle eyebrow={d.panel.eyebrow} title={d.panel.title} text={d.panel.text} />
            <div className="mt-8">
              <AtlasPanel lang={lang} />
            </div>
          </div>
        </section>

        {/* ARQUITETURA */}
        <section id="arquitetura" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionTitle eyebrow={d.arch.eyebrow} title={d.arch.title} text={d.arch.text} />
            <div className="mt-8">
              <SamiArchitecture lang={lang} />
            </div>
          </div>
        </section>

        {/* EVIDÊNCIAS E LIMITAÇÕES */}
        <section id="evidencias" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionTitle eyebrow={d.evidence.eyebrow} title={d.evidence.title} text={d.evidence.text} />
            <div className="mt-8">
              <EvalEvidence lang={lang} />
            </div>
            <div className="mt-10 rounded-lg border border-line bg-surface p-5">
              <h3 className="font-mono text-[11px] tracking-wide text-muted uppercase">{d.limits.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-2">
                {d.limits.items.map((l) => (
                  <li key={l} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1 w-3 shrink-0 bg-axis" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div>
      <p className="font-mono text-xs tracking-wide text-accent-strong uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
      {text && <p className="mt-3 max-w-3xl leading-relaxed text-ink-2">{text}</p>}
    </div>
  );
}

const BADGE: Record<"live" | "partial" | "documented", string> = {
  live: "border-good/40 bg-good/10 text-good-text",
  partial: "border-warning/60 bg-warning/15 text-[#7a5200]",
  documented: "border-axis bg-wash text-ink-2",
};

function StateBadge({ state, label }: { state: "live" | "partial" | "documented"; label: string }) {
  return <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${BADGE[state]}`}>{label}</span>;
}
