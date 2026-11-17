import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandFooter, BrandHeader, Highlight, SectionHead } from "@/components/brand/BrandChrome";
import {
  IconArrow,
  IconBars,
  IconCalendar,
  IconCheck,
  IconCode,
  IconDatabase,
  IconExternal,
  IconGear,
  IconGitHub,
  IconInfo,
  IconMail,
} from "@/components/brand/icons";
import { Reveal } from "@/components/brand/Reveal";
import { PipelineDiagram } from "@/components/site/PipelineDiagram";
import { ProfileIntro } from "@/components/site/ProfileIntro";
import { SamiFeature } from "@/components/sami/SamiFeature";
import { contactLinks, getProfile, type ContactLink } from "@/config/profile";
import { getCases } from "@/content/cases";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Ícone e cor do tile de cada competência / pill (azul = estrutura, verde = sinal). */
const SKILL_ICONS = [
  { Icon: IconDatabase, green: false },
  { Icon: IconBars, green: true },
  { Icon: IconGear, green: true },
  { Icon: IconCode, green: false },
];

const STACK = (excel: string) => ({
  data: ["SQL", "PostgreSQL", "SQL Server", "Python", "pandas", "PySpark", "Apache Airflow", "Parquet", excel],
  apps: ["TypeScript", "Next.js", "React", "Node.js", "Tailwind CSS", "Recharts"],
  platform: ["Supabase", "Vercel", "Git", "GitHub Actions", "Docker", "Linux"],
});

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const h = t.home;
  const profile = getProfile(lang);
  const cases = getCases(lang);
  const contatos = contactLinks(lang);
  const stack = STACK(h.stack.excel);
  const primary = contatos.find((c) => c.label === "LinkedIn") ?? contatos[0];
  const others = contatos.filter((c) => c !== primary);

  return (
    <div className="brand-page">
      <Reveal />
      <BrandHeader lang={lang} />
      <main className="flex-1">
        {/* HERO */}
        <section className="hero" id="top">
          <div className="dots" style={{ top: 40, right: "2%" }} aria-hidden />
          <div className="wrap">
            <div className="hero-grid">
              <div>
                <ProfileIntro lang={lang} />
                <h1>
                  <Highlight text={profile.headline} hl={h.headlineMark} className="mark" />
                </h1>
                <p className="lead">{profile.summary}</p>
                <div className="hero-cta">
                  <a href="#cases" className="btn btn-primary">
                    {h.ctaCases} <IconArrow />
                  </a>
                  <a href="#contato" className="btn btn-ghost">
                    {h.ctaContact}
                  </a>
                </div>
                <p className="hero-meta">{profile.location}</p>
              </div>

              <div>
                <PipelineDiagram lang={lang} />
                <ul className="checks">
                  {h.checks.map((c) => (
                    <li key={c} className="check">
                      <IconCheck />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ul className="pills rv" style={{ listStyle: "none" }}>
              {h.pills.map((label, i) => {
                const { Icon, green } = SKILL_ICONS[i];
                return (
                  <li key={label} className={`pill${green ? " g" : ""}`}>
                    <Icon />
                    <b>{label}</b>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ANTES / DEPOIS */}
        <section className="section" id="antes-depois">
          <div className="dots" style={{ top: 10, left: "1%" }} aria-hidden />
          <div className="wrap">
            <SectionHead eyebrow={h.beforeAfter.eyebrow} title={h.beforeAfter.title} hl={h.beforeAfter.titleHl} />
            <div className="ba rv">
              <div className="ba-card">
                <span className="ba-chip">{h.beforeAfter.before.chip}</span>
                <h3>{h.beforeAfter.before.title}</h3>
                <p>{h.beforeAfter.before.text}</p>
              </div>
              <div className="ba-arrow" aria-hidden>
                <IconArrow />
              </div>
              <div className="ba-card after">
                <span className="ba-chip">{h.beforeAfter.after.chip}</span>
                <h3>{h.beforeAfter.after.title}</h3>
                <p>{h.beforeAfter.after.text}</p>
                <p className="ba-flow">
                  {h.beforeAfter.after.flow.map((f, i) => (
                    <span key={f} style={{ display: "contents" }}>
                      {i > 0 && <i aria-hidden>→</i>}
                      <span>{f}</span>
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SOBRE / COMO TRABALHO */}
        <section className="section" id="sobre">
          <div className="wrap">
            <SectionHead eyebrow={h.about.eyebrow} title={h.about.title} hl={h.about.titleHl}>
              <p className="lead">{h.about.text}</p>
            </SectionHead>
            <ol className="steps4 rv">
              {h.about.steps.map((p, i) => (
                <li key={p.t} className="s4">
                  <em>{String(i + 1).padStart(2, "0")}</em>
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* COMPETÊNCIAS */}
        <section className="section" id="competencias">
          <div className="dots" style={{ bottom: 40, right: 0 }} aria-hidden />
          <div className="wrap">
            <SectionHead eyebrow={h.skills.eyebrow} title={h.skills.title} hl={h.skills.titleHl} />
            <div className="skills rv">
              {h.skills.items.map(({ title, text, tags }, i) => {
                const { Icon, green } = SKILL_ICONS[i];
                return (
                  <article key={title} className="card skill">
                    <div className={`icon-tile${green ? " icon-tile--green" : ""}`}>
                      <Icon />
                    </div>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                      <div className="tags">
                        {tags.map((tg) => (
                          <span key={tg} className="tag">
                            {tg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CASES */}
        <section className="section" id="cases">
          <div className="wrap">
            <SectionHead eyebrow={h.cases.eyebrow} title={h.cases.title} hl={h.cases.titleHl}>
              <p className="lead">{h.cases.text}</p>
            </SectionHead>
            <div className="cases">
              <SamiFeature lang={lang} />
              {cases.map((c) => (
                <article key={c.slug} className="card case rv">
                  <p className="case-id">case / {c.index}</p>
                  <h3>{c.name}</h3>
                  <p className="sub">{c.tagline}</p>
                  <div className="case-body">
                    <div>
                      <h4>{h.cases.problem}</h4>
                      <p>{c.problem}</p>
                    </div>
                    <div>
                      <h4>{h.cases.solution}</h4>
                      <p>{c.solution}</p>
                    </div>
                    <div>
                      <h4>{h.cases.features}</h4>
                      <ul>
                        {c.features.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="case-foot">
                    <div className="tags">
                      {c.stack.map((s) => (
                        <span key={s} className="tag">
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="acts">
                      <Link href={localePath(lang, c.demoHref)} className="btn btn-primary btn-sm">
                        {h.cases.openDemo} <IconArrow />
                      </Link>
                      <Link href={localePath(lang, `/cases/${c.slug}`)} className="btn btn-ghost btn-sm">
                        {h.cases.details}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* TECNOLOGIAS */}
        <section className="section" id="stack">
          <div className="dots" style={{ top: 30, left: 0 }} aria-hidden />
          <div className="wrap">
            <SectionHead eyebrow={h.stack.eyebrow} title={h.stack.title} hl={h.stack.titleHl} />
            <div className="tech rv">
              {(Object.keys(stack) as (keyof typeof stack)[]).map((g) => (
                <div key={g} className="card tech-col">
                  <h3>{h.stack.groups[g]}</h3>
                  <div className="tags">
                    {stack[g].map((i) => (
                      <span key={i} className="tag">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTATO */}
        <section className="section" id="contato">
          <div className="wrap">
            <div className="cta rv">
              <p className="eyebrow">{h.contact.eyebrow}</p>
              <h2>
                <Highlight text={h.contact.title} hl={h.contact.titleHl} />
              </h2>
              <p>{h.contact.text}</p>
              {primary ? (
                <div className="cta-row">
                  <a href={primary.href} {...external(primary)} className="btn btn-primary btn-lg">
                    <IconCalendar />
                    {h.contact.cta}
                    <IconArrow />
                  </a>
                  {others.map((c) => (
                    <a key={c.label} href={c.href} {...external(c)} className="btn btn-ghost">
                      <ContactIcon c={c} />
                      {c.label === h.contact.email ? c.display : c.label}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="font-mono">{h.contact.missing}</p>
              )}
            </div>

            <div className="notice rv">
              <IconInfo />
              <p>
                <b>{h.contact.noticeTitle}</b> — {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </section>
      </main>
      <BrandFooter lang={lang} />
    </div>
  );
}

function external(c: ContactLink) {
  return c.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {};
}

function ContactIcon({ c }: { c: ContactLink }) {
  if (c.label === "GitHub") return <IconGitHub />;
  if (c.href.startsWith("mailto:")) return <IconMail />;
  return <IconExternal />;
}
