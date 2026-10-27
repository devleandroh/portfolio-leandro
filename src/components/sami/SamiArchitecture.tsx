import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type State = "live" | "partial" | "documented";

const STATE_STYLE: Record<State, { box: string; dot: string }> = {
  live: { box: "border-good/50 bg-night-2", dot: "bg-good" },
  partial: { box: "border-warning/60 border-dashed bg-night-2", dot: "bg-warning" },
  documented: { box: "border-white/15 border-dashed bg-transparent", dot: "bg-white/35" },
};

/** Camadas da S.A.M.I. com o estado de cada componente nesta demonstração. */
export function SamiArchitecture({ lang }: { lang: Locale }) {
  const d = getDictionary(lang).sami;
  const t = d.arch;
  const states: State[] = ["live", "partial", "documented"];

  return (
    <figure className="blueprint-dark overflow-hidden rounded-xl border border-white/10 bg-night p-4 text-white sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-white/55">
        <span>sami.architecture</span>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {states.map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span aria-hidden className={`h-2 w-2 rounded-full ${STATE_STYLE[s].dot}`} />
              {d.states[s]}
            </li>
          ))}
        </ul>
      </div>

      <ol className="mt-5 space-y-3">
        {t.layers.map((layer, i) => (
          <li key={layer.name} className="grid gap-2 md:grid-cols-[150px_1fr] md:items-stretch">
            <p className="font-mono text-[11px] text-accent-soft/70 md:pt-3">
              {String(i + 1).padStart(2, "0")} · {layer.name}
            </p>
            <div className={`grid gap-2 ${layer.nodes.length > 1 ? "sm:grid-cols-2" : ""} ${layer.nodes.length > 2 ? "lg:grid-cols-3" : ""}`}>
              {layer.nodes.map((n) => {
                const st = n.state as State;
                return (
                  <div key={n.name} className={`rounded-lg border p-3 ${STATE_STYLE[st].box}`}>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${STATE_STYLE[st].dot}`} />
                      {n.name}
                    </p>
                    <p className="mt-1 font-mono text-[10px] tracking-wide text-white/45 uppercase">{d.states[st]}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/65">{n.desc}</p>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-2">
        <FlowList title={t.flowTitle} items={t.flow} tone="live" />
        <FlowList title={t.fullTitle} items={t.full} tone="documented" />
      </div>
    </figure>
  );
}

function FlowList({ title, items, tone }: { title: string; items: string[]; tone: State }) {
  return (
    <div>
      <p className="flex items-center gap-2 font-mono text-[11px] text-white/60 uppercase">
        <span aria-hidden className={`h-2 w-2 rounded-full ${STATE_STYLE[tone].dot}`} />
        {title}
      </p>
      <ol className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={it} className="flex gap-3 text-sm text-white/75">
            <span className="font-mono text-[11px] text-accent-soft/60">{i + 1}</span>
            <span>{it}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
