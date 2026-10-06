import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus } from "lucide-react";
import { fmtPct } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* KPI                                                                 */
/* ------------------------------------------------------------------ */
export function Kpi({
  label,
  value,
  hint,
  delta,
  deltaLabel = "vs. ano anterior",
  invert = false,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  deltaLabel?: string;
  /** Quando true, queda é boa (ex.: devoluções). */
  invert?: boolean;
  tone?: "critical" | "warning";
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-line bg-surface p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
        {tone && (
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${tone === "critical" ? "bg-critical" : "bg-warning"}`}
          />
        )}
        {label}
      </p>
      <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight">{value}</p>
      {delta !== undefined && <Delta value={delta} label={deltaLabel} invert={invert} />}
      {hint && <p className="mt-1 text-xs leading-snug text-muted">{hint}</p>}
    </div>
  );
}

export function Delta({
  value,
  label,
  invert = false,
  inline = false,
}: {
  value: number | null;
  label?: string;
  invert?: boolean;
  inline?: boolean;
}) {
  const Tag = inline ? "span" : "p";
  if (value === null || !Number.isFinite(value)) {
    return <Tag className={`${inline ? "" : "mt-1"} text-xs text-muted`}>{inline ? "—" : "sem base de comparação"}</Tag>;
  }
  const up = value > 0.0005;
  const down = value < -0.0005;
  const good = invert ? down : up;
  const bad = invert ? up : down;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <Tag className={`${inline ? "inline-flex" : "mt-1 flex"} items-center gap-1 text-xs`}>
      <span className={`inline-flex items-center gap-0.5 font-medium ${good ? "text-good-text" : bad ? "text-critical" : "text-ink-2"}`}>
        <Icon className="h-3.5 w-3.5" />
        {value > 0 ? "+" : ""}
        {fmtPct(value)}
      </span>
      {label && <span className="text-muted">{label}</span>}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Painel                                                              */
/* ------------------------------------------------------------------ */
export function Panel({
  title,
  subtitle,
  children,
  className = "",
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`flex min-w-0 flex-col rounded-lg border border-line bg-surface ${className}`}>
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Lista de barras horizontais (HTML puro, com rótulo na ponta)        */
/* ------------------------------------------------------------------ */
export function BarList({
  items,
  format,
  max,
  color = "bg-series-1",
  secondary,
}: {
  items: { name: string; value: number; extra?: string }[];
  format: (v: number) => string;
  max?: number;
  color?: string;
  secondary?: (item: { name: string; value: number; extra?: string }) => React.ReactNode;
}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.name} title={`${i.name}: ${format(i.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate text-ink-2">{i.name}</span>
            <span className="shrink-0 font-medium tabular">
              {format(i.value)}
              {secondary && <span className="ml-1.5 font-normal text-muted">{secondary(i)}</span>}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-r-[4px] bg-wash">
            <div
              className={`h-2 rounded-r-[4px] ${color}`}
              style={{ width: `${Math.max(0.5, (i.value / top) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Badges de status (sempre com texto, nunca só cor)                    */
/* ------------------------------------------------------------------ */
const TONES: Record<string, string> = {
  neutral: "border-line bg-wash text-ink-2",
  info: "border-accent-soft bg-accent-soft/40 text-accent-strong",
  good: "border-good/30 bg-good/10 text-good-text",
  warning: "border-warning/50 bg-warning/15 text-[#7a5200]",
  critical: "border-critical/30 bg-critical/10 text-critical",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tabela e paginação                                                  */
/* ------------------------------------------------------------------ */
export function Table({
  head,
  children,
  minWidth = 640,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-y border-line bg-page text-xs text-muted">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line tabular">{children}</tbody>
      </table>
    </div>
  );
}

export const th = "px-4 py-2 font-medium whitespace-nowrap";
export const td = "px-4 py-2.5 whitespace-nowrap";

export function hrefWith(base: string, params: Record<string, string>, changes: Record<string, string | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...changes })) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

export function Pagination({
  base,
  params,
  page,
  pages,
  total,
  anchor = "",
}: {
  base: string;
  params: Record<string, string>;
  page: number;
  pages: number;
  total: number;
  anchor?: string;
}) {
  const link = (p: number) => `${hrefWith(base, params, { pagina: p > 1 ? String(p) : null })}${anchor}`;
  const btn = "inline-flex h-8 items-center gap-1 rounded border border-line bg-surface px-2.5 text-xs transition-colors hover:border-ink";
  return (
    <nav className="mt-4 flex items-center justify-between text-xs text-ink-2" aria-label="Paginação">
      <span className="tabular">
        {total.toLocaleString("pt-BR")} registros · página {page} de {pages}
      </span>
      <span className="flex gap-2">
        {page > 1 ? (
          <Link href={link(page - 1)} className={btn} scroll={false}>
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </Link>
        ) : (
          <span className={`${btn} opacity-40`}>
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </span>
        )}
        {page < pages ? (
          <Link href={link(page + 1)} className={btn} scroll={false}>
            Próxima <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className={`${btn} opacity-40`}>
            Próxima <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
    </nav>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</p>;
}
