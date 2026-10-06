import Link from "next/link";
import { ArrowLeft, Database, HardDrive } from "lucide-react";
import { DemoNav } from "@/components/demo/DemoNav";
import { Monogram } from "@/components/site/SiteHeader";
import { configuredSource } from "@/lib/data/repository";

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  const source = configuredSource();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pt-2 sm:px-6">
          <Link href="/#cases" className="flex items-center gap-2 py-1 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            <Monogram className="h-6 w-6 text-ink" />
            <span className="hidden sm:inline">Voltar ao portfólio</span>
          </Link>
          <span
            className="inline-flex items-center gap-1.5 rounded border border-line bg-page px-2 py-1 font-mono text-[11px] text-ink-2"
            title={
              source === "supabase"
                ? "Dados lidos do banco PostgreSQL (Supabase)."
                : "Banco não configurado: dados gerados localmente pelo mesmo algoritmo dos seeds."
            }
          >
            {source === "supabase" ? <Database className="h-3.5 w-3.5 text-good" /> : <HardDrive className="h-3.5 w-3.5 text-muted" />}
            {source === "supabase" ? "PostgreSQL · Supabase" : "dados locais"}
          </span>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <DemoNav />
        </div>
      </header>
      <div className="border-b border-accent-soft bg-accent-soft/30">
        <p className="mx-auto max-w-7xl px-4 py-1.5 text-xs text-accent-strong sm:px-6">
          <strong className="font-semibold">Ambiente demonstrativo</strong> — todos os dados apresentados são fictícios.
        </p>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
