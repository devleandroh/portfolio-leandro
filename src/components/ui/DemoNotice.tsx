import { FlaskConical } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function DemoNotice({ lang, compact = false }: { lang: Locale; compact?: boolean }) {
  const t = getDictionary(lang).demoNotice;
  if (compact) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-ink-2">
        <FlaskConical className="h-3.5 w-3.5 text-accent" />
        {t.compact}
      </p>
    );
  }
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-accent-soft bg-accent-soft/35 px-3.5 py-2.5 text-sm text-ink">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
      <p>
        <strong className="font-semibold">{t.strong}</strong> {t.full}
      </p>
    </div>
  );
}
