import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { cases, getCase } from "@/content/cases";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/cases/[slug]">): Promise<Metadata> {
  const c = getCase((await params).slug);
  return c ? { title: c.name, description: c.tagline } : {};
}

const ARQUITETURA = [
  { t: "Dados sintéticos", d: "Gerador determinístico em TypeScript produz os seeds SQL." },
  { t: "PostgreSQL (Supabase)", d: "Schema próprio por domínio, chaves, índices e RLS somente leitura." },
  { t: "Views analíticas", d: "Views públicas expõem o modelo pronto para consumo." },
  { t: "Next.js (servidor)", d: "Consulta as views, aplica filtros e calcula indicadores." },
  { t: "Interface", d: "Gráficos e tabelas responsivos, sem exigir conhecimento técnico." },
];

export default async function CasePage({ params }: PageProps<"/cases/[slug]">) {
  const c = getCase((await params).slug);
  if (!c) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="blueprint border-b border-line">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <Link href="/#cases" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Todos os cases
            </Link>
            <p className="mt-8 font-mono text-xs text-muted">case / {c.index}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{c.name}</h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">{c.tagline}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={c.demoHref}
                className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent-strong"
              >
                Abrir demonstração <ArrowUpRight className="h-4 w-4" />
              </Link>
              <DemoNotice compact />
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-px overflow-hidden px-4 py-14 sm:px-6 md:grid-cols-3 md:gap-8">
          <Block n="01" title="O problema">
            <p>{c.problem}</p>
          </Block>
          <Block n="02" title="A solução">
            <p>{c.solution}</p>
          </Block>
          <Block n="03" title="O resultado">
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
              <H2>Funcionalidades</H2>
              <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-page">
                {c.features.map((f) => (
                  <li key={f} className="px-4 py-2.5 text-sm">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <H2>Modelo de dados</H2>
              <p className="mt-2 text-sm text-ink-2">Entidades principais do banco desta demonstração:</p>
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

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <H2>Arquitetura da demonstração</H2>
          <p className="mt-2 max-w-2xl text-sm text-ink-2">
            Detalhe técnico para quem quiser ir além: como os dados percorrem a aplicação.
          </p>
          <ol className="mt-6 grid gap-3 md:grid-cols-5">
            {ARQUITETURA.map((a, i) => (
              <li key={a.t} className="relative rounded-lg border border-line bg-surface p-4">
                <p className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 text-sm font-semibold">{a.t}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{a.d}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
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
