"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DEMOS = [
  { href: "/demo/compras", label: "Compras 360" },
  { href: "/demo/faturamento", label: "Faturamento" },
  { href: "/demo/juridico", label: "Legal BI" },
];

export function DemoNav() {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Demonstrações">
      {DEMOS.map((d) => {
        const active = pathname.startsWith(d.href);
        return (
          <Link
            key={d.href}
            href={d.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
              active ? "border-accent font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            {d.label}
          </Link>
        );
      })}
    </nav>
  );
}
