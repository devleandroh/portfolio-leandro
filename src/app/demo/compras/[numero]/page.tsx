import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Badge, Panel, Table, td, th } from "@/components/ui/dashboard";
import { STATUS_TONE } from "@/lib/analytics/compras";
import { getCompraDetalhe, getComprasDataset } from "@/lib/data/repository";
import { fmtDate, fmtInt, fmtMoney, fmtMoneyCents, fmtPct } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/demo/compras/[numero]">): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).numero)} — Compras 360` };
}

export default async function CompraDetalhePage({ params }: PageProps<"/demo/compras/[numero]">) {
  const numero = decodeURIComponent((await params).numero);
  const { data } = await getComprasDataset();
  const p = data.processos.find((r) => r.sc_numero === numero);
  if (!p) notFound();
  const det = await getCompraDetalhe(p.sc_numero, p.pc_numero);

  const passos = [
    { titulo: "Solicitação", data: p.sc_data, detalhe: p.sc_numero, dias: null as number | null },
    { titulo: "Aprovação", data: p.data_aprovacao, detalhe: p.data_aprovacao ? "Aprovada" : p.sc_status, dias: p.dias_aprovacao },
    { titulo: "Pedido de compra", data: p.pc_data, detalhe: p.pc_numero ?? "—", dias: p.dias_ate_pedido },
    { titulo: "Nota fiscal", data: p.nf_primeira_data, detalhe: p.nf_qtd ? `${p.nf_qtd} nota(s)` : "—", dias: p.dias_ate_nota },
  ];
  const interrompido = p.sc_status === "Reprovada" || p.sc_status === "Cancelada";
  const diferenca = p.pc_valor !== null ? p.pc_valor - p.sc_valor_estimado : null;

  return (
    <>
      <Link href="/demo/compras" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-xs text-muted">processo de compra</p>
          <h1 className="mt-1 font-mono text-2xl font-semibold">{p.sc_numero}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {p.categoria} · {p.centro_custo} · solicitado por {p.solicitante}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={STATUS_TONE[p.sc_status]}>{p.sc_status}</Badge>
          <Badge tone={p.prioridade === "Urgente" ? "critical" : p.prioridade === "Alta" ? "warning" : "neutral"}>
            Prioridade {p.prioridade.toLowerCase()}
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
              <p className="mt-2 text-sm">{feito ? fmtDate(s.data) : interrompido && i > 0 ? "Interrompido" : "Pendente"}</p>
              <p className="font-mono text-xs text-muted">{s.detalhe}</p>
              {s.dias !== null && (
                <p className="mt-2 inline-block rounded bg-wash px-1.5 py-0.5 text-[11px] text-ink-2">
                  +{s.dias} d desde a etapa anterior
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Info label="Valor estimado" value={fmtMoney(p.sc_valor_estimado)} />
        <Info
          label="Valor do pedido"
          value={p.pc_valor !== null ? fmtMoney(p.pc_valor) : "—"}
          sub={diferenca !== null ? `${diferenca <= 0 ? "economia" : "acima"} de ${fmtMoney(Math.abs(diferenca))} (${fmtPct(Math.abs(diferenca) / p.sc_valor_estimado)})` : undefined}
        />
        <Info label="Fornecedor" value={p.fornecedor ?? "—"} sub={p.comprador ? `Comprador: ${p.comprador}` : undefined} />
        <Info
          label="Ciclo total"
          value={p.dias_total !== null ? `${p.dias_total} dias` : "Em andamento"}
          sub={p.pc_prevista ? `Entrega prevista: ${fmtDate(p.pc_prevista)}` : undefined}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Panel title="Itens solicitados" subtitle={p.sc_numero}>
          <ItensTable itens={det.itensSolicitacao} />
        </Panel>
        <Panel title="Itens do pedido" subtitle={p.pc_numero ?? "Pedido ainda não emitido"}>
          {det.itensPedido.length ? <ItensTable itens={det.itensPedido} /> : <p className="text-sm text-muted">Sem pedido vinculado.</p>}
        </Panel>
      </div>

      <Panel title="Notas fiscais recebidas" className="mt-3">
        {det.notas.length ? (
          <Table
            head={
              <>
                <th className={th}>Número</th>
                <th className={th}>Série</th>
                <th className={th}>Emissão</th>
                <th className={th}>Recebimento</th>
                <th className={`${th} text-right`}>Valor</th>
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
          <p className="text-sm text-muted">Nenhuma nota fiscal recebida até o momento.</p>
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

function ItensTable({ itens }: { itens: { produto_codigo: string; produto: string; unidade: string; quantidade: number; valor_unitario: number; valor_total: number }[] }) {
  return (
    <Table
      minWidth={480}
      head={
        <>
          <th className={th}>Código</th>
          <th className={th}>Produto</th>
          <th className={`${th} text-right`}>Qtd.</th>
          <th className={`${th} text-right`}>Unitário</th>
          <th className={`${th} text-right`}>Total</th>
        </>
      }
    >
      {itens.map((i) => (
        <tr key={i.produto_codigo}>
          <td className={`${td} font-mono text-xs`}>{i.produto_codigo}</td>
          <td className={td}>{i.produto}</td>
          <td className={`${td} text-right`}>
            {fmtInt(i.quantidade)} {i.unidade}
          </td>
          <td className={`${td} text-right`}>{fmtMoneyCents(i.valor_unitario)}</td>
          <td className={`${td} text-right`}>{fmtMoneyCents(i.valor_total)}</td>
        </tr>
      ))}
    </Table>
  );
}
