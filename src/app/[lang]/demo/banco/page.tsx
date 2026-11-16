import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowUpRight } from "lucide-react";
import { ColumnChart, TrendChart } from "@/components/charts/Charts";
import { SERIES } from "@/components/charts/series";
import { BancoTabs } from "@/components/demo/BancoTabs";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { BarList, EmptyState, Kpi, Panel, Table, td, th } from "@/components/ui/dashboard";
import { FilterBar } from "@/components/ui/FilterBar";
import type { SearchParams } from "@/lib/analytics/common";
import {
  analisarCarteira, analisarClientes, analisarPerfil, analisarTransacoes, opcoesBanco, parseBancoFiltros,
  resumoQualidade, ultimaExecucao,
} from "@/lib/analytics/banco";
import { delta } from "@/lib/analytics/common";
import { hasLocale, localePath } from "@/i18n/config";
import { valueTranslator } from "@/i18n/data";
import { getDictionary } from "@/i18n/dictionaries";
import { getBancoDataset } from "@/lib/data/repository";
import { formatters } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/demo/banco">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: `${t.banco.metaTitle} — ${t.meta.demoSuffix}` };
}

export default async function BancoPage({ params: route, searchParams }: PageProps<"/[lang]/demo/banco">) {
  const { lang } = await route;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const b = t.banco;
  const tv = valueTranslator(lang);
  const { fmtDate, fmtDec, fmtInt, fmtMoneyShort, fmtMonth, fmtPct } = formatters(lang);
  const sp = (await searchParams) as SearchParams;
  const { data, today, warning } = await getBancoDataset();
  const f = parseBancoFiltros(sp);
  const opcoes = opcoesBanco(data);

  const c = analisarCarteira(data, f);
  const p = analisarPerfil(data, f);
  const tx = analisarTransacoes(data.transacoes, f, today);
  const cl = analisarClientes(data.clientes, f);
  const { ultima } = ultimaExecucao(data.execucoes);
  const dq = resumoQualidade(data.qualidade);
  const a = c.atual;
  const params = Object.fromEntries(Object.entries({ segmento: f.segmento, produto: f.produto }).filter(([, v]) => v));
  const pp = (v: number) => `${v > 0 ? "+" : ""}${fmtDec(v * 100)}`;
  const traduzir = <T extends { name: string }>(items: T[]) => items.map((i) => ({ ...i, name: tv(i.name) }));

  return (
    <>
      <BancoTabs lang={lang} active="painel" />
      <DemoHeader lang={lang} title={b.title} description={b.description} today={today} warning={warning} />

      {ultima && (
        <Link
          href={localePath(lang, "/demo/banco/pipeline")}
          className="mb-3 flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink-2 hover:border-ink"
        >
          <Activity className={`h-4 w-4 ${ultima.status === "falha" ? "text-critical" : "text-good"}`} />
          <span>
            {b.pipelineBadge(`${fmtDate(ultima.inicio)} ${ultima.inicio.slice(11, 16)} UTC`, dq.total, dq.ok)}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-medium text-ink">
            {b.pipelineLink} <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      <FilterBar
        key={JSON.stringify(params)}
        selects={[
          { name: "segmento", label: b.filters.segment, value: f.segmento, options: opcoes.segmentos.map((v) => ({ value: v, label: tv(v) })) },
          { name: "produto", label: b.filters.product, value: f.produto, options: opcoes.produtos.map((v) => ({ value: v, label: tv(v) })) },
        ]}
        labels={t.ui.filters}
      />
      <p className="mt-3 text-xs text-muted">{b.position(fmtDate(c.dataPosicao))}</p>

      {a.saldo === 0 ? (
        <div className="mt-4">
          <EmptyState>{b.empty}</EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Kpi
              label={b.kpi.portfolio}
              value={fmtMoneyShort(a.saldo)}
              delta={c.mes12 ? delta(a.saldo, c.mes12.saldo) : null}
              deltaLabel={b.kpi.vs12}
              hint={b.kpi.portfolioHint(fmtInt(a.contratos))}
            />
            <Kpi
              label={b.kpi.npl}
              value={fmtPct(a.inadimplencia)}
              tone={a.inadimplencia > 0.05 ? "critical" : a.inadimplencia > 0.03 ? "warning" : undefined}
              hint={`${b.kpi.nplHint(fmtMoneyShort(a.atraso90))}${c.mes12 ? ` · ${b.kpi.pp(pp(a.inadimplencia - c.mes12.inadimplencia))}` : ""}`}
            />
            <Kpi label={b.kpi.provision} value={fmtMoneyShort(a.provisao)} hint={b.kpi.provisionHint(fmtPct(a.cobertura))} />
            <Kpi
              label={b.kpi.customers}
              value={fmtInt(cl.atual?.clientes ?? 0)}
              delta={cl.atual && cl.mes12 ? delta(cl.atual.clientes, cl.mes12.clientes) : null}
              deltaLabel={b.kpi.vs12}
              hint={b.kpi.customersHint(fmtInt(cl.atual?.novos ?? 0))}
            />
            <Kpi
              label={b.kpi.pix}
              value={fmtMoneyShort(tx.pixAtual.valor)}
              delta={delta(tx.pixAtual.valor, tx.pixAnterior.valor)}
              deltaLabel={b.kpi.vs30}
              hint={b.kpi.pixHint(fmtInt(tx.pixAtual.qtd), fmtPct(tx.participacaoPix))}
            />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title={b.charts.portfolio} subtitle={b.charts.portfolioSub} className="lg:col-span-2">
              <TrendChart
                lang={lang}
                data={c.serie.map((s) => ({ mes: fmtMonth(s.mes), saldo: Math.round(s.saldo) }))}
                xKey="mes"
                series={[{ key: "saldo", name: b.charts.balance, color: SERIES.blue }]}
              />
            </Panel>
            <Panel title={b.charts.risk} subtitle={b.charts.riskSub}>
              <TrendChart
                lang={lang}
                data={c.serie.map((s) => ({ mes: fmtMonth(s.mes), npl: Number(s.inadimplencia.toFixed(4)), e2: Number(s.estagio2.toFixed(4)) }))}
                xKey="mes"
                series={[
                  { key: "npl", name: b.charts.npl, color: SERIES.orange },
                  { key: "e2", name: b.charts.stage2, color: SERIES.comparison, dashed: true },
                ]}
                format="pct"
              />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title={b.charts.byProduct} subtitle={b.charts.byProductSub}>
              <BarList
                items={traduzir(c.porProduto)}
                format={fmtMoneyShort}
                secondary={(i) => fmtPct(c.porProduto.find((x) => tv(x.name) === i.name)?.inadimplencia ?? 0)}
              />
            </Panel>
            <Panel title={b.charts.stages} subtitle={b.charts.stagesSub}>
              <ul className="space-y-3">
                {c.estagios.map((e, i) => (
                  <li key={e.name}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-ink-2">
                        <span className="font-medium text-ink">{tv(e.name)}</span> · {b.charts.stageHelp[i]}
                      </span>
                      <span className="shrink-0 font-medium tabular">{fmtPct(e.value / (a.saldo || 1))}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-r-[4px] bg-wash">
                      <div
                        className={`h-2 rounded-r-[4px] ${i === 0 ? "bg-series-1" : i === 1 ? "bg-warning" : "bg-critical"}`}
                        style={{ width: `${Math.max(0.5, (e.value / (a.saldo || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted tabular">{fmtMoneyShort(e.value)}</p>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title={b.charts.byScore} subtitle={b.charts.byScoreSub}>
              <BarList items={traduzir(p.porScore)} format={fmtPct} color="bg-series-2" secondary={(i) => fmtMoneyShort(p.porScore.find((x) => tv(x.name) === i.name)?.saldo ?? 0)} />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title={b.charts.byIncome} subtitle={b.charts.byIncomeSub}>
              <BarList items={traduzir(p.porRenda)} format={fmtPct} color="bg-series-2" secondary={(i) => fmtMoneyShort(p.porRenda.find((x) => tv(x.name) === i.name)?.saldo ?? 0)} />
            </Panel>
            <Panel title={b.charts.rateVsSelic} subtitle={b.charts.rateVsSelicSub} className="lg:col-span-2">
              <TrendChart
                lang={lang}
                data={c.taxaVsSelic.map((s) => ({ mes: fmtMonth(s.mes), taxa: Number(s.taxa.toFixed(4)), selic: Number(s.selic.toFixed(4)) }))}
                xKey="mes"
                series={[
                  { key: "taxa", name: b.charts.rate, color: SERIES.blue },
                  { key: "selic", name: b.charts.selic, color: SERIES.aqua },
                ]}
                format="pct"
              />
            </Panel>
          </div>
        </>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title={b.charts.transactions} subtitle={b.charts.transactionsSub} className="lg:col-span-2">
          <ColumnChart
            lang={lang}
            data={tx.mensal.map((m) => ({ mes: fmtMonth(m.mes), pix: m.pix, cartoes: m.cartoes, outros: m.outros }))}
            xKey="mes"
            series={[
              { key: "pix", name: b.charts.pixSerie, color: SERIES.blue },
              { key: "cartoes", name: b.charts.cards, color: SERIES.orange },
              { key: "outros", name: b.charts.others, color: SERIES.aqua },
            ]}
          />
        </Panel>
        <Panel title={b.charts.byChannel} subtitle={b.charts.byChannelSub}>
          <BarList
            items={traduzir(tx.porCanal)}
            format={fmtMoneyShort}
            color="bg-series-3"
            secondary={(i) => b.charts.tx(fmtInt(tx.porCanal.find((x) => tv(x.name) === i.name)?.qtd ?? 0))}
          />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.3fr]">
        <Panel title={b.charts.deposits} subtitle={b.charts.depositsSub}>
          <TrendChart
            lang={lang}
            data={cl.serie.map((s) => ({ mes: fmtMonth(s.mes), dep: Math.round(s.depositos) }))}
            xKey="mes"
            series={[{ key: "dep", name: b.charts.deposits, color: SERIES.aqua }]}
            height={220}
          />
        </Panel>
        <Panel title={b.charts.macro} subtitle={b.charts.macroSub}>
          <Table
            minWidth={460}
            head={
              <>
                <th className={th}>{b.charts.macroCols.month}</th>
                <th className={`${th} text-right`}>{b.charts.macroCols.selic}</th>
                <th className={`${th} text-right`}>{b.charts.macroCols.ipca}</th>
                <th className={`${th} text-right`}>{b.charts.macroCols.ipca12}</th>
                <th className={`${th} text-right`}>{b.charts.macroCols.usd}</th>
              </>
            }
          >
            {[...data.macro].sort((x, y) => y.ano_mes.localeCompare(x.ano_mes)).slice(0, 6).map((m) => (
              <tr key={m.ano_mes}>
                <td className={td}>{fmtMonth(m.ano_mes)}</td>
                <td className={`${td} text-right`}>{m.selic_meta != null ? `${fmtDec(m.selic_meta)}%` : "—"}</td>
                <td className={`${td} text-right`}>{m.ipca_mensal != null ? `${fmtDec(m.ipca_mensal)}%` : "—"}</td>
                <td className={`${td} text-right`}>{m.ipca_12m != null ? `${fmtDec(m.ipca_12m)}%` : "—"}</td>
                <td className={`${td} text-right`}>{m.dolar_medio != null ? `R$ ${m.dolar_medio.toFixed(2)}` : "—"}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
