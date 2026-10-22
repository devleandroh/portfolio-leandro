"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath, stripLocale, type Locale } from "@/i18n/config";

const DEMOS = [
  { href: "/demo/compras", key: "compras" },
  { href: "/demo/faturamento", key: "faturamento" },
  { href: "/demo/juridico", key: "juridico" },
] as const;

export function DemoNav({
  lang,
  labels,
  aria,
}: {
  lang: Locale;
  labels: Record<(typeof DEMOS)[number]["key"], string>;
  aria: string;
}) {
  const pathname = stripLocale(usePathname());
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label={aria}>
      {DEMOS.map((d) => {
        const active = pathname.startsWith(d.href);
        return (
          <Link
            key={d.href}
            href={localePath(lang, d.href)}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
              active ? "border-accent font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            {labels[d.key]}
          </Link>
        );
      })}
    </nav>
  );
}
