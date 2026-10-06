const STAGES = [
  { n: "01", title: "Fontes", items: ["ERP / sistemas", "Planilhas", "APIs e arquivos"] },
  { n: "02", title: "Ingestão", items: ["Python · SQL", "Agendamentos", "Validação"] },
  { n: "03", title: "Modelo", items: ["PostgreSQL", "Views analíticas", "Regras versionadas"] },
  { n: "04", title: "Entrega", items: ["Dashboards", "Aplicações web", "Alertas"] },
];

/** Diagrama do fluxo de trabalho: dado bruto → decisão. */
export function PipelineDiagram() {
  return (
    <figure
      aria-label="Fluxo de dados: fontes, ingestão, modelo e entrega"
      className="blueprint-dark relative overflow-hidden rounded-xl border border-white/10 bg-night p-5 text-white shadow-[0_24px_60px_-30px_rgb(0_0_0/0.6)]"
    >
      <div className="mb-5 flex items-center justify-between font-mono text-[11px] text-white/50">
        <span>pipeline.yml</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          executando
        </span>
      </div>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0">
        {STAGES.map((s, i) => (
          <li key={s.n} className="relative sm:pr-5">
            {i < STAGES.length - 1 && (
              <span aria-hidden className="absolute top-4 right-0 hidden h-px w-5 bg-white/25 sm:block">
                <span className="absolute -top-[3px] right-0 h-[7px] w-[7px] rotate-45 border-t border-r border-white/40" />
              </span>
            )}
            <div className="h-full rounded-lg border border-white/12 bg-night-2/90 p-3">
              <p className="font-mono text-[11px] text-accent-soft/70">{s.n}</p>
              <p className="mt-0.5 text-sm font-semibold">{s.title}</p>
              <ul className="mt-2 space-y-1 text-xs text-white/60">
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="mt-5 border-t border-white/10 pt-3 font-mono text-[11px] leading-relaxed text-white/45">
        <span className="text-white/70">$</span> dado bruto → modelo confiável → decisão
      </figcaption>
    </figure>
  );
}
