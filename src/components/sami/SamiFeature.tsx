import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Destaque do case S.A.M.I. na seção de cases da homepage. */
export function SamiFeature({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).sami;
  return (
    <article className="blueprint-dark grid overflow-hidden rounded-xl border border-night bg-night text-white lg:grid-cols-[1fr_1.35fr]">
      <div className="flex flex-col border-b border-white/10 p-6 lg:border-r lg:border-b-0">
        <p className="font-mono text-xs text-accent-soft/70">{t.home.eyebrow}</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">S.A.M.I.</h3>
        <p className="font-mono text-xs text-white/55">{t.hero.expanded}</p>
        <p className="mt-3 leading-relaxed text-white/75">{t.home.title}</p>
        <div className="mt-auto pt-6">
          <Link
            href={localePath(lang, "/sami")}
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent-soft"
          >
            {t.home.cta} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="p-6">
        <p className="text-sm leading-relaxed text-white/70">{t.home.text}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {t.home.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-3 shrink-0 bg-accent" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
