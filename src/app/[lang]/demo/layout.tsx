import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database, HardDrive } from "lucide-react";
import { DemoNav } from "@/components/demo/DemoNav";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { Monogram } from "@/components/site/SiteHeader";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { configuredSource } from "@/lib/data/repository";

export default async function DemoLayout({ children, params }: LayoutProps<"/[lang]/demo">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const source = configuredSource();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pt-2 sm:px-6">
          <Link href={localePath(lang, "/#cases")} className="flex items-center gap-2 py-1 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            <Monogram className="h-6 w-6 text-ink" />
            <span className="hidden sm:inline">{t.demo.back}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded border border-line bg-page px-2 py-1 font-mono text-[11px] text-ink-2"
              title={source === "supabase" ? t.demo.sourceSupabase : t.demo.sourceLocal}
            >
              {source === "supabase" ? <Database className="h-3.5 w-3.5 text-good" /> : <HardDrive className="h-3.5 w-3.5 text-muted" />}
              {source === "supabase" ? "PostgreSQL · Supabase" : t.demo.sourceLocalLabel}
            </span>
            <LanguageSwitcher lang={lang} label={t.language.label} names={t.language} />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <DemoNav lang={lang} labels={t.demo.nav} aria={t.demo.navAria} />
        </div>
      </header>
      <div className="border-b border-accent-soft bg-accent-soft/30">
        <p className="mx-auto max-w-7xl px-4 py-1.5 text-xs text-accent-strong sm:px-6">
          <strong className="font-semibold">{t.demoNotice.strong}</strong> {t.demoNotice.banner}
        </p>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
