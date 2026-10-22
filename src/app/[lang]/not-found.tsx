import Link from "next/link";
import { localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { currentLocale } from "@/i18n/server";

export default async function NotFound() {
  const lang = await currentLocale();
  const t = getDictionary(lang).notFound;
  return (
    <main className="blueprint flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-sm text-ink-2">{t.text}</p>
      <Link href={localePath(lang, "/")} className="mt-6 rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface hover:bg-accent-strong">
        {t.back}
      </Link>
    </main>
  );
}
