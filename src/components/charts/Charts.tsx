"use client";

import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  type TooltipContentProps,
} from "recharts";
import { fmtInt, fmtMoney, fmtMoneyShort, fmtPct } from "@/lib/format";

export type ValueFormat = "money" | "int" | "pct";

export interface Series {
  key: string;
  name: string;
  /** Cor da série (token CSS --color-series-* ou cinza para comparação). */
  color: string;
  dashed?: boolean;
}

const COLORS = {
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  tick: "#898781",
};

const fullFormat = (f: ValueFormat) => (f === "money" ? fmtMoney : f === "pct" ? fmtPct : fmtInt);
const tickFormat = (f: ValueFormat) =>
  f === "money" ? (v: number) => fmtMoneyShort(v).replace("R$ ", "") : f === "pct" ? (v: number) => fmtPct(v) : fmtInt;

function ChartTooltip({ active, payload, label, format }: TooltipContentProps<number, string> & { format: ValueFormat }) {
  if (!active || !payload?.length) return null;
  const fmt = fullFormat(format);
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-2">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-medium tabular">{fmt(Number(p.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendRow({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4"
            style={{ background: s.dashed ? `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 7px)` : s.color }}
          />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

/** Série temporal em linhas (1–3 séries). */
export function TrendChart({
  data,
  xKey,
  series,
  format = "money",
  height = 260,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  format?: ValueFormat;
  height?: number;
}) {
  return (
    <div>
      <LegendRow series={series} />
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={COLORS.grid} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={{ stroke: COLORS.axis }} tick={{ fill: COLORS.tick, fontSize: 11 }} minTickGap={12} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: COLORS.tick, fontSize: 11 }} tickFormatter={tickFormat(format)} width={56} />
          <Tooltip content={(p) => <ChartTooltip {...(p as TooltipContentProps<number, string>)} format={format} />} cursor={{ stroke: COLORS.axis }} />
          <Legend content={() => null} />
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.name}
              type="monotone"
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "5 4" : undefined}
              dot={false}
              activeDot={{ r: 4, stroke: "#fcfcfb", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Colunas agrupadas (1–3 séries). */
export function ColumnChart({
  data,
  xKey,
  series,
  format = "int",
  height = 240,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  format?: ValueFormat;
  height?: number;
}) {
  return (
    <div>
      <LegendRow series={series} />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={COLORS.grid} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={{ stroke: COLORS.axis }} tick={{ fill: COLORS.tick, fontSize: 11 }} minTickGap={8} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: COLORS.tick, fontSize: 11 }} tickFormatter={tickFormat(format)} width={48} allowDecimals={false} />
          <Tooltip content={(p) => <ChartTooltip {...(p as TooltipContentProps<number, string>)} format={format} />} cursor={{ fill: "rgb(11 11 11 / 0.04)" }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

