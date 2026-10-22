import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Database, LayoutDashboard, Workflow, AppWindow } from "lucide-react";
import { PipelineDiagram } from "@/components/site/PipelineDiagram";
import { ProfileIntro } from "@/components/site/ProfileIntro";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { contactLinks, getProfile } from "@/config/profile";
import { getCases } from "@/content/cases";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const SKILL_ICONS = [Database, LayoutDashboard, Workflow, AppWindow];

const STACK = (excel: string) => ({
  data: ["SQL", "PostgreSQL", "SQL Server", "Python", "pandas", excel],
  apps: ["TypeScript", "Next.js", "React", "Node.js", "Tailwind CSS", "Recharts"],
  platform: ["Supabase", "Vercel", "Git", "GitHub Actions", "Docker", "Linux"],
});

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const h = getDictionary(lang).home;
  const profile = getProfile(lang);
  const cases = getCases(lang);
  const contatos = contactLinks(lang);
  const stack = STACK(h.stack.excel);

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="flex-1">
        {/* HERO */}
        <section className="blueprint border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div>
              <ProfileIntro lang={lang} />
              <h1 className="mt-4 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
                {profile.headline}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">{profile.summary}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#cases"
                  className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent-strong"
                >
                  {h.ctaCases} <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#contato"
                  className="inline-flex items-center gap-2 rounded-md border border-axis bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink"
                >
                  {h.ctaContact}
                </a>
              </div>
              <p className="mt-6 font-mono text-xs text-muted">{profile.location}</p>
            </div>
            <PipelineDiagram lang={lang} />
          </div>
        </section>

        {/* SOBRE / COMO TRABALHO */}
        <section id="sobre" className="border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <SectionTitle eyebrow={h.about.eyebrow} title={h.about.title} />
            <div>
              <p className="max-w-2xl leading-relaxed text-ink-2">
                {h.about.text}
              </p>
              <ol className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
                {h.about.steps.map((p, i) => (
                  <li key={p.t} className="bg-surface p-4">
                    <p className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</p>
                    <p className="mt-1 font-semibold">{p.t}</p>
                    <p className="mt-1.5 text-sm leading-snug text-ink-2">{p.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* COMPETÊNCIAS */}
        <section id="competencias" className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <SectionTitle eyebrow={h.skills.eyebrow} title={h.skills.title} />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {h.skills.items.map(({ title, text, tags }, i) => {
                const Icon = SKILL_ICONS[i];
                return (
                  <article key={title} className="flex flex-col rounded-lg border border-line bg-surface p-5">
                    <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                    <h3 className="mt-4 font-semibold">{title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">{text}</p>
                    <p className="mt-4 font-mono text-[11px] text-muted">{tags.join(" · ")}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CASES */}
        <section id="cases" className="border-b border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <SectionTitle eyebrow={h.cases.eyebrow} title={h.cases.title} />
              <p className="max-w-sm text-sm text-ink-2">
                {h.cases.text}
              </p>
            </div>
            <div className="mt-10 space-y-6">
              {cases.map((c) => (
                <article
                  key={c.slug}
                  className="grid overflow-hidden rounded-xl border border-line bg-page lg:grid-cols-[1fr_1.35fr]"
                >
                  <div className="flex flex-col border-b border-line p-6 lg:border-r lg:border-b-0">
                    <p className="font-mono text-xs text-muted">case / {c.index}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">{c.name}</h3>
                    <p className="mt-2 leading-relaxed text-ink-2">{c.tagline}</p>
                    <p className="mt-5 font-mono text-[11px] text-muted">{c.stack.join(" · ")}</p>
                    <div className="mt-auto flex flex-wrap gap-3 pt-6">
                      <Link
                        href={localePath(lang, c.demoHref)}
                        className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-accent-strong"
                      >
                        {h.cases.openDemo} <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={localePath(lang, `/cases/${c.slug}`)}
                        className="inline-flex items-center gap-2 rounded-md border border-axis px-4 py-2 text-sm font-medium transition-colors hover:border-ink"
                      >
                        {h.cases.details}
                      </Link>
                    </div>
                  </div>
                  <div className="grid gap-6 p-6 sm:grid-cols-2">
                    <div>
                      <Label>{h.cases.problem}</Label>
                      <p className="mt-2 text-sm leading-relaxed text-ink-2">{c.problem}</p>
                      <Label className="mt-5">{h.cases.solution}</Label>
                      <p className="mt-2 text-sm leading-relaxed text-ink-2">{c.solution}</p>
                    </div>
                    <div>
                      <Label>{h.cases.features}</Label>
                      <ul className="mt-2 space-y-2 text-sm">
                        {c.features.map((f) => (
                          <li key={f} className="flex gap-2">
                            <span aria-hidden className="mt-2 h-1 w-3 shrink-0 bg-accent" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* STACK */}
        <section id="stack" className="border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <SectionTitle eyebrow={h.stack.eyebrow} title={h.stack.title} />
            <dl className="divide-y divide-line rounded-lg border border-line bg-surface">
              {(Object.keys(stack) as (keyof typeof stack)[]).map((g) => (
                <div key={g} className="grid gap-2 p-4 sm:grid-cols-[140px_1fr]">
                  <dt className="font-mono text-xs text-muted uppercase">{h.stack.groups[g]}</dt>
                  <dd className="flex flex-wrap gap-2">
                    {stack[g].map((i) => (
                      <span key={i} className="rounded border border-line bg-page px-2 py-0.5 text-sm">
                        {i}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CONTATO */}
        <section id="contato" className="blueprint-dark bg-night text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="font-mono text-xs tracking-wide text-accent-soft/80 uppercase">{h.contact.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">{h.contact.title}</h2>
              <p className="mt-3 max-w-md text-white/65">
                {h.contact.text}
              </p>
            </div>
            {contatos.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {contatos.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="group flex items-center justify-between rounded-lg border border-white/15 bg-night-2 px-4 py-3 transition-colors hover:border-accent"
                    >
                      <span>
                        <span className="block font-mono text-[11px] text-white/50 uppercase">{c.label}</span>
                        <span className="block truncate text-sm">{c.display}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-white/40 group-hover:text-accent-soft" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-white/20 p-5 font-mono text-sm text-white/55">
                {h.contact.missing}
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-xs tracking-wide text-accent-strong uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-mono text-[11px] tracking-wide text-muted uppercase ${className}`}>{children}</p>;
}
