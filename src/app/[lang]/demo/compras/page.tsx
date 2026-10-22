import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ColumnChart } from "@/components/charts/Charts";
import { SERIES } from "@/components/charts/series";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { Badge, BarList, EmptyState, Kpi, Pagination, Panel, Table, td, th } from "@/components/ui/dashboard";
import { FilterBar } from "@/components/ui/FilterBar";
import { paginate, type SearchParams } from "@/lib/analytics/common";
import {
  analisarCompras, etapaAtual, STATUS_TONE, filtrarCompras, opcoesCompras, parseComprasFiltros, PERIODOS_COMPRAS, STATUS_SC,
} from "@/lib/analytics/compras";
import { hasLocale, localePath } from "@/i18n/config";
import { valueTranslator } from "@/i18n/data";
import { getDictionary } from "@/i18n/dictionaries";
import { getComprasDataset } from "@/lib/data/repository";
import { formatters } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/demo/compras">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: `${t.compras.title} — ${t.meta.demoSuffix}` };
}

export default async function ComprasPage({ params: route, searchParams }: PageProps<"/[lang]/demo/compras">) {
  const { lang } = await route;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const c = t.compras;
  const tv = valueTranslator(lang);
  const { fmtDate, fmtDays, fmtInt, fmtMoney, fmtMoneyShort, fmtMonth, fmtPct } = formatters(lang);
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
        lang={lang}
        title={c.title}
        description={c.description}
        today={today}
        warning={warning}
      />

      <FilterBar
        key={JSON.stringify(params)}
        segmented={{ name: "periodo", label: c.filters.period, value: filtros.periodo, options: PERIODOS_COMPRAS.map((p) => ({ value: p.value, label: tv(p.label) })) }}
        selects={[
          { name: "centro", label: c.filters.center, value: filtros.centro, options: opcoes.centros.map((v) => ({ value: v, label: tv(v) })) },
          { name: "categoria", label: c.filters.category, value: filtros.categoria, all: t.ui.filters.allF, options: opcoes.categorias.map((v) => ({ value: v, label: tv(v) })) },
          { name: "status", label: c.filters.status, value: filtros.status, options: STATUS_SC.map((v) => ({ value: v, label: tv(v) })) },
          { name: "prioridade", label: c.filters.priority, value: filtros.prioridade, all: t.ui.filters.allF, options: ["Normal", "Alta", "Urgente"].map((v) => ({ value: v, label: tv(v) })) },
        ]}
        search={{ name: "q", value: filtros.busca, placeholder: c.filters.search }}
        labels={t.ui.filters}
      />

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState>{c.empty}</EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Kpi label={c.kpi.requests} value={fmtInt(a.kpis.solicitacoes)} hint={c.kpi.requestsHint(fmtInt(a.kpis.abertas))} />
            <Kpi label={c.kpi.approved} value={fmtInt(a.kpis.aprovadas)} hint={c.kpi.approvedHint(fmtInt(a.kpis.emAprovacao))} />
            <Kpi label={c.kpi.orders} value={fmtInt(a.kpis.pedidos)} hint={c.kpi.ordersHint(fmtInt(a.kpis.aguardandoPedido))} />
            <Kpi
              label={c.kpi.pending}
              value={fmtInt(a.kpis.pedidosPendentes)}
              hint={c.kpi.pendingHint(fmtInt(a.kpis.pedidosAtrasados))}
              tone={a.kpis.pedidosAtrasados > 0 ? "warning" : undefined}
            />
            <Kpi label={c.kpi.invoices} value={fmtInt(a.kpis.notas)} hint={c.kpi.invoicesHint} />
            <Kpi label={c.kpi.cycle} value={fmtDays(a.cicloTotal.media)} hint={c.kpi.cycleHint(fmtDays(a.cicloTotal.mediana))} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi label={c.kpi.requested} value={fmtMoneyShort(a.kpis.valorSolicitado)} hint={c.kpi.requestedHint} />
            <Kpi label={c.kpi.purchased} value={fmtMoneyShort(a.kpis.valorComprado)} hint={c.kpi.purchasedHint} />
            <Kpi label={c.kpi.received} value={fmtMoneyShort(a.kpis.valorRecebido)} hint={c.kpi.receivedHint} />
            <Kpi label={c.kpi.savings} value={fmtMoneyShort(a.kpis.economia)} hint={c.kpi.savingsHint(fmtPct(a.kpis.economiaPct))} />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Panel title={c.funnel} subtitle={c.funnelSub}>
              <ol className="space-y-2.5">
                {a.funil.map((f, i) => (
                  <li key={f.etapa} className="grid grid-cols-[120px_1fr] items-center gap-3 text-xs sm:grid-cols-[140px_1fr]">
                    <span className="text-ink-2">{tv(f.etapa)}</span>
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

            <Panel title={c.times} subtitle={c.timesSub}>
              <ul className="space-y-4">
                {a.tempos.map((t) => (
                  <li key={t.etapa}>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-2">{tv(t.etapa)}</span>
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
                {c.timesNote}
              </p>
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title={c.monthly} subtitle={c.monthlySub} className="lg:col-span-2">
              <ColumnChart
                lang={lang}
                data={a.mensal.map((m) => ({ mes: fmtMonth(m.mes), solicitacoes: m.solicitacoes, pedidos: m.pedidos, notas: m.notas }))}
                xKey="mes"
                series={[
                  { key: "solicitacoes", name: c.series.requests, color: SERIES.blue },
                  { key: "pedidos", name: c.series.orders, color: SERIES.orange },
                  { key: "notas", name: c.series.invoices, color: SERIES.aqua },
                ]}
              />
            </Panel>
            <Panel title={c.cycleDist} subtitle={c.cycleDistSub}>
              <ColumnChart
                lang={lang}
                data={a.faixas.map((f) => ({ ...f, faixa: tv(f.faixa) }))}
                xKey="faixa"
                series={[{ key: "quantidade", name: c.series.requests, color: SERIES.blue }]}
              />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title={c.byCenter}>
              <BarList items={a.porCentro.slice(0, 8).map((i) => ({ ...i, name: tv(i.name) }))} format={fmtMoneyShort} />
            </Panel>
            <Panel title={c.suppliers} subtitle={c.suppliersSub}>
              <BarList
                items={a.porFornecedor}
                format={fmtMoneyShort}
                secondary={(i) => c.pos(a.porFornecedor.find((f) => f.name === i.name)?.pedidos ?? 0)}
              />
            </Panel>
            <Panel title={c.late} subtitle={c.lateSub}>
              {a.atrasados.length === 0 ? (
                <EmptyState>{c.noLate}</EmptyState>
              ) : (
                <ul className="divide-y divide-line text-xs">
                  {a.atrasados.map((r) => (
                    <li key={r.sc_numero} className="flex items-center justify-between gap-2 py-2">
                      <Link href={localePath(lang, `/demo/compras/${r.sc_numero}`)} className="min-w-0 hover:underline">
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

          <Panel title={c.list} subtitle={c.listSub} className="mt-3">
            <div id="lista" className="scroll-mt-32" />
            <Table
              head={
                <>
                  <th className={th}>{c.cols.request}</th>
                  <th className={th}>{c.cols.date}</th>
                  <th className={th}>{c.cols.center}</th>
                  <th className={th}>{c.cols.status}</th>
                  <th className={th}>{c.cols.order}</th>
                  <th className={th}>{c.cols.supplier}</th>
                  <th className={`${th} text-right`}>{c.cols.value}</th>
                  <th className={th}>{c.cols.stage}</th>
                </>
              }
            >
              {pagina.rows.map((r) => {
                const etapa = etapaAtual(r);
                return (
                  <tr key={r.sc_numero} className="hover:bg-page">
                    <td className={td}>
                      <Link href={localePath(lang, `/demo/compras/${r.sc_numero}`)} className="font-mono font-medium text-accent-strong hover:underline">
                        {r.sc_numero}
                      </Link>
                    </td>
                    <td className={td}>{fmtDate(r.sc_data)}</td>
                    <td className={td}>{tv(r.centro_custo)}</td>
                    <td className={td}>
                      <Badge tone={STATUS_TONE[r.sc_status]}>{tv(r.sc_status)}</Badge>
                    </td>
                    <td className={`${td} font-mono`}>{r.pc_numero ?? "—"}</td>
                    <td className={`${td} max-w-[220px] truncate`}>{r.fornecedor ?? "—"}</td>
                    <td className={`${td} text-right`}>{fmtMoney(r.pc_valor ?? r.sc_valor_estimado)}</td>
                    <td className={td}>
                      <span className="flex items-center gap-1" title={c.stages[etapa - 1]}>
                        {[1, 2, 3, 4].map((s) => (
                          <span key={s} className={`h-1.5 w-4 rounded-sm ${s <= etapa ? "bg-series-1" : "bg-line"}`} />
                        ))}
                        <span className="ml-1 text-xs text-muted">{c.stages[etapa - 1]}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination base={localePath(lang, "/demo/compras")} params={params} page={pagina.page} pages={pagina.pages} total={pagina.total} anchor="#lista" />
          </Panel>
        </>
      )}
    </>
  );
}
