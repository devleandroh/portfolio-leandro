const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brlCents = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR");
const num1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 });

export const fmtMoney = (v: number) => brl.format(v);
export const fmtMoneyCents = (v: number) => brlCents.format(v);
export const fmtInt = (v: number) => num.format(Math.round(v));
export const fmtDec = (v: number) => num1.format(v);
export const fmtPct = (v: number) => pct.format(v);

/** R$ 1,2 mi · R$ 345 mil · R$ 980 */
export function fmtMoneyShort(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `R$ ${num1.format(v / 1e9)} bi`;
  if (abs >= 1e6) return `R$ ${num1.format(v / 1e6)} mi`;
  if (abs >= 1e3) return `R$ ${num.format(Math.round(v / 1e3))} mil`;
  return brl.format(v);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-03" → "mar/26" */
export function fmtMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MESES[Number(m) - 1]}/${y.slice(2)}`;
}

export function fmtDays(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${num1.format(v)} d`;
}
