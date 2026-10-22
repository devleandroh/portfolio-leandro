import Link from "next/link";
import { getProfile } from "@/config/profile";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <path d="M10 8v16h11" fill="none" stroke="var(--color-surface)" strokeWidth="3" strokeLinecap="square" />
      <rect x="20" y="8" width="4" height="4" fill="var(--color-accent)" />
    </svg>
  );
}

export function SiteHeader({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const nav = [
    { href: "/#cases", label: t.header.nav.cases },
    { href: "/#competencias", label: t.header.nav.skills },
    { href: "/#stack", label: t.header.nav.stack },
    { href: "/#contato", label: t.header.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={localePath(lang, "/")} className="flex items-center gap-2.5">
          <Monogram className="h-7 w-7 text-ink" />
          <span className="text-sm font-semibold tracking-tight">{getProfile(lang).name}</span>
          <span className="hidden font-mono text-xs text-muted sm:inline">{t.header.tagline}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={localePath(lang, n.href)}
              className="hidden rounded px-3 py-1.5 text-ink-2 transition-colors hover:bg-wash hover:text-ink md:inline-block"
            >
              {n.label}
            </Link>
          ))}
          <span className="mr-1 md:mx-2">
            <LanguageSwitcher lang={lang} label={t.language.label} names={t.language} />
          </span>
          <Link
            href={localePath(lang, "/#cases")}
            className="rounded bg-ink px-3 py-1.5 font-medium text-surface transition-colors hover:bg-accent-strong"
          >
            {t.header.cta}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).footer;
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{t.copyright(new Date().getFullYear(), getProfile(lang).name)}</p>
        <p>{t.disclaimer}</p>
      </div>
    </footer>
  );
}
