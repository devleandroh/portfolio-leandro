import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, Panel } from "@/components/ui/dashboard";
import { getLegalDataset, getMovimentacoes } from "@/lib/data/repository";
import { fmtDate, fmtMoney } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/demo/juridico/[numero]">): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).numero)} — Legal BI` };
}

export default async function ProcessoPage({ params }: PageProps<"/demo/juridico/[numero]">) {
  const numero = decodeURIComponent((await params).numero);
  const { data, today } = await getLegalDataset();
  const p = data.processos.find((x) => x.numero === numero);
  if (!p) notFound();
  const movimentacoes = await getMovimentacoes(p.numero);
  const prazos = data.prazos.filter((z) => z.processo_numero === p.numero).sort((a, b) => b.data_limite.localeCompare(a.data_limite));
  const encerrado = p.status === "Encerrado";

  return (
    <>
      <Link href="/demo/juridico" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-xs text-muted">ficha do processo</p>
          <h1 className="mt-1 font-mono text-2xl font-semibold">{p.numero}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {p.objeto} · {p.cliente} (polo {p.polo.toLowerCase()})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={encerrado ? "neutral" : "info"}>{p.status}</Badge>
          <Badge tone={p.risco === "Provável" ? "critical" : p.risco === "Possível" ? "warning" : "neutral"}>Risco {p.risco.toLowerCase()}</Badge>
          {p.resultado && <Badge tone={p.resultado === "Desfavorável" ? "critical" : "good"}>{p.resultado}</Badge>}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
        {[
          ["Área", p.area],
          ["Tribunal", `${p.tribunal} · ${p.uf}`],
          ["Fase", p.fase],
          ["Responsável", p.advogado],
          ["Valor da causa", fmtMoney(p.valor_causa)],
          ["Provisão", fmtMoney(p.valor_provisao)],
          ["Distribuição", fmtDate(p.data_distribuicao)],
          [encerrado ? "Encerramento" : "Última movimentação", fmtDate(encerrado ? p.data_encerramento : p.ultima_movimentacao)],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 bg-surface p-4">
            <dt className="text-xs text-ink-2">{k}</dt>
            <dd className="mt-1 truncate font-semibold" title={v}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">{p.tribunal_nome}</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Movimentações" subtitle="Mais recentes primeiro">
          <ol className="relative ml-2 border-l border-line">
            {movimentacoes.map((m, i) => (
              <li key={m.id} className="relative pb-5 pl-5 last:pb-0">
                <span
                  className={`absolute top-1 -left-[5px] h-[9px] w-[9px] rounded-full ring-2 ring-surface ${i === 0 ? "bg-series-1" : "bg-axis"}`}
                />
                <p className="text-xs text-muted">
                  {fmtDate(m.data)} · <span className="font-medium text-ink-2">{m.tipo}</span>
                </p>
                <p className="mt-0.5 text-sm">{m.descricao}</p>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Prazos">
          {prazos.length === 0 ? (
            <p className="text-sm text-muted">Nenhum prazo registrado.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {prazos.map((z) => {
                const vencido = z.status === "Pendente" && z.data_limite < today;
                return (
                  <li key={z.id} className="flex items-center justify-between gap-2 py-2">
                    <span>
                      <span className="block">{z.tipo}</span>
                      <span className="block text-xs text-muted">
                        {fmtDate(z.data_limite)} · {z.responsavel}
                      </span>
                    </span>
                    <Badge tone={z.status === "Cumprido" ? "good" : vencido ? "critical" : "warning"}>
                      {z.status === "Cumprido" ? "Cumprido" : vencido ? "Vencido" : "Pendente"}
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
