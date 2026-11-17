"use client";

import { usePathname } from "next/navigation";
import { Database, HardDrive } from "lucide-react";
import { stripLocale } from "@/i18n/config";

/** Demos que rodam só no navegador, sem banco: o selo de origem dos dados não se aplica. */
const SEM_BANCO = ["/demo/remessa"];

/** Selo "PostgreSQL · Supabase" ou "dados locais" no cabeçalho das demos. */
export function SourceBadge({ supabase, label, title }: { supabase: boolean; label: string; title: string }) {
  const pathname = stripLocale(usePathname());
  if (SEM_BANCO.some((p) => pathname.startsWith(p))) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border border-line bg-page px-2 py-1 font-mono text-[11px] text-ink-2"
      title={title}
    >
      {supabase ? <Database className="h-3.5 w-3.5 text-good" /> : <HardDrive className="h-3.5 w-3.5 text-muted" />}
      {label}
    </span>
  );
}
