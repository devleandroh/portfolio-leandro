import Link from "next/link";
import { contactLinks, getProfile } from "@/config/profile";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";

/** Cabeçalho da homepage na identidade dark. Mesmos links e âncoras do SiteHeader. */
export function BrandHeader({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const nav = [
    { href: "/sami", label: t.sami.nav },
    { href: "/#cases", label: t.header.nav.cases },
    { href: "/#competencias", label: t.header.nav.skills },
    { href: "/#stack", label: t.header.nav.stack },
    { href: "/#contato", label: t.header.nav.contact },
  ];
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link href={localePath(lang, "/")} className="brand">
          <span className="logo" aria-hidden>
            L
          </span>
          <span>
            <b>{getProfile(lang).name}</b> <span className="tagline">{t.header.tagline}</span>
          </span>
        </Link>
        <nav className="menu" aria-label={t.header.nav.cases}>
          {nav.map((n) => (
            <Link key={n.href} href={localePath(lang, n.href)}>
              {n.label}
            </Link>
          ))}
          <LanguageSwitcher lang={lang} label={t.language.label} names={t.language} tone="dark" />
          <Link href={localePath(lang, "/#cases")} className="btn btn-primary">
            {t.header.cta}
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Rodapé com as ondas azul→verde dos banners. Paths copiados do preview de referência. */
export function BrandFooter({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).footer;
  const social = contactLinks(lang).filter((c) => c.label === "LinkedIn" || c.label === "GitHub");
  return (
    <footer className="site-foot">
      <svg className="waves" viewBox="0 0 1440 170" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="w1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0B74E5" />
            <stop offset="55%" stopColor="#1E9BFF" />
            <stop offset="100%" stopColor="#00C85A" />
          </linearGradient>
          <linearGradient id="w2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E9BFF" />
            <stop offset="100%" stopColor="#22E27A" />
          </linearGradient>
        </defs>
        <path fill="url(#w1)" fillOpacity=".25" d="M0,70 C240,150 480,10 720,60 C960,110 1200,150 1440,80 L1440,170 L0,170 Z" />
        <path fill="url(#w2)" fillOpacity=".45" d="M0,110 C260,50 520,160 780,110 C1020,66 1240,110 1440,130 L1440,170 L0,170 Z" />
        <path fill="url(#w1)" fillOpacity=".9" d="M0,140 C300,110 600,170 900,145 C1140,125 1300,150 1440,155 L1440,170 L0,170 Z" />
      </svg>
      <div className="foot-in">
        <div className="wrap">
          <span>{t.copyright(new Date().getFullYear(), getProfile(lang).name)}</span>
          {social.length > 0 && (
            <span>
              {social.map((c, i) => (
                <span key={c.label}>
                  {i > 0 && " · "}
                  <a href={c.href} target="_blank" rel="noreferrer">
                    {c.label}
                  </a>
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

/** Destaca `hl` dentro de `text` com a classe dada (gradiente de texto ou caixa neon). */
export function Highlight({ text, hl, className = "text-grad" }: { text: string; hl?: string; className?: string }) {
  const i = hl ? text.indexOf(hl) : -1;
  if (!hl || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className={className}>{hl}</span>
      {text.slice(i + hl.length)}
    </>
  );
}

export function SectionHead({ eyebrow, title, hl, children }: { eyebrow: string; title: string; hl?: string; children?: React.ReactNode }) {
  return (
    <div className="rv">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="title">
        <Highlight text={title} hl={hl} />
      </h2>
      {children}
    </div>
  );
}
