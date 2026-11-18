import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronRight, ExternalLink, XCircle } from "lucide-react";
import { BancoTabs } from "@/components/demo/BancoTabs";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { Badge, EmptyState, Kpi, Panel, Table, td, th } from "@/components/ui/dashboard";
import { resumoQualidade, ultimaExecucao } from "@/lib/analytics/banco";
import { getCase } from "@/content/cases";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getBancoDataset } from "@/lib/data/repository";
import { formatters } from "@/lib/format";

// Revalida a cada hora: a execução diária do pipeline aparece sem precisar de novo deploy.
export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]/demo/banco/pipeline">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: `${t.banco.pipeline.metaTitle} — ${t.meta.demoSuffix}` };
}

const somaLinhas = (o?: Record<string, number>) => Object.values(o ?? {}).reduce((s, v) => s + (v > 0 ? v : 0), 0);

export default async function BancoPipelinePage({ params: route }: PageProps<"/[lang]/demo/banco/pipeline">) {
  const { lang } = await route;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const p = t.banco.pipeline;
  const { fmtDate, fmtDec, fmtInt, fmtPct } = formatters(lang);
  const { data, today, warning } = await getBancoDataset();
  const { ultima, historico } = ultimaExecucao(data.execucoes);
  const dq = resumoQualidade(data.qualidade);
  const repo = getCase(lang, "banco-360")?.repoHref;
  const quando = (iso: string) => `${fmtDate(iso)} ${iso.slice(11, 16)} UTC`;
  const dur = (s: number | null | undefined) => (s == null ? "—" : s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${fmtDec(s)} s`);
  const tom = (s: string) => (s === "sucesso" ? "good" : s === "falha" ? "critical" : "info");
  const fmtObs = (r: (typeof data.qualidade)[number]) =>
    r.observado == null ? "—" : r.regra === "taxa_rejeicao" ? fmtPct(r.observado) : fmtInt(r.observado);

  const v = ultima?.volumes ?? {};
  const camadas = [
    somaLinhas(v.simular_origem) || somaLinhas(v.ingestao_core) + somaLinhas(v.ingestao_arquivos),
    somaLinhas(v.ingestao_core) + somaLinhas(v.ingestao_arquivos) + somaLinhas(v.ingestao_bcb),
    somaLinhas(v.bronze_para_silver),
    somaLinhas(v.silver_para_gold),
    somaLinhas(v.carga_warehouse),
    null,
  ];
  const maxEtapa = Math.max(1, ...(ultima?.etapas ?? []).map((e) => e.duracao_s));

  return (
    <>
      <BancoTabs lang={lang} active="pipeline" />
      <DemoHeader lang={lang} title={p.title} description={p.description} today={today} warning={warning} guide="bancoPipeline" />
      {repo && (
        <a href={repo} target="_blank" rel="noreferrer" className="-mt-2 mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline">
          {p.repo} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {!ultima ? (
        <EmptyState>{p.none}</EmptyState>
      ) : (
        <>
          <Panel title={p.flow} subtitle={p.flowSub}>
            <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {p.layers.map((l, i) => (
                <li key={l.k} className="relative rounded-md border border-line bg-page p-3">
                  <p className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold">
                    {l.k}
                    {i < p.layers.length - 1 && <ChevronRight className="hidden h-4 w-4 text-muted lg:inline" />}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-ink-2">{l.d}</p>
                  {camadas[i] ? <p className="mt-2 font-mono text-xs tabular">{fmtInt(camadas[i] ?? 0)} {p.rows}</p> : null}
                </li>
              ))}
            </ol>
          </Panel>

          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label={p.last} value={p.status[ultima.status]} tone={ultima.status === "falha" ? "critical" : undefined} hint={quando(ultima.inicio)} />
            <Kpi label={p.reference} value={fmtDate(ultima.data_referencia)} hint={p.mode[ultima.modo]} />
            <Kpi label={p.duration} value={dur(ultima.duracao_s)} hint={`${ultima.etapas.length} ${p.steps.toLowerCase()}`} />
            <Kpi label={p.trigger} value={p.origin[ultima.origem] ?? ultima.origem} hint={ultima.execucao_id.slice(0, 8)} />
          </div>
          {ultima.erro && <p className="mt-3 rounded-md border border-critical/30 bg-critical/10 px-3 py-2 font-mono text-xs text-critical">{ultima.erro}</p>}

          <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_1fr]">
            <Panel title={p.steps} subtitle={p.stepsSub}>
              <ol className="space-y-2.5">
                {ultima.etapas.map((e, i) => (
                  <li key={`${e.etapa}-${i}`} className="text-xs">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-1.5">
                        {e.status === "sucesso" ? <CheckCircle2 className="h-3.5 w-3.5 text-good" /> : <XCircle className="h-3.5 w-3.5 text-critical" />}
                        <span className="text-ink">{p.stepNames[e.etapa] ?? e.etapa}</span>
                      </span>
                      <span className="shrink-0 tabular text-ink-2">
                        {dur(e.duracao_s)}
                        {somaLinhas(e.linhas) > 0 && <span className="ml-2 text-muted">{fmtInt(somaLinhas(e.linhas))} {p.rows}</span>}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-r bg-wash">
                      <div className={`h-1.5 rounded-r ${e.status === "sucesso" ? "bg-series-1" : "bg-critical"}`} style={{ width: `${Math.max(0.8, (e.duracao_s / maxEtapa) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>

            <div className="grid content-start gap-3">
              <Panel title={p.quality} subtitle={p.qualitySub(dq.total)}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border border-good/30 bg-good/10 p-2">
                    <p className="text-xl font-semibold text-good-text tabular">{dq.ok}</p>
                    <p className="text-[11px] text-ink-2">{p.passed}</p>
                  </div>
                  <div className={`rounded-md border p-2 ${dq.falhasErro ? "border-critical/30 bg-critical/10" : "border-line bg-page"}`}>
                    <p className="text-xl font-semibold tabular">{dq.falhasErro}</p>
                    <p className="text-[11px] text-ink-2">{p.errors}</p>
                  </div>
                  <div className={`rounded-md border p-2 ${dq.alertas ? "border-warning/50 bg-warning/15" : "border-line bg-page"}`}>
                    <p className="text-xl font-semibold tabular">{dq.alertas}</p>
                    <p className="text-[11px] text-ink-2">{p.warnings}</p>
                  </div>
                </div>
              </Panel>
              <Panel title={p.reconciliation} subtitle={p.reconciliationSub}>
                <ul className="divide-y divide-line text-xs">
                  {dq.reconciliacoes.map((r, i) => (
                    <li key={`${r.dataset}-${r.regra}-${i}`} className="flex items-center justify-between gap-3 py-2">
                      <span>
                        <span className="font-medium">{p.rules[r.regra] ?? r.regra}</span>
                        <span className="ml-1.5 font-mono text-muted">{r.dataset}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 tabular">
                        {fmtObs(r)} = {r.esperado && /^\d+(\.\d+)?$/.test(r.esperado) ? fmtInt(Number(r.esperado)) : r.esperado}
                        <Badge tone={r.status === "ok" ? "good" : "critical"}>{r.status === "ok" ? p.ok : p.fail}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {dq.grupos.map((g) => (
              <Panel key={g.chave} title={`${g.camada} · ${g.dataset}`} subtitle={`${g.total - g.falhas}/${g.total} ${p.passed}`}>
                <Table
                  minWidth={480}
                  head={
                    <>
                      <th className={th}>{p.cols.rule}</th>
                      <th className={th}>{p.cols.column}</th>
                      <th className={th}>{p.cols.expected}</th>
                      <th className={`${th} text-right`}>{p.cols.observed}</th>
                      <th className={th}>{p.cols.status}</th>
                    </>
                  }
                >
                  {g.regras.map((r, i) => (
                    <tr key={`${r.regra}-${r.coluna}-${i}`}>
                      <td className={td}>{p.rules[r.regra] ?? r.regra}</td>
                      <td className={`${td} max-w-[160px] truncate font-mono text-xs`}>{r.coluna ?? "—"}</td>
                      <td className={`${td} max-w-[160px] truncate text-xs text-ink-2`} title={r.esperado ?? ""}>{r.esperado}</td>
                      <td className={`${td} text-right`}>{fmtObs(r)}</td>
                      <td className={td}>
                        <Badge tone={r.status === "ok" ? "good" : r.severidade === "erro" ? "critical" : "warning"}>
                          {r.status === "ok" ? p.ok : `${p.fail} · ${p.severity[r.severidade]}`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </Table>
              </Panel>
            ))}
          </div>

          <div className="mt-3">
            <Panel title={p.history} subtitle={p.historySub}>
              <Table
                minWidth={620}
                head={
                  <>
                    <th className={th}>{p.cols.start}</th>
                    <th className={th}>{p.cols.ref}</th>
                    <th className={th}>{p.cols.mode}</th>
                    <th className={th}>{p.cols.trigger}</th>
                    <th className={th}>{p.cols.status}</th>
                    <th className={`${th} text-right`}>{p.cols.duration}</th>
                  </>
                }
              >
                {historico.map((e) => (
                  <tr key={e.execucao_id}>
                    <td className={td}>{quando(e.inicio)}</td>
                    <td className={td}>{fmtDate(e.data_referencia)}</td>
                    <td className={td}>{p.mode[e.modo]}</td>
                    <td className={td}>{p.origin[e.origem] ?? e.origem}</td>
                    <td className={td}>
                      <Badge tone={tom(e.status)}>{p.status[e.status]}</Badge>
                    </td>
                    <td className={`${td} text-right`}>{dur(e.duracao_s)}</td>
                  </tr>
                ))}
              </Table>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
