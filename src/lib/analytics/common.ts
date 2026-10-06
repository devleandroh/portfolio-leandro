export type SearchParams = Record<string, string | string[] | undefined>;

export function param(sp: SearchParams, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

/** Lista de meses "yyyy-mm" de `fromIso` até `toIso`, inclusive. */
export function monthRange(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  let y = Number(fromIso.slice(0, 4));
  let m = Number(fromIso.slice(5, 7));
  const endY = Number(toIso.slice(0, 4));
  const endM = Number(toIso.slice(5, 7));
  while (y < endY || (y === endY && m <= endM)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export function sum<T>(rows: T[], f: (r: T) => number | null | undefined): number {
  let s = 0;
  for (const r of rows) s += f(r) ?? 0;
  return s;
}

export function avg(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export function median(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => typeof x === "number").sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** Agrupa e soma; devolve ordenado por valor decrescente. */
export function rank<T>(rows: T[], key: (r: T) => string, value: (r: T) => number): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(key(r), (map.get(key(r)) ?? 0) + value(r));
  return [...map.entries()].map(([name, v]) => ({ name, value: v })).sort((a, b) => b.value - a.value);
}

/** Mantém os N primeiros e soma o restante em "Outros". */
export function topN(items: { name: string; value: number }[], n: number, otherLabel = "Outros") {
  if (items.length <= n) return items;
  const head = items.slice(0, n);
  const rest = items.slice(n).reduce((s, i) => s + i.value, 0);
  return [...head, { name: otherLabel, value: rest }];
}

export function distinct<T>(rows: T[], f: (r: T) => string | null | undefined): string[] {
  return [...new Set(rows.map(f).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function paginate<T>(rows: T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((current - 1) * size, current * size), page: current, pages, total: rows.length };
}

export function delta(current: number, previous: number): number | null {
  if (!previous) return null;
  return (current - previous) / Math.abs(previous);
}
