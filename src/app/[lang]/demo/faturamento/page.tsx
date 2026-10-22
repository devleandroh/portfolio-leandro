import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrendChart } from "@/components/charts/Charts";
import { SERIES } from "@/components/charts/series";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { Badge, BarList, Delta, EmptyState, Kpi, Pagination, Panel, Table, td, th } from "@/components/ui/dashboard";
import { FilterBar } from "@/components/ui/FilterBar";
import { paginate, type SearchParams } from "@/lib/analytics/common";
import { analisarFaturamento, opcoesFat, parseFatFiltros, PERIODOS_FAT } from "@/lib/analytics/faturamento";
import { hasLocale, localePath } from "@/i18n/config";
import { translateProduct, valueTranslator } from "@/i18n/data";
import { getDictionary } from "@/i18n/dictionaries";
import { getFaturamentoDataset } from "@/lib/data/repository";
import { formatters } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/demo/faturamento">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: `${t.faturamento.metaTitle} — ${t.meta.demoSuffix}` };
}

export default async function FaturamentoPage({ params: route, searchParams }: PageProps<"/[lang]/demo/faturamento">) {
  const { lang } = await route;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const f = t.faturamento;
  const tv = valueTranslator(lang);
  const { fmtDate, fmtInt, fmtMoney, fmtMoneyShort, fmtMonth, fmtPct } = formatters(lang);
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
  const periodoTxt = f.range(fmtDate(a.intervalo.inicio), fmtDate(a.intervalo.fim));
  const anteriorTxt = f.range(fmtDate(a.intervalo.inicioAnterior), fmtDate(a.intervalo.fimAnterior));
  const traduzir = <T extends { name: string }>(items: T[]) => items.map((i) => ({ ...i, name: tv(i.name) }));

  return (
    <>
      <DemoHeader
        lang={lang}
        title={f.title}
        description={f.description}
        today={today}
        warning={warning}
      />

      <FilterBar
        key={JSON.stringify(params)}
        segmented={{ name: "periodo", label: f.filters.period, value: filtros.periodo, options: PERIODOS_FAT.map((p) => ({ value: p.value, label: tv(p.label) })) }}
        selects={[
          { name: "regiao", label: f.filters.region, value: filtros.regiao, all: t.ui.filters.allF, options: opcoes.regioes.map((v) => ({ value: v, label: tv(v) })) },
          { name: "categoria", label: f.filters.category, value: filtros.categoria, all: t.ui.filters.allF, options: opcoes.categorias.map((v) => ({ value: v, label: tv(v) })) },
          { name: "segmento", label: f.filters.segment, value: filtros.segmento, options: opcoes.segmentos.map((v) => ({ value: v, label: tv(v) })) },
          { name: "vendedor", label: f.filters.seller, value: filtros.vendedor, options: opcoes.vendedores.map((v) => ({ value: v, label: v })) },
        ]}
        labels={t.ui.filters}
      />

      <p className="mt-3 text-xs text-muted">
        {f.analyzed} <span className="text-ink-2">{periodoTxt}</span> · {f.comparison} {anteriorTxt}
      </p>

      {k.atual.notas === 0 ? (
        <div className="mt-4">
          <EmptyState>{f.empty}</EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Kpi label={f.kpi.net} value={fmtMoneyShort(k.atual.liquido)} delta={k.variacao.liquido} hint={f.kpi.netHint} />
            <Kpi label={f.kpi.invoices} value={fmtInt(k.atual.notas)} delta={k.variacao.notas} hint={f.kpi.invoicesHint} />
            <Kpi label={f.kpi.ticket} value={fmtMoney(k.atual.ticket)} delta={k.variacao.ticket} hint={f.kpi.ticketHint} />
            <Kpi
              label={f.kpi.returns}
              value={fmtMoneyShort(k.atual.devolucoes)}
              delta={k.variacao.devolucoes}
              invert
              hint={f.kpi.returnsHint(fmtPct(k.atual.taxaDevolucao))}
            />
            <Kpi label={f.kpi.customers} value={fmtInt(k.atual.clientes)} delta={k.variacao.clientes} hint={f.kpi.customersHint} />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title={f.trend} subtitle={f.trendSub} className="lg:col-span-2">
              <TrendChart
                lang={lang}
                data={a.mensal.map((m) => ({ mes: fmtMonth(m.mes), atual: Math.round(m.atual), anterior: Math.round(m.anterior) }))}
                xKey="mes"
                series={[
                  { key: "atual", name: f.last12, color: SERIES.blue },
                  { key: "anterior", name: f.lastYear, color: SERIES.comparison, dashed: true },
                ]}
              />
            </Panel>
            <Panel title={f.returnRate} subtitle={f.returnRateSub}>
              <TrendChart
                lang={lang}
                data={a.mensal.map((m) => ({ mes: fmtMonth(m.mes), taxa: Number(m.taxaDevolucao.toFixed(4)) }))}
                xKey="mes"
                series={[{ key: "taxa", name: f.returnRate, color: SERIES.orange }]}
                format="pct"
              />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title={f.byCategory} subtitle={f.byCategorySub}>
              <ul className="space-y-2.5">
                {a.porCategoria.map((c) => (
                  <li key={c.name}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-ink-2">{tv(c.name)}</span>
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
            <Panel title={f.byRegion}>
              <BarList items={traduzir(a.porRegiao)} format={fmtMoneyShort} secondary={(i) => fmtPct(i.value / (k.atual.liquido || 1))} />
            </Panel>
            <Panel title={f.bySegment}>
              <BarList items={traduzir(a.porSegmento)} format={fmtMoneyShort} secondary={(i) => fmtPct(i.value / (k.atual.liquido || 1))} />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Panel
              title={f.topCustomers}
              subtitle={f.topCustomersSub(fmtPct(a.concentracaoTop10), fmtInt(a.totalClientes))}
            >
              <Table
                minWidth={480}
                head={
                  <>
                    <th className={th}>#</th>
                    <th className={th}>{f.cols.customer}</th>
                    <th className={`${th} text-right`}>{f.cols.revenue}</th>
                    <th className={`${th} text-right`}>{f.cols.share}</th>
                    <th className={`${th} text-right`}>{f.cols.cumulative}</th>
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
              <Panel title={f.sellers} subtitle={f.sellersSub}>
                <BarList
                  items={a.vendedores.slice(0, 8)}
                  format={fmtMoneyShort}
                  color="bg-series-3"
                  secondary={(i) => f.nfs(a.vendedores.find((v) => v.name === i.name)?.notas ?? 0)}
                />
              </Panel>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.4fr]">
            <Panel title={f.products} subtitle={f.productsSub}>
              <BarList items={a.produtos.map((p) => ({ ...p, name: translateProduct(lang, p.name) }))} format={fmtMoneyShort} />
            </Panel>
            <Panel title={f.invoices} subtitle={f.invoicesSub}>
              <div id="notas" className="scroll-mt-32" />
              <Table
                minWidth={520}
                head={
                  <>
                    <th className={th}>{f.cols.invoice}</th>
                    <th className={th}>{f.cols.issued}</th>
                    <th className={th}>{f.cols.customer}</th>
                    <th className={th}>{f.cols.type}</th>
                    <th className={`${th} text-right`}>{f.cols.value}</th>
                  </>
                }
              >
                {pagina.rows.map((n) => (
                  <tr key={n.nota_id}>
                    <td className={`${td} font-mono text-xs`}>{n.numero}</td>
                    <td className={td}>{fmtDate(n.data)}</td>
                    <td className={`${td} max-w-[220px] truncate`}>{n.cliente}</td>
                    <td className={td}>
                      <Badge tone={n.tipo === "Devolução" ? "warning" : "neutral"}>{tv(n.tipo)}</Badge>
                    </td>
                    <td className={`${td} text-right ${n.tipo === "Devolução" ? "text-critical" : ""}`}>
                      {n.tipo === "Devolução" ? "−" : ""}
                      {fmtMoney(n.valor)}
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination base={localePath(lang, "/demo/faturamento")} params={params} page={pagina.page} pages={pagina.pages} total={pagina.total} anchor="#notas" />
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
