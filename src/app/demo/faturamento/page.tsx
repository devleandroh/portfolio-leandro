import type { Metadata } from "next";
import { TrendChart } from "@/components/charts/Charts";
import { SERIES } from "@/components/charts/series";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { Badge, BarList, Delta, EmptyState, Kpi, Pagination, Panel, Table, td, th } from "@/components/ui/dashboard";
import { FilterBar } from "@/components/ui/FilterBar";
import { paginate, type SearchParams } from "@/lib/analytics/common";
import { analisarFaturamento, opcoesFat, parseFatFiltros, PERIODOS_FAT } from "@/lib/analytics/faturamento";
import { getFaturamentoDataset } from "@/lib/data/repository";
import { fmtDate, fmtInt, fmtMoney, fmtMoneyShort, fmtMonth, fmtPct } from "@/lib/format";

export const metadata: Metadata = { title: "Faturamento — demonstração" };

export default async function FaturamentoPage({ searchParams }: PageProps<"/demo/faturamento">) {
  const sp = (await searchParams) as SearchParams;
  const { data, today, warning } = await getFaturamentoDataset();
  const filtros = parseFatFiltros(sp);
  const a = analisarFaturamento(data.itens, filtros, today);
  const opcoes = opcoesFat(data.itens);
  const k = a.kpis;

  const params = Object.fromEntries(
    Object.entries({ periodo: filtros.periodo, regiao: filtros.regiao, categoria: filtros.categoria, vendedor: filtros.vendedor, segmento: filtros.segmento }).filter(([, v]) => v),
  );
  const pagina = paginate(a.notas, Number(sp.pagina) || 1, 12);
  const periodoTxt = `${fmtDate(a.intervalo.inicio)} a ${fmtDate(a.intervalo.fim)}`;
  const anteriorTxt = `${fmtDate(a.intervalo.inicioAnterior)} a ${fmtDate(a.intervalo.fimAnterior)}`;

  return (
    <>
      <DemoHeader
        title="Dashboard de Faturamento"
        description="Receita líquida, volume de notas, ticket médio e devoluções — sempre comparados ao mesmo período do ano anterior."
        today={today}
        warning={warning}
      />

      <FilterBar
        key={JSON.stringify(params)}
        segmented={{ name: "periodo", label: "Período", value: filtros.periodo, options: PERIODOS_FAT.map((p) => ({ value: p.value, label: p.label })) }}
        selects={[
          { name: "regiao", label: "Região", value: filtros.regiao, all: "Todas", options: opcoes.regioes.map((v) => ({ value: v, label: v })) },
          { name: "categoria", label: "Categoria", value: filtros.categoria, all: "Todas", options: opcoes.categorias.map((v) => ({ value: v, label: v })) },
          { name: "segmento", label: "Segmento", value: filtros.segmento, options: opcoes.segmentos.map((v) => ({ value: v, label: v })) },
          { name: "vendedor", label: "Vendedor", value: filtros.vendedor, options: opcoes.vendedores.map((v) => ({ value: v, label: v })) },
        ]}
      />

      <p className="mt-3 text-xs text-muted">
        Período analisado: <span className="text-ink-2">{periodoTxt}</span> · comparação: {anteriorTxt}
      </p>

      {k.atual.notas === 0 ? (
        <div className="mt-4">
          <EmptyState>Nenhuma nota encontrada para os filtros selecionados.</EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Kpi label="Faturamento líquido" value={fmtMoneyShort(k.atual.liquido)} delta={k.variacao.liquido} hint="Vendas menos devoluções" />
            <Kpi label="Notas emitidas" value={fmtInt(k.atual.notas)} delta={k.variacao.notas} hint="Notas de venda autorizadas" />
            <Kpi label="Ticket médio" value={fmtMoney(k.atual.ticket)} delta={k.variacao.ticket} hint="Faturamento bruto ÷ notas" />
            <Kpi
              label="Devoluções"
              value={fmtMoneyShort(k.atual.devolucoes)}
              delta={k.variacao.devolucoes}
              invert
              hint={`${fmtPct(k.atual.taxaDevolucao)} do faturamento bruto`}
            />
            <Kpi label="Clientes ativos" value={fmtInt(k.atual.clientes)} delta={k.variacao.clientes} hint="Com ao menos uma compra no período" />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title="Evolução mensal do faturamento líquido" subtitle="Últimos 12 meses fechados × mesmos meses do ano anterior" className="lg:col-span-2">
              <TrendChart
                data={a.mensal.map((m) => ({ mes: fmtMonth(m.mes), atual: Math.round(m.atual), anterior: Math.round(m.anterior) }))}
                xKey="mes"
                series={[
                  { key: "atual", name: "Últimos 12 meses", color: SERIES.blue },
                  { key: "anterior", name: "Ano anterior", color: SERIES.comparison, dashed: true },
                ]}
              />
            </Panel>
            <Panel title="Taxa de devolução" subtitle="Devoluções ÷ faturamento bruto, meses fechados">
              <TrendChart
                data={a.mensal.map((m) => ({ mes: fmtMonth(m.mes), taxa: Number(m.taxaDevolucao.toFixed(4)) }))}
                xKey="mes"
                series={[{ key: "taxa", name: "Taxa de devolução", color: SERIES.orange }]}
                format="pct"
              />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title="Por categoria" subtitle="Faturamento líquido e variação anual">
              <ul className="space-y-2.5">
                {a.porCategoria.map((c) => (
                  <li key={c.name}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-ink-2">{c.name}</span>
                      <span className="flex shrink-0 items-baseline gap-2">
                        <span className="font-medium tabular">{fmtMoneyShort(c.value)}</span>
                        <span className="w-16 text-right">
                          <Delta value={c.variacao} inline />
                        </span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-r-[4px] bg-wash">
                      <div className="h-2 rounded-r-[4px] bg-series-1" style={{ width: `${(c.value / (a.porCategoria[0]?.value || 1)) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Por região">
              <BarList items={a.porRegiao} format={fmtMoneyShort} secondary={(i) => fmtPct(i.value / (k.atual.liquido || 1))} />
            </Panel>
            <Panel title="Por segmento de cliente">
              <BarList items={a.porSegmento} format={fmtMoneyShort} secondary={(i) => fmtPct(i.value / (k.atual.liquido || 1))} />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Panel
              title="Top 10 clientes"
              subtitle={`Os 10 maiores concentram ${fmtPct(a.concentracaoTop10)} do faturamento (${fmtInt(a.totalClientes)} clientes no período)`}
            >
              <Table
                minWidth={480}
                head={
                  <>
                    <th className={th}>#</th>
                    <th className={th}>Cliente</th>
                    <th className={`${th} text-right`}>Faturamento</th>
                    <th className={`${th} text-right`}>Participação</th>
                    <th className={`${th} text-right`}>Acumulado</th>
                  </>
                }
              >
                {a.topClientes.map((c, i) => (
                  <tr key={c.name}>
                    <td className={`${td} text-muted`}>{i + 1}</td>
                    <td className={`${td} max-w-[200px] truncate`}>{c.name}</td>
                    <td className={`${td} text-right`}>{fmtMoney(c.value)}</td>
                    <td className={`${td} text-right`}>{fmtPct(c.share)}</td>
                    <td className={`${td} text-right text-muted`}>{fmtPct(c.acumulado)}</td>
                  </tr>
                ))}
              </Table>
            </Panel>
            <div className="grid gap-3">
              <Panel title="Ranking de vendedores" subtitle="Faturamento líquido · notas emitidas">
                <BarList
                  items={a.vendedores.slice(0, 8)}
                  format={fmtMoneyShort}
                  color="bg-series-3"
                  secondary={(i) => `${a.vendedores.find((v) => v.name === i.name)?.notas ?? 0} NFs`}
                />
              </Panel>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.4fr]">
            <Panel title="Produtos mais vendidos" subtitle="Por faturamento líquido">
              <BarList items={a.produtos} format={fmtMoneyShort} />
            </Panel>
            <Panel title="Notas do período" subtitle="Mais recentes primeiro">
              <div id="notas" className="scroll-mt-32" />
              <Table
                minWidth={520}
                head={
                  <>
                    <th className={th}>Nota</th>
                    <th className={th}>Emissão</th>
                    <th className={th}>Cliente</th>
                    <th className={th}>Tipo</th>
                    <th className={`${th} text-right`}>Valor</th>
                  </>
                }
              >
                {pagina.rows.map((n) => (
                  <tr key={n.nota_id}>
                    <td className={`${td} font-mono text-xs`}>{n.numero}</td>
                    <td className={td}>{fmtDate(n.data)}</td>
                    <td className={`${td} max-w-[220px] truncate`}>{n.cliente}</td>
                    <td className={td}>
                      <Badge tone={n.tipo === "Devolução" ? "warning" : "neutral"}>{n.tipo}</Badge>
                    </td>
                    <td className={`${td} text-right ${n.tipo === "Devolução" ? "text-critical" : ""}`}>
                      {n.tipo === "Devolução" ? "−" : ""}
                      {fmtMoney(n.valor)}
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination base="/demo/faturamento" params={params} page={pagina.page} pages={pagina.pages} total={pagina.total} anchor="#notas" />
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
