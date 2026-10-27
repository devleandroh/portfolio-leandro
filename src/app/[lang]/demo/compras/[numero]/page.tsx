import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Badge, Panel, Table, td, th } from "@/components/ui/dashboard";
import { hasLocale, localePath, type Locale } from "@/i18n/config";
import { translateProduct, translateValue, valueTranslator } from "@/i18n/data";
import { getDictionary } from "@/i18n/dictionaries";
import { STATUS_TONE } from "@/lib/analytics/compras";
import { getCompraDetalhe, getComprasDataset } from "@/lib/data/repository";
import { formatters } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/demo/compras/[numero]">): Promise<Metadata> {
  const { lang, numero } = await params;
  const title = hasLocale(lang) ? getDictionary(lang).compras.title : "Fluxo Compras";
  return { title: `${decodeURIComponent(numero)} — ${title}` };
}

export default async function CompraDetalhePage({ params }: PageProps<"/[lang]/demo/compras/[numero]">) {
  const { lang, numero: raw } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang).compras.detail;
  const tv = valueTranslator(lang);
  const { fmtDate, fmtMoney, fmtMoneyCents, fmtPct } = formatters(lang);
  const numero = decodeURIComponent(raw);
  const { data } = await getComprasDataset();
  const p = data.processos.find((r) => r.sc_numero === numero);
  if (!p) notFound();
  const det = await getCompraDetalhe(p.sc_numero, p.pc_numero);

  const passos = [
    { titulo: t.steps.request, data: p.sc_data, detalhe: p.sc_numero, dias: null as number | null },
    { titulo: t.steps.approval, data: p.data_aprovacao, detalhe: p.data_aprovacao ? t.approved : tv(p.sc_status), dias: p.dias_aprovacao },
    { titulo: t.steps.order, data: p.pc_data, detalhe: p.pc_numero ?? "—", dias: p.dias_ate_pedido },
    { titulo: t.steps.invoice, data: p.nf_primeira_data, detalhe: p.nf_qtd ? t.invoices(p.nf_qtd) : "—", dias: p.dias_ate_nota },
  ];
  const interrompido = p.sc_status === "Reprovada" || p.sc_status === "Cancelada";
  const diferenca = p.pc_valor !== null ? p.pc_valor - p.sc_valor_estimado : null;

  return (
    <>
      <Link href={localePath(lang, "/demo/compras")} className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {getDictionary(lang).demo.backToPanel}
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-xs text-muted">{t.eyebrow}</p>
          <h1 className="mt-1 font-mono text-2xl font-semibold">{p.sc_numero}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {tv(p.categoria)} · {tv(p.centro_custo)} · {t.requestedBy} {p.solicitante}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={STATUS_TONE[p.sc_status]}>{tv(p.sc_status)}</Badge>
          <Badge tone={p.prioridade === "Urgente" ? "critical" : p.prioridade === "Alta" ? "warning" : "neutral"}>
            {t.priority(tv(p.prioridade))}
          </Badge>
        </div>
      </div>

      {/* Linha do tempo */}
      <ol className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {passos.map((s, i) => {
          const feito = !!s.data;
          return (
            <li key={s.titulo} className="relative bg-surface p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    feito ? "border-series-1 bg-series-1 text-white" : "border-axis text-muted"
                  }`}
                >
                  {feito ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="text-sm font-semibold">{s.titulo}</span>
              </div>
              <p className="mt-2 text-sm">{feito ? fmtDate(s.data) : interrompido && i > 0 ? t.interrupted : t.pending}</p>
              <p className="font-mono text-xs text-muted">{s.detalhe}</p>
              {s.dias !== null && (
                <p className="mt-2 inline-block rounded bg-wash px-1.5 py-0.5 text-[11px] text-ink-2">
                  {t.sincePrevious(s.dias)}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Info label={t.estimated} value={fmtMoney(p.sc_valor_estimado)} />
        <Info
          label={t.orderValue}
          value={p.pc_valor !== null ? fmtMoney(p.pc_valor) : "—"}
          sub={diferenca !== null ? t.diff(diferenca <= 0, fmtMoney(Math.abs(diferenca)), fmtPct(Math.abs(diferenca) / p.sc_valor_estimado)) : undefined}
        />
        <Info label={t.supplier} value={p.fornecedor ?? "—"} sub={p.comprador ? t.buyer(p.comprador) : undefined} />
        <Info
          label={t.cycle}
          value={p.dias_total !== null ? t.days(p.dias_total) : t.inProgress}
          sub={p.pc_prevista ? t.expected(fmtDate(p.pc_prevista)) : undefined}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Panel title={t.requestItems} subtitle={p.sc_numero}>
          <ItensTable lang={lang} itens={det.itensSolicitacao} />
        </Panel>
        <Panel title={t.orderItems} subtitle={p.pc_numero ?? t.noOrderYet}>
          {det.itensPedido.length ? <ItensTable lang={lang} itens={det.itensPedido} /> : <p className="text-sm text-muted">{t.noOrder}</p>}
        </Panel>
      </div>

      <Panel title={t.invoicesPanel} className="mt-3">
        {det.notas.length ? (
          <Table
            head={
              <>
                <th className={th}>{t.cols.number}</th>
                <th className={th}>{t.cols.series}</th>
                <th className={th}>{t.cols.issued}</th>
                <th className={th}>{t.cols.received}</th>
                <th className={`${th} text-right`}>{t.cols.value}</th>
              </>
            }
          >
            {det.notas.map((n) => (
              <tr key={n.nf_numero}>
                <td className={`${td} font-mono`}>{n.nf_numero}</td>
                <td className={td}>{n.serie}</td>
                <td className={td}>{fmtDate(n.data_emissao)}</td>
                <td className={td}>{fmtDate(n.data_recebimento)}</td>
                <td className={`${td} text-right`}>{fmtMoneyCents(n.valor_total)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-sm text-muted">{t.noInvoices}</p>
        )}
      </Panel>
    </>
  );
}

function Info({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface p-4">
      <p className="text-xs text-ink-2">{label}</p>
      <p className="mt-1 truncate font-semibold" title={value}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function ItensTable({
  lang,
  itens,
}: {
  lang: Locale;
  itens: { produto_codigo: string; produto: string; unidade: string; quantidade: number; valor_unitario: number; valor_total: number }[];
}) {
  const t = getDictionary(lang).compras.detail.cols;
  const { fmtInt, fmtMoneyCents } = formatters(lang);
  return (
    <Table
      minWidth={480}
      head={
        <>
          <th className={th}>{t.code}</th>
          <th className={th}>{t.product}</th>
          <th className={`${th} text-right`}>{t.qty}</th>
          <th className={`${th} text-right`}>{t.unit}</th>
          <th className={`${th} text-right`}>{t.total}</th>
        </>
      }
    >
      {itens.map((i) => (
        <tr key={i.produto_codigo}>
          <td className={`${td} font-mono text-xs`}>{i.produto_codigo}</td>
          <td className={td}>{translateProduct(lang, i.produto)}</td>
          <td className={`${td} text-right`}>
            {fmtInt(i.quantidade)} {translateValue(lang, i.unidade)}
          </td>
          <td className={`${td} text-right`}>{fmtMoneyCents(i.valor_unitario)}</td>
          <td className={`${td} text-right`}>{fmtMoneyCents(i.valor_total)}</td>
        </tr>
      ))}
    </Table>
  );
}
