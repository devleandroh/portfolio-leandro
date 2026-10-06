import type { Metadata } from "next";
import Link from "next/link";
import { ColumnChart } from "@/components/charts/Charts";
import { SERIES } from "@/components/charts/series";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { Badge, BarList, EmptyState, Kpi, Pagination, Panel, Table, td, th } from "@/components/ui/dashboard";
import { FilterBar } from "@/components/ui/FilterBar";
import { paginate, type SearchParams } from "@/lib/analytics/common";
import { analisarLegal, filtrarProcessos, opcoesLegal, parseLegalFiltros, STATUS_ATIVOS } from "@/lib/analytics/legal";
import { getLegalDataset } from "@/lib/data/repository";
import { fmtDate, fmtInt, fmtMoney, fmtMoneyShort, fmtMonth, fmtPct } from "@/lib/format";

export const metadata: Metadata = { title: "Legal BI — demonstração" };

const RISCO_TONE = { Provável: "critical", Possível: "warning", Remota: "neutral" } as const;

export default async function JuridicoPage({ searchParams }: PageProps<"/demo/juridico">) {
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

  return (
    <>
      <DemoHeader
        title="Legal BI"
        description="Carteira de processos, valores em discussão, risco e agenda de prazos em uma única visão."
        today={today}
        warning={warning}
      />

      <FilterBar
        key={JSON.stringify(params)}
        segmented={{
          name: "situacao",
          label: "Situação",
          value: filtros.situacao,
          options: [
            { value: "", label: "Todos" },
            { value: "ativos", label: "Ativos" },
            { value: "encerrados", label: "Encerrados" },
          ],
        }}
        selects={[
          { name: "area", label: "Área", value: filtros.area, all: "Todas", options: opcoes.areas.map((v) => ({ value: v, label: v })) },
          { name: "status", label: "Status", value: filtros.status, options: [...STATUS_ATIVOS, "Encerrado"].map((v) => ({ value: v, label: v })) },
          { name: "tribunal", label: "Tribunal", value: filtros.tribunal, options: opcoes.tribunais.map((v) => ({ value: v, label: v })) },
          { name: "advogado", label: "Responsável", value: filtros.advogado, options: opcoes.advogados.map((v) => ({ value: v, label: v })) },
          { name: "risco", label: "Risco", value: filtros.risco, options: ["Provável", "Possível", "Remota"].map((v) => ({ value: v, label: v })) },
        ]}
        search={{ name: "q", value: filtros.busca, placeholder: "Nº do processo, cliente…" }}
      />

      {processos.length === 0 ? (
        <div className="mt-6">
          <EmptyState>Nenhum processo encontrado para os filtros selecionados.</EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Processos ativos" value={fmtInt(k.ativos)} hint={`${fmtInt(k.total)} na carteira`} />
            <Kpi label="Encerrados" value={fmtInt(k.encerrados)} hint={`${fmtPct(k.taxaAcordo)} encerrados por acordo`} />
            <Kpi label="Valor em discussão" value={fmtMoneyShort(k.valorCausaAtivos)} hint="Soma do valor da causa dos ativos" />
            <Kpi label="Provisão estimada" value={fmtMoneyShort(k.provisao)} hint="Conforme risco provável/possível" />
            <Kpi label="Taxa de êxito" value={fmtPct(k.taxaExito)} hint="Encerrados com resultado favorável ou parcial" />
            <Kpi
              label="Prazos vencidos"
              value={fmtInt(k.prazosVencidos)}
              tone={k.prazosVencidos > 0 ? "critical" : undefined}
              hint={`${fmtInt(k.prazos7)} vencem em 7 dias · ${fmtInt(k.prazos30)} em 30`}
            />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title="Evolução da carteira" subtitle="Processos novos × encerrados por mês (24 meses) · o último mês está em andamento" className="lg:col-span-2">
              <ColumnChart
                data={a.evolucao.map((e) => ({ mes: fmtMonth(e.mes), novos: e.novos, encerrados: e.encerrados }))}
                xKey="mes"
                series={[
                  { key: "novos", name: "Novos processos", color: SERIES.blue },
                  { key: "encerrados", name: "Encerrados", color: SERIES.orange },
                ]}
              />
            </Panel>
            <Panel title="Ativos por status">
              <BarList items={a.porStatus} format={fmtInt} />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Panel title="Ativos por área" subtitle="Quantidade · valor em discussão">
              <BarList
                items={a.porArea}
                format={fmtInt}
                secondary={(i) => fmtMoneyShort(a.porArea.find((x) => x.name === i.name)?.valor ?? 0)}
              />
            </Panel>
            <Panel title="Distribuição por tribunal" subtitle="Processos ativos">
              <BarList items={a.porTribunal} format={fmtInt} color="bg-series-3" />
            </Panel>
            <Panel title="Tempo de tramitação" subtitle="Idade dos processos ativos desde a distribuição">
              <ColumnChart data={a.aging} xKey="faixa" series={[{ key: "quantidade", name: "Processos", color: SERIES.blue }]} />
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_1.6fr]">
            <Panel title="Risco da carteira ativa" subtitle="Prognóstico de perda · valor envolvido">
              <ul className="space-y-3">
                {a.porRisco.map((r) => (
                  <li key={r.name} className="flex items-center justify-between gap-2 text-sm">
                    <Badge tone={RISCO_TONE[r.name as keyof typeof RISCO_TONE]}>{r.name}</Badge>
                    <span className="text-right tabular">
                      <span className="font-medium">{fmtInt(r.value)}</span>
                      <span className="ml-2 text-xs text-muted">{fmtMoneyShort(r.valor)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Resultado dos encerrados">
              <BarList items={a.porResultado} format={fmtInt} color="bg-series-2" />
            </Panel>
            <Panel title="Agenda de prazos" subtitle="Vencidos e próximos 30 dias">
              {a.prazos.length === 0 ? (
                <EmptyState>Nenhum prazo pendente.</EmptyState>
              ) : (
                <ul className="divide-y divide-line text-xs">
                  {a.prazos.map((z) => {
                    const vencido = z.data_limite < today;
                    const dias = Math.round((Date.parse(z.data_limite) - Date.parse(today)) / 86_400_000);
                    return (
                      <li key={z.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <Link href={`/demo/juridico/${z.processo_numero}`} className="font-mono font-medium text-accent-strong hover:underline">
                            {z.processo_numero}
                          </Link>
                          <span className="ml-2 text-ink-2">{z.tipo}</span>
                          <p className="truncate text-muted">
                            {z.responsavel} · {z.cliente}
                          </p>
                        </div>
                        <span className="shrink-0 text-right">
                          <Badge tone={vencido ? "critical" : dias <= 7 ? "warning" : "neutral"}>
                            {vencido ? `vencido há ${-dias} d` : dias === 0 ? "hoje" : `em ${dias} d`}
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

          <Panel title="Processos" subtitle="Mais recentes primeiro · clique para ver a ficha completa" className="mt-3">
            <div id="lista" className="scroll-mt-32" />
            <Table
              head={
                <>
                  <th className={th}>Processo</th>
                  <th className={th}>Cliente</th>
                  <th className={th}>Área</th>
                  <th className={th}>Tribunal</th>
                  <th className={th}>Status</th>
                  <th className={th}>Risco</th>
                  <th className={`${th} text-right`}>Valor da causa</th>
                  <th className={th}>Distribuição</th>
                </>
              }
            >
              {pagina.rows.map((p) => (
                <tr key={p.numero} className="hover:bg-page">
                  <td className={td}>
                    <Link href={`/demo/juridico/${p.numero}`} className="font-mono font-medium text-accent-strong hover:underline">
                      {p.numero}
                    </Link>
                  </td>
                  <td className={`${td} max-w-[220px] truncate`}>{p.cliente}</td>
                  <td className={td}>{p.area}</td>
                  <td className={td}>{p.tribunal}</td>
                  <td className={td}>
                    <Badge tone={p.status === "Encerrado" ? "neutral" : p.status === "Suspenso" ? "warning" : "info"}>{p.status}</Badge>
                  </td>
                  <td className={td}>
                    <Badge tone={RISCO_TONE[p.risco as keyof typeof RISCO_TONE]}>{p.risco}</Badge>
                  </td>
                  <td className={`${td} text-right`}>{fmtMoney(p.valor_causa)}</td>
                  <td className={td}>{fmtDate(p.data_distribuicao)}</td>
                </tr>
              ))}
            </Table>
            <Pagination base="/demo/juridico" params={params} page={pagina.page} pages={pagina.pages} total={pagina.total} anchor="#lista" />
          </Panel>
        </>
      )}
    </>
  );
}
