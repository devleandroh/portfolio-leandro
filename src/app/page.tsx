import Link from "next/link";
import { ArrowRight, ArrowUpRight, Database, LayoutDashboard, Workflow, AppWindow } from "lucide-react";
import { PipelineDiagram } from "@/components/site/PipelineDiagram";
import { ProfileIntro } from "@/components/site/ProfileIntro";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { contactLinks, profile } from "@/config/profile";
import { cases } from "@/content/cases";

const COMPETENCIAS = [
  {
    icon: Database,
    title: "Engenharia de dados",
    text: "Extração de sistemas e planilhas, limpeza, modelagem relacional e cargas automatizadas com validação.",
    tags: ["ETL / ELT", "Modelagem", "SQL"],
  },
  {
    icon: LayoutDashboard,
    title: "BI e dashboards",
    text: "Indicadores com regra clara, comparações entre períodos e painéis que respondem perguntas do negócio.",
    tags: ["KPIs", "Análise temporal", "Visualização"],
  },
  {
    icon: Workflow,
    title: "Automação de processos",
    text: "Rotinas que eliminam trabalho manual repetitivo: consolidações, conferências, alertas e relatórios.",
    tags: ["Python", "Agendamentos", "Integrações"],
  },
  {
    icon: AppWindow,
    title: "Aplicações orientadas a dados",
    text: "Sistemas web sob medida, do banco à interface, para acompanhar processos e operar sobre os dados.",
    tags: ["Next.js", "APIs", "PostgreSQL"],
  },
];

const PROCESSO = [
  { n: "01", t: "Entender", d: "Mapear o processo e a pergunta que o dado precisa responder." },
  { n: "02", t: "Modelar", d: "Estruturar fontes em um modelo confiável, com regras explícitas." },
  { n: "03", t: "Automatizar", d: "Tirar o trabalho manual do caminho e manter tudo atualizado." },
  { n: "04", t: "Entregar", d: "Colocar a informação em uma interface simples para quem decide." },
];

const STACK: { group: string; items: string[] }[] = [
  { group: "Dados", items: ["SQL", "PostgreSQL", "SQL Server", "Python", "pandas", "Excel avançado"] },
  { group: "Aplicações", items: ["TypeScript", "Next.js", "React", "Node.js", "Tailwind CSS", "Recharts"] },
  { group: "Plataforma", items: ["Supabase", "Vercel", "Git", "GitHub Actions", "Docker", "Linux"] },
];

export default function Home() {
  const contatos = contactLinks();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="blueprint border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div>
              <ProfileIntro />
              <h1 className="mt-4 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
                {profile.headline}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">{profile.summary}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#cases"
                  className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent-strong"
                >
                  Ver cases com demonstração <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#contato"
                  className="inline-flex items-center gap-2 rounded-md border border-axis bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink"
                >
                  Falar comigo
                </a>
              </div>
              <p className="mt-6 font-mono text-xs text-muted">{profile.location}</p>
            </div>
            <PipelineDiagram />
          </div>
        </section>

        {/* SOBRE / COMO TRABALHO */}
        <section id="sobre" className="border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <SectionTitle eyebrow="Sobre" title="Do dado bruto à decisão." />
            <div>
              <p className="max-w-2xl leading-relaxed text-ink-2">
                Trabalho na ponte entre operação e tecnologia: entendo o processo, organizo os dados que ele gera e
                construo a ferramenta que faltava — seja um pipeline, um dashboard ou uma aplicação completa.
              </p>
              <ol className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
                {PROCESSO.map((p) => (
                  <li key={p.n} className="bg-surface p-4">
                    <p className="font-mono text-xs text-muted">{p.n}</p>
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
            <SectionTitle eyebrow="Competências" title="O que eu entrego." />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {COMPETENCIAS.map(({ icon: Icon, title, text, tags }) => (
                <article key={title} className="flex flex-col rounded-lg border border-line bg-surface p-5">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">{text}</p>
                  <p className="mt-4 font-mono text-[11px] text-muted">{tags.join(" · ")}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CASES */}
        <section id="cases" className="border-b border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <SectionTitle eyebrow="Cases" title="Projetos com demonstração funcional." />
              <p className="max-w-sm text-sm text-ink-2">
                Cada case abre uma aplicação real, rodando sobre um banco PostgreSQL com dados 100% fictícios.
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
                        href={c.demoHref}
                        className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-accent-strong"
                      >
                        Ver demonstração <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/cases/${c.slug}`}
                        className="inline-flex items-center gap-2 rounded-md border border-axis px-4 py-2 text-sm font-medium transition-colors hover:border-ink"
                      >
                        Detalhes do case
                      </Link>
                    </div>
                  </div>
                  <div className="grid gap-6 p-6 sm:grid-cols-2">
                    <div>
                      <Label>Problema</Label>
                      <p className="mt-2 text-sm leading-relaxed text-ink-2">{c.problem}</p>
                      <Label className="mt-5">Solução</Label>
                      <p className="mt-2 text-sm leading-relaxed text-ink-2">{c.solution}</p>
                    </div>
                    <div>
                      <Label>Principais funcionalidades</Label>
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
            <SectionTitle eyebrow="Tecnologias" title="Ferramentas do dia a dia." />
            <dl className="divide-y divide-line rounded-lg border border-line bg-surface">
              {STACK.map((s) => (
                <div key={s.group} className="grid gap-2 p-4 sm:grid-cols-[140px_1fr]">
                  <dt className="font-mono text-xs text-muted uppercase">{s.group}</dt>
                  <dd className="flex flex-wrap gap-2">
                    {s.items.map((i) => (
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
              <p className="font-mono text-xs tracking-wide text-accent-soft/80 uppercase">Contato</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Tem um processo que vive em planilhas?</h2>
              <p className="mt-3 max-w-md text-white/65">
                Conte o problema. Respondo com uma proposta de como estruturar os dados e o que pode ser entregue.
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
                Links de contato ainda não configurados — defina as variáveis NEXT_PUBLIC_CONTACT_* / *_URL.
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
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
