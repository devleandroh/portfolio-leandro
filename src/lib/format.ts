import { htmlLang, type Locale } from "@/i18n/config";

/**
 * Formatadores de números e datas no padrão do idioma exibido.
 * Os valores são sempre em reais (BRL): os dados demonstrativos são brasileiros.
 */
function build(lang: Locale) {
  const tag = htmlLang[lang];
  const brl = new Intl.NumberFormat(tag, { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const brlCents = new Intl.NumberFormat(tag, { style: "currency", currency: "BRL" });
  const num = new Intl.NumberFormat(tag);
  const num1 = new Intl.NumberFormat(tag, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const pct = new Intl.NumberFormat(tag, { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const pt = lang === "pt";
  const meses = pt
    ? ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return {
    fmtMoney: (v: number) => brl.format(v),
    fmtMoneyCents: (v: number) => brlCents.format(v),
    fmtInt: (v: number) => num.format(Math.round(v)),
    fmtDec: (v: number) => num1.format(v),
    fmtPct: (v: number) => pct.format(v),

    /** pt: R$ 1,2 mi · R$ 345 mil · R$ 980 — en: R$1.2M · R$345K · R$980 */
    fmtMoneyShort(v: number): string {
      const abs = Math.abs(v);
      if (pt) {
        if (abs >= 1e9) return `R$ ${num1.format(v / 1e9)} bi`;
        if (abs >= 1e6) return `R$ ${num1.format(v / 1e6)} mi`;
        if (abs >= 1e3) return `R$ ${num.format(Math.round(v / 1e3))} mil`;
      } else {
        if (abs >= 1e9) return `R$${num1.format(v / 1e9)}B`;
        if (abs >= 1e6) return `R$${num1.format(v / 1e6)}M`;
        if (abs >= 1e3) return `R$${num.format(Math.round(v / 1e3))}K`;
      }
      return brl.format(v);
    },

    /** pt: 05/03/2026 — en: Mar 5, 2026 */
    fmtDate(iso: string | null | undefined): string {
      if (!iso) return "—";
      const [y, m, d] = iso.slice(0, 10).split("-");
      return pt ? `${d}/${m}/${y}` : `${meses[Number(m) - 1]} ${Number(d)}, ${y}`;
    },

    /** "2026-03" → pt: "mar/26" — en: "Mar '26" */
    fmtMonth(ym: string): string {
      const [y, m] = ym.split("-");
      return pt ? `${meses[Number(m) - 1]}/${y.slice(2)}` : `${meses[Number(m) - 1]} '${y.slice(2)}`;
    },

    fmtDays(v: number | null | undefined): string {
      if (v === null || v === undefined || Number.isNaN(v)) return "—";
      return `${num1.format(v)} d`;
    },
  };
}

export type Formatters = ReturnType<typeof build>;

const cache = new Map<Locale, Formatters>();

export function formatters(lang: Locale): Formatters {
  let f = cache.get(lang);
  if (!f) cache.set(lang, (f = build(lang)));
  return f;
}
