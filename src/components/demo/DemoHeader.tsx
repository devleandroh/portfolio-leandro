import { AlertTriangle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { translateValue } from "@/i18n/data";
import { getDictionary } from "@/i18n/dictionaries";
import { formatters } from "@/lib/format";

export function DemoHeader({
  lang,
  title,
  description,
  today,
  warning,
}: {
  lang: Locale;
  title: string;
  description: string;
  today: string;
  warning?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">{description}</p>
        </div>
        <p className="font-mono text-[11px] text-muted">
          {getDictionary(lang).demo.reference}: {formatters(lang).fmtDate(today)}
        </p>
      </div>
      {warning && (
        <p className="mt-3 flex items-center gap-2 rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-[#7a5200]" /> {translateValue(lang, warning)}
        </p>
      )}
    </div>
  );
}
