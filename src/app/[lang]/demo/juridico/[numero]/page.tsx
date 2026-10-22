import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, Panel } from "@/components/ui/dashboard";
import { hasLocale, localePath } from "@/i18n/config";
import { translateCourt, valueTranslator } from "@/i18n/data";
import { getDictionary } from "@/i18n/dictionaries";
import { getLegalDataset, getMovimentacoes } from "@/lib/data/repository";
import { formatters } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/demo/juridico/[numero]">): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).numero)} — Legal BI` };
}

export default async function ProcessoPage({ params }: PageProps<"/[lang]/demo/juridico/[numero]">) {
  const { lang, numero: raw } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const d = t.juridico.detail;
  const tv = valueTranslator(lang, "legal");
  const { fmtDate, fmtMoney } = formatters(lang);
  const numero = decodeURIComponent(raw);
  const { data, today } = await getLegalDataset();
  const p = data.processos.find((x) => x.numero === numero);
  if (!p) notFound();
  const movimentacoes = await getMovimentacoes(p.numero);
  const prazos = data.prazos.filter((z) => z.processo_numero === p.numero).sort((a, b) => b.data_limite.localeCompare(a.data_limite));
  const encerrado = p.status === "Encerrado";

  return (
    <>
      <Link href={localePath(lang, "/demo/juridico")} className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {t.demo.backToPanel}
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-xs text-muted">{d.eyebrow}</p>
          <h1 className="mt-1 font-mono text-2xl font-semibold">{p.numero}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {tv(p.objeto)} · {p.cliente} ({d.side(p.polo)})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={encerrado ? "neutral" : "info"}>{tv(p.status)}</Badge>
          <Badge tone={p.risco === "Provável" ? "critical" : p.risco === "Possível" ? "warning" : "neutral"}>{d.risk(tv(p.risco))}</Badge>
          {p.resultado && <Badge tone={p.resultado === "Desfavorável" ? "critical" : "good"}>{tv(p.resultado)}</Badge>}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
        {[
          [d.area, tv(p.area)],
          [d.court, `${p.tribunal} · ${p.uf}`],
          [d.phase, tv(p.fase)],
          [d.lawyer, p.advogado],
          [d.claim, fmtMoney(p.valor_causa)],
          [d.provision, fmtMoney(p.valor_provisao)],
          [d.filed, fmtDate(p.data_distribuicao)],
          [encerrado ? d.closedOn : d.lastMove, fmtDate(encerrado ? p.data_encerramento : p.ultima_movimentacao)],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 bg-surface p-4">
            <dt className="text-xs text-ink-2">{k}</dt>
            <dd className="mt-1 truncate font-semibold" title={v}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">{translateCourt(lang, p.tribunal_nome)}</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel title={d.moves} subtitle={d.movesSub}>
          <ol className="relative ml-2 border-l border-line">
            {movimentacoes.map((m, i) => (
              <li key={m.id} className="relative pb-5 pl-5 last:pb-0">
                <span
                  className={`absolute top-1 -left-[5px] h-[9px] w-[9px] rounded-full ring-2 ring-surface ${i === 0 ? "bg-series-1" : "bg-axis"}`}
                />
                <p className="text-xs text-muted">
                  {fmtDate(m.data)} · <span className="font-medium text-ink-2">{tv(m.tipo)}</span>
                </p>
                <p className="mt-0.5 text-sm">{tv(m.descricao)}</p>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title={d.deadlines}>
          {prazos.length === 0 ? (
            <p className="text-sm text-muted">{d.noDeadlines}</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {prazos.map((z) => {
                const vencido = z.status === "Pendente" && z.data_limite < today;
                return (
                  <li key={z.id} className="flex items-center justify-between gap-2 py-2">
                    <span>
                      <span className="block">{tv(z.tipo)}</span>
                      <span className="block text-xs text-muted">
                        {fmtDate(z.data_limite)} · {z.responsavel}
                      </span>
                    </span>
                    <Badge tone={z.status === "Cumprido" ? "good" : vencido ? "critical" : "warning"}>
                      {z.status === "Cumprido" ? d.met : vencido ? d.overdue : d.pending}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
