import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ColumnChart } from "@/components/charts/Charts";
import { SERIES } from "@/components/charts/series";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { Badge, BarList, EmptyState, Kpi, Pagination, Panel, Table, td, th } from "@/components/ui/dashboard";
import { FilterBar } from "@/components/ui/FilterBar";
import { paginate, type SearchParams } from "@/lib/analytics/common";
import { analisarLegal, filtrarProcessos, opcoesLegal, parseLegalFiltros, STATUS_ATIVOS } from "@/lib/analytics/legal";
import { hasLocale, localePath } from "@/i18n/config";
import { valueTranslator } from "@/i18n/data";
import { getDictionary } from "@/i18n/dictionaries";
import { getLegalDataset } from "@/lib/data/repository";
import { formatters } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/demo/juridico">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: `${t.juridico.title} — ${t.meta.demoSuffix}` };
}

const RISCO_TONE = { Provável: "critical", Possível: "warning", Remota: "neutral" } as const;

export default async function JuridicoPage({ params: route, searchParams }: PageProps<"/[lang]/demo/juridico">) {
  const { lang } = await route;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const j = t.juridico;
  const tv = valueTranslator(lang, "legal");
  const { fmtDate, fmtInt, fmtMoney, fmtMoneyShort, fmtMonth, fmtPct } = formatters(lang);
  const sp = (await searchParams) as SearchParams;
  const { data, today, warning } = await getLegalDataset();
  const filtros = parseLegalFiltros(sp);
  const processos = filtrarProcessos(data.processos, filtros);
  const a = analisarLegal(processos, data.prazos, today);
  const opcoes = opcoesLegal(data.processos);
  const k = a.kpis;

  const params = Object.fromEntries(
    Object.entries({ situacao: filtros.situacao, status: filtros.status, area: filtros.area, tribunal: filtros.tribunal, advogado: filtros.advogado, risco: filtros.risco, q: filtros.busca }).filter(([, v]) => v),
  );
  const lista = [...processos].sort((x, y) => y.data_distribuicao.localeCompare(x.data_distribuicao));
  const pagina = paginate(lista, Number(sp.pagina) || 1, 15);
  const traduzir = <T extends { name: string }>(items: T[]) => items.map((i) => ({ ...i, name: tv(i.name) }));

  return (
    <>
      <DemoHeader
        lang={lang}
        title={j.title}
        description={j.description}
        today={today}
        warning={warning}
      />

      <FilterBar
        key={JSON.stringify(params)}
        segmented={{
          name: "situacao",
          label: j.filters.situation,
          value: filtros.situacao,
          options: [
            { value: "", label: j.filters.all },
            { value: "ativos", label: j.filters.active },
            { value: "encerrados", label: j.filters.closed },
          ],
        }}
        selects={[
          { name: "area", label: j.filters.area, value: filtros.area, all: t.ui.filters.allF, options: opcoes.areas.map((v) => ({ value: v, label: tv(v) })) },
          { name: "status", label: j.filters.status, value: filtros.status, options: [...STATUS_ATIVOS, "Encerrado"].map((v) => ({ value: v, label: tv(v) })) },
          { name: "tribunal", label: j.filters.court, value: filtros.tribunal, options: opcoes.tribunais.map((v) => ({ value: v, label: v })) },
          { name: "advogado", label: j.filters.lawyer, value: filtros.advogado, options: opcoes.advogados.map((v) => ({ value: v, label: v })) },
          { name: "risco", label: j.filters.risk, value: filtros.risco, options: ["Provável", "Possível", "Remota"].map((v) => ({ value: v, label: tv(v) })) },
        ]}
        search={{ name: "q", value: filtros.busca, placeholder: j.filters.search }}
        labels={t.ui.filters}
      />

      {processos.length === 0 ? (
        <div className="mt-6">
          <EmptyState>{j.empty}</EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Kpi label={j.kpi.active} value={fmtInt(k.ativos)} hint={j.kpi.activeHint(fmtInt(k.total))} />
            <Kpi label={j.kpi.closed} value={fmtInt(k.encerrados)} hint={j.kpi.closedHint(fmtPct(k.taxaAcordo))} />
            <Kpi label={j.kpi.atStake} value={fmtMoneyShort(k.valorCausaAtivos)} hint={j.kpi.atStakeHint} />
            <Kpi label={j.kpi.provision} value={fmtMoneyShort(k.provisao)} hint={j.kpi.provisionHint} />
            <Kpi label={j.kpi.success} value={fmtPct(k.taxaExito)} hint={j.kpi.successHint} />
            <Kpi
              label={j.kpi.overdue}
              value={fmtInt(k.prazosVencidos)}
              tone={k.prazosVencidos > 0 ? "critical" : undefined}
              hint={j.kpi.overdueHint(fmtInt(k.prazos7), fmtInt(k.prazos30))}
            />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title={j.evolution} subtitle={j.evolutionSub} className="lg:col-span-2">
              <ColumnChart
                lang={lang}
                data={a.evolucao.map((e) => ({ mes: fmtMonth(e.mes), novos: e.novos, encerrados: e.encerrados }))}
                xKey="mes"
                series={[
                  { key: "novos", name: j.newCases, color: SERIES.blue },
                  { key: "encerrados", name: j.closedCases, color: SERIES.orange },
                ]}
              />
            </Panel>
            <Panel title={j.byStatus}>
              <BarList items={traduzir(a.porStatus)} format={fmtInt} />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title={j.byArea} subtitle={j.byAreaSub}>
              <BarList
                items={traduzir(a.porArea)}
                format={fmtInt}
                secondary={(i) => fmtMoneyShort(a.porArea.find((x) => tv(x.name) === i.name)?.valor ?? 0)}
              />
            </Panel>
            <Panel title={j.byCourt} subtitle={j.byCourtSub}>
              <BarList items={a.porTribunal} format={fmtInt} color="bg-series-3" />
            </Panel>
            <Panel title={j.aging} subtitle={j.agingSub}>
              <ColumnChart
                lang={lang}
                data={a.aging.map((f) => ({ ...f, faixa: tv(f.faixa) }))}
                xKey="faixa"
                series={[{ key: "quantidade", name: j.cases, color: SERIES.blue }]}
              />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_1.6fr]">
            <Panel title={j.risk} subtitle={j.riskSub}>
              <ul className="space-y-3">
                {a.porRisco.map((r) => (
                  <li key={r.name} className="flex items-center justify-between gap-2 text-sm">
                    <Badge tone={RISCO_TONE[r.name as keyof typeof RISCO_TONE]}>{tv(r.name)}</Badge>
                    <span className="text-right tabular">
                      <span className="font-medium">{fmtInt(r.value)}</span>
                      <span className="ml-2 text-xs text-muted">{fmtMoneyShort(r.valor)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title={j.results}>
              <BarList items={traduzir(a.porResultado)} format={fmtInt} color="bg-series-2" />
            </Panel>
            <Panel title={j.deadlines} subtitle={j.deadlinesSub}>
              {a.prazos.length === 0 ? (
                <EmptyState>{j.noDeadlines}</EmptyState>
              ) : (
                <ul className="divide-y divide-line text-xs">
                  {a.prazos.map((z) => {
                    const vencido = z.data_limite < today;
                    const dias = Math.round((Date.parse(z.data_limite) - Date.parse(today)) / 86_400_000);
                    return (
                      <li key={z.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <Link href={localePath(lang, `/demo/juridico/${z.processo_numero}`)} className="font-mono font-medium text-accent-strong hover:underline">
                            {z.processo_numero}
                          </Link>
                          <span className="ml-2 text-ink-2">{tv(z.tipo)}</span>
                          <p className="truncate text-muted">
                            {z.responsavel} · {z.cliente}
                          </p>
                        </div>
                        <span className="shrink-0 text-right">
                          <Badge tone={vencido ? "critical" : dias <= 7 ? "warning" : "neutral"}>
                            {vencido ? j.overdueSince(-dias) : dias === 0 ? j.today : j.inDays(dias)}
                          </Badge>
                          <span className="mt-0.5 block text-muted">{fmtDate(z.data_limite)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title={j.list} subtitle={j.listSub} className="mt-3">
            <div id="lista" className="scroll-mt-32" />
            <Table
              head={
                <>
                  <th className={th}>{j.cols.case}</th>
                  <th className={th}>{j.cols.client}</th>
                  <th className={th}>{j.cols.area}</th>
                  <th className={th}>{j.cols.court}</th>
                  <th className={th}>{j.cols.status}</th>
                  <th className={th}>{j.cols.risk}</th>
                  <th className={`${th} text-right`}>{j.cols.claim}</th>
                  <th className={th}>{j.cols.filed}</th>
                </>
              }
            >
              {pagina.rows.map((p) => (
                <tr key={p.numero} className="hover:bg-page">
                  <td className={td}>
                    <Link href={localePath(lang, `/demo/juridico/${p.numero}`)} className="font-mono font-medium text-accent-strong hover:underline">
                      {p.numero}
                    </Link>
                  </td>
                  <td className={`${td} max-w-[220px] truncate`}>{p.cliente}</td>
                  <td className={td}>{tv(p.area)}</td>
                  <td className={td}>{p.tribunal}</td>
                  <td className={td}>
                    <Badge tone={p.status === "Encerrado" ? "neutral" : p.status === "Suspenso" ? "warning" : "info"}>{tv(p.status)}</Badge>
                  </td>
                  <td className={td}>
                    <Badge tone={RISCO_TONE[p.risco as keyof typeof RISCO_TONE]}>{tv(p.risco)}</Badge>
                  </td>
                  <td className={`${td} text-right`}>{fmtMoney(p.valor_causa)}</td>
                  <td className={td}>{fmtDate(p.data_distribuicao)}</td>
                </tr>
              ))}
            </Table>
            <Pagination base={localePath(lang, "/demo/juridico")} params={params} page={pagina.page} pages={pagina.pages} total={pagina.total} anchor="#lista" />
          </Panel>
        </>
      )}
    </>
  );
}
