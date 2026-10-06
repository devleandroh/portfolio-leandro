import type { Metadata } from "next";
import Link from "next/link";
import { ColumnChart } from "@/components/charts/Charts";
import { SERIES } from "@/components/charts/series";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { Badge, BarList, EmptyState, Kpi, Pagination, Panel, Table, td, th } from "@/components/ui/dashboard";
import { FilterBar } from "@/components/ui/FilterBar";
import { paginate, type SearchParams } from "@/lib/analytics/common";
import {
  analisarCompras, etapaAtual, STATUS_TONE, filtrarCompras, opcoesCompras, parseComprasFiltros, PERIODOS_COMPRAS, STATUS_SC,
} from "@/lib/analytics/compras";
import { getComprasDataset } from "@/lib/data/repository";
import { fmtDate, fmtDays, fmtInt, fmtMoney, fmtMoneyShort, fmtMonth, fmtPct } from "@/lib/format";

export const metadata: Metadata = { title: "Compras 360 — demonstração" };


const ETAPAS = ["Solicitação", "Pedido", "Nota fiscal", "Concluída"];

export default async function ComprasPage({ searchParams }: PageProps<"/demo/compras">) {
  const sp = (await searchParams) as SearchParams;
  const { data, today, warning } = await getComprasDataset();
  const filtros = parseComprasFiltros(sp);
  const rows = filtrarCompras(data.processos, filtros, today);
  const a = analisarCompras(rows, today);
  const opcoes = opcoesCompras(data.processos);

  const lista = [...rows].sort((x, y) => y.sc_data.localeCompare(x.sc_data) || y.sc_numero.localeCompare(x.sc_numero));
  const pagina = paginate(lista, Number(sp.pagina) || 1, 15);
  const params = Object.fromEntries(
    Object.entries({ periodo: filtros.periodo, centro: filtros.centro, categoria: filtros.categoria, status: filtros.status, prioridade: filtros.prioridade, q: filtros.busca }).filter(([, v]) => v),
  );
  const maxFunil = a.funil[0]?.valor || 1;
  const maxTempo = Math.max(1, ...a.tempos.map((t) => t.media ?? 0));

  return (
    <>
      <DemoHeader
        title="Compras 360"
        description="Acompanhamento do ciclo de compras: da solicitação ao pedido e ao recebimento da nota fiscal."
        today={today}
        warning={warning}
      />

      <FilterBar
        key={JSON.stringify(params)}
        segmented={{ name: "periodo", label: "Período da solicitação", value: filtros.periodo, options: PERIODOS_COMPRAS.map((p) => ({ value: p.value, label: p.label })) }}
        selects={[
          { name: "centro", label: "Centro de custo", value: filtros.centro, options: opcoes.centros.map((v) => ({ value: v, label: v })) },
          { name: "categoria", label: "Categoria", value: filtros.categoria, all: "Todas", options: opcoes.categorias.map((v) => ({ value: v, label: v })) },
          { name: "status", label: "Status", value: filtros.status, options: STATUS_SC.map((v) => ({ value: v, label: v })) },
          { name: "prioridade", label: "Prioridade", value: filtros.prioridade, all: "Todas", options: ["Normal", "Alta", "Urgente"].map((v) => ({ value: v, label: v })) },
        ]}
        search={{ name: "q", value: filtros.busca, placeholder: "SC, PC, fornecedor…" }}
      />

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState>Nenhuma solicitação encontrada para os filtros selecionados.</EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Solicitações" value={fmtInt(a.kpis.solicitacoes)} hint={`${fmtInt(a.kpis.abertas)} abertas (sem pedido)`} />
            <Kpi label="Aprovadas" value={fmtInt(a.kpis.aprovadas)} hint={`${fmtInt(a.kpis.emAprovacao)} aguardando aprovação`} />
            <Kpi label="Pedidos emitidos" value={fmtInt(a.kpis.pedidos)} hint={`${fmtInt(a.kpis.aguardandoPedido)} aprovadas sem pedido`} />
            <Kpi
              label="Pedidos pendentes"
              value={fmtInt(a.kpis.pedidosPendentes)}
              hint={`${fmtInt(a.kpis.pedidosAtrasados)} com entrega em atraso`}
              tone={a.kpis.pedidosAtrasados > 0 ? "warning" : undefined}
            />
            <Kpi label="Notas recebidas" value={fmtInt(a.kpis.notas)} hint="Documentos fiscais de entrada" />
            <Kpi label="Ciclo médio" value={fmtDays(a.cicloTotal.media)} hint={`Mediana ${fmtDays(a.cicloTotal.mediana)} · da solicitação à última nota`} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi label="Valor solicitado" value={fmtMoneyShort(a.kpis.valorSolicitado)} hint="Soma das estimativas das solicitações" />
            <Kpi label="Valor comprado" value={fmtMoneyShort(a.kpis.valorComprado)} hint="Soma dos pedidos emitidos" />
            <Kpi label="Valor recebido" value={fmtMoneyShort(a.kpis.valorRecebido)} hint="Soma das notas fiscais recebidas" />
            <Kpi
              label="Economia negociada"
              value={fmtMoneyShort(a.kpis.economia)}
              hint={`${fmtPct(a.kpis.economiaPct)} abaixo do valor estimado nas solicitações atendidas por pedido`}
            />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Panel title="Funil do processo" subtitle="Quantas solicitações chegaram a cada etapa">
              <ol className="space-y-2.5">
                {a.funil.map((f, i) => (
                  <li key={f.etapa} className="grid grid-cols-[120px_1fr] items-center gap-3 text-xs sm:grid-cols-[140px_1fr]">
                    <span className="text-ink-2">{f.etapa}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-6 rounded-r-[4px]" style={{ width: `${(f.valor / maxFunil) * 85}%`, background: ["#1c5cab", "#256abf", "#2a78d6", "#5598e7", "#86b6ef"][i] }} />
                      <span className="font-medium tabular whitespace-nowrap">
                        {fmtInt(f.valor)}
                        {i > 0 && <span className="ml-1 font-normal text-muted">{fmtPct(f.valor / maxFunil)}</span>}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel title="Tempo entre etapas" subtitle="Média em dias corridos (mediana entre parênteses)">
              <ul className="space-y-4">
                {a.tempos.map((t) => (
                  <li key={t.etapa}>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-2">{t.etapa}</span>
                      <span className="font-medium tabular">
                        {fmtDays(t.media)} <span className="font-normal text-muted">({fmtDays(t.mediana)})</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-r-[4px] bg-wash">
                      <div className="h-2 rounded-r-[4px] bg-series-1" style={{ width: `${((t.media ?? 0) / maxTempo) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
                A etapa mais longa indica onde o processo concentra espera — normalmente o prazo de entrega do fornecedor.
              </p>
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title="Volume mensal" subtitle="Eventos registrados em cada mês · o último mês está em andamento" className="lg:col-span-2">
              <ColumnChart
                data={a.mensal.map((m) => ({ mes: fmtMonth(m.mes), solicitacoes: m.solicitacoes, pedidos: m.pedidos, notas: m.notas }))}
                xKey="mes"
                series={[
                  { key: "solicitacoes", name: "Solicitações", color: SERIES.blue },
                  { key: "pedidos", name: "Pedidos", color: SERIES.orange },
                  { key: "notas", name: "Notas recebidas", color: SERIES.aqua },
                ]}
              />
            </Panel>
            <Panel title="Duração do ciclo completo" subtitle="Solicitações concluídas, por faixa de dias">
              <ColumnChart
                data={a.faixas}
                xKey="faixa"
                series={[{ key: "quantidade", name: "Solicitações", color: SERIES.blue }]}
              />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title="Valor comprado por centro de custo">
              <BarList items={a.porCentro.slice(0, 8)} format={fmtMoneyShort} />
            </Panel>
            <Panel title="Principais fornecedores" subtitle="Por valor de pedidos">
              <BarList
                items={a.porFornecedor}
                format={fmtMoneyShort}
                secondary={(i) => `${(a.porFornecedor.find((f) => f.name === i.name)?.pedidos ?? 0)} PCs`}
              />
            </Panel>
            <Panel title="Pedidos com entrega em atraso" subtitle="Previsão vencida e ainda não recebidos">
              {a.atrasados.length === 0 ? (
                <EmptyState>Nenhum pedido em atraso.</EmptyState>
              ) : (
                <ul className="divide-y divide-line text-xs">
                  {a.atrasados.map((r) => (
                    <li key={r.sc_numero} className="flex items-center justify-between gap-2 py-2">
                      <Link href={`/demo/compras/${r.sc_numero}`} className="min-w-0 hover:underline">
                        <span className="block font-mono font-medium">{r.pc_numero}</span>
                        <span className="block truncate text-muted">{r.fornecedor}</span>
                      </Link>
                      <span className="text-right">
                        <Badge tone="critical">{fmtDate(r.pc_prevista)}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Processos de compra" subtitle="Clique em uma solicitação para ver o processo completo" className="mt-3">
            <div id="lista" className="scroll-mt-32" />
            <Table
              head={
                <>
                  <th className={th}>Solicitação</th>
                  <th className={th}>Data</th>
                  <th className={th}>Centro de custo</th>
                  <th className={th}>Status</th>
                  <th className={th}>Pedido</th>
                  <th className={th}>Fornecedor</th>
                  <th className={`${th} text-right`}>Valor</th>
                  <th className={th}>Etapa</th>
                </>
              }
            >
              {pagina.rows.map((r) => {
                const etapa = etapaAtual(r);
                return (
                  <tr key={r.sc_numero} className="hover:bg-page">
                    <td className={td}>
                      <Link href={`/demo/compras/${r.sc_numero}`} className="font-mono font-medium text-accent-strong hover:underline">
                        {r.sc_numero}
                      </Link>
                    </td>
                    <td className={td}>{fmtDate(r.sc_data)}</td>
                    <td className={td}>{r.centro_custo}</td>
                    <td className={td}>
                      <Badge tone={STATUS_TONE[r.sc_status]}>{r.sc_status}</Badge>
                    </td>
                    <td className={`${td} font-mono`}>{r.pc_numero ?? "—"}</td>
                    <td className={`${td} max-w-[220px] truncate`}>{r.fornecedor ?? "—"}</td>
                    <td className={`${td} text-right`}>{fmtMoney(r.pc_valor ?? r.sc_valor_estimado)}</td>
                    <td className={td}>
                      <span className="flex items-center gap-1" title={ETAPAS[etapa - 1]}>
                        {[1, 2, 3, 4].map((s) => (
                          <span key={s} className={`h-1.5 w-4 rounded-sm ${s <= etapa ? "bg-series-1" : "bg-line"}`} />
                        ))}
                        <span className="ml-1 text-xs text-muted">{ETAPAS[etapa - 1]}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination base="/demo/compras" params={params} page={pagina.page} pages={pagina.pages} total={pagina.total} anchor="#lista" />
          </Panel>
        </>
      )}
    </>
  );
}
