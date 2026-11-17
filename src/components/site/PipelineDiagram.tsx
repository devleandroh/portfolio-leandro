import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Diagrama do fluxo de trabalho no hero: dado bruto → decisão. */
export function PipelineDiagram({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).pipeline;
  const stages = t.stages.map((s, i) => ({ ...s, n: String(i + 1).padStart(2, "0") }));
  // A legenda usa "→" como separador; as setas ganham a cor de sinal.
  const caption = t.caption.split("→").map((p) => p.trim());
  return (
    <figure aria-label={t.aria} className="terminal border-grad">
      <div className="term-head">
        <span>pipeline.yml</span>
        <span className="live">
          <i aria-hidden />
          {t.running}
        </span>
      </div>
      <ol className="steps">
        {stages.map((s) => (
          <li key={s.n} className="step">
            <em>{s.n}</em>
            <b>{s.title}</b>
            <ul>
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <figcaption className="term-foot">
        ${" "}
        {caption.map((p, i) => (
          <span key={p}>
            {i > 0 && <span className="c"> → </span>}
            {p}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
