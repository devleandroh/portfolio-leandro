import Link from "next/link";
import { profile } from "@/config/profile";

const NAV = [
  { href: "/#cases", label: "Cases" },
  { href: "/#competencias", label: "Competências" },
  { href: "/#stack", label: "Tecnologias" },
  { href: "/#contato", label: "Contato" },
];

export function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <path d="M10 8v16h11" fill="none" stroke="var(--color-surface)" strokeWidth="3" strokeLinecap="square" />
      <rect x="20" y="8" width="4" height="4" fill="var(--color-accent)" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Monogram className="h-7 w-7 text-ink" />
          <span className="text-sm font-semibold tracking-tight">{profile.name}</span>
          <span className="hidden font-mono text-xs text-muted sm:inline">/ dados &amp; software</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="hidden rounded px-3 py-1.5 text-ink-2 transition-colors hover:bg-wash hover:text-ink md:inline-block"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/#cases"
            className="rounded bg-ink px-3 py-1.5 font-medium text-surface transition-colors hover:bg-accent-strong md:ml-2"
          >
            Ver demos
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {profile.name}. Projeto pessoal de portfólio.
        </p>
        <p>Todos os dados exibidos nas demonstrações são fictícios, gerados para fins ilustrativos.</p>
      </div>
    </footer>
  );
}
