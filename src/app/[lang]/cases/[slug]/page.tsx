import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { getCase, getCases } from "@/content/cases";
import { defaultLocale, hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return getCases(defaultLocale).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/cases/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const c = hasLocale(lang) ? getCase(lang, slug) : undefined;
  return c ? { title: c.name, description: c.tagline } : {};
}

export default async function CasePage({ params }: PageProps<"/[lang]/cases/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const c = getCase(lang, slug);
  if (!c) notFound();
  const t = getDictionary(lang).casePage;

  return (
    <div className="brand-chrome flex flex-1 flex-col">
      <SiteHeader lang={lang} />
      <main className="flex-1">
        <section className="blueprint border-b border-line">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <Link href={localePath(lang, "/#cases")} className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> {t.allCases}
            </Link>
            <p className="mt-8 font-mono text-xs text-muted">case / {c.index}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{c.name}</h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">{c.tagline}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={localePath(lang, c.demoHref)}
                className="inline-flex items-center gap-2 rounded-md btn-grad px-5 py-2.5 text-sm"
              >
                {t.openDemo} <ArrowUpRight className="h-4 w-4" />
              </Link>
              {c.repoHref && (
                <a
                  href={c.repoHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-axis bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink"
                >
                  GitHub <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
              <DemoNotice lang={lang} compact />
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-px overflow-hidden px-4 py-14 sm:px-6 md:grid-cols-3 md:gap-8">
          <Block n="01" title={t.problem}>
            <p>{c.problem}</p>
          </Block>
          <Block n="02" title={t.solution}>
            <p>{c.solution}</p>
          </Block>
          <Block n="03" title={t.outcome}>
            <ul className="space-y-2">
              {c.outcome.map((o) => (
                <li key={o} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-3 shrink-0 bg-accent" />
                  {o}
                </li>
              ))}
            </ul>
          </Block>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2">
            <div>
              <H2>{t.features}</H2>
              <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-page">
                {c.features.map((f) => (
                  <li key={f} className="px-4 py-2.5 text-sm">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <H2>{t.dataModel}</H2>
              <p className="mt-2 text-sm text-ink-2">{c.entitiesText ?? t.dataModelText}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.entities.map((e) => (
                  <span key={e} className="rounded border border-line bg-page px-2.5 py-1 font-mono text-xs">
                    {e}
                  </span>
                ))}
              </div>
              <H2 className="mt-8">Stack</H2>
              <p className="mt-3 font-mono text-sm text-ink-2">{c.stack.join(" · ")}</p>
            </div>
          </div>
        </section>

        <section id="arquitetura" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14 sm:px-6">
          <H2>{t.architecture}</H2>
          <p className="mt-2 max-w-2xl text-sm text-ink-2">
            {t.architectureText}
          </p>
          <ol className={`mt-6 grid gap-3 ${c.architecture ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-5"}`}>
            {(c.architecture ?? t.architectureSteps).map((a, i) => (
              <li key={a.t} className="relative rounded-lg border border-line bg-surface p-4">
                <p className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 text-sm font-semibold">{a.t}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{a.d}</p>
              </li>
            ))}
          </ol>
          {c.awsMap && (
            <div className="mt-12">
              <H2>{t.awsTitle}</H2>
              <p className="mt-2 max-w-2xl text-sm text-ink-2">{t.awsText}</p>
              <div className="mt-5 overflow-x-auto rounded-lg border border-line bg-surface">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-line bg-page text-xs text-muted">
                    <tr>
                      {t.awsCols.map((h) => (
                        <th key={h} className="px-4 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {c.awsMap.map((m) => (
                      <tr key={m.aws}>
                        <td className="px-4 py-2.5">{m.local}</td>
                        <td className="px-4 py-2.5 font-medium">{m.aws}</td>
                        <td className="px-4 py-2.5 text-ink-2">{m.uso}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t-2 border-ink pt-4 text-sm leading-relaxed text-ink-2">
      <p className="font-mono text-xs text-muted">{n}</p>
      <h2 className="mt-1 mb-3 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-semibold tracking-tight ${className}`}>{children}</h2>;
}
