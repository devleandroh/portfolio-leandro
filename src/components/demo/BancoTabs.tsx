import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Alterna entre o painel de negócio e a página do pipeline do Banco 360. */
export function BancoTabs({ lang, active }: { lang: Locale; active: "painel" | "pipeline" }) {
  const t = getDictionary(lang).banco.tabs;
  const items = [
    { key: "painel", href: "/demo/banco", label: t.painel },
    { key: "pipeline", href: "/demo/banco/pipeline", label: t.pipeline },
  ] as const;
  return (
    <div className="mb-4 inline-flex rounded-md border border-line bg-surface p-0.5">
      {items.map((i) => (
        <Link
          key={i.key}
          href={localePath(lang, i.href)}
          aria-current={active === i.key ? "page" : undefined}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            active === i.key ? "bg-ink text-surface" : "text-ink-2 hover:text-ink"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}
