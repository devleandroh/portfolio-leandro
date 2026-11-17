"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import type { RemessaTexts } from "@/i18n/remessa";
import type { Locale } from "@/i18n/config";
import { PRODUTOS_DEMO, tabelaCliente, validar, type LinhaControle } from "@/lib/remessa";

/**
 * Visualizador da pasta de trabalho da demonstração, no formato do Excel: barra de fórmulas,
 * cabeçalhos de linha e coluna e abas embaixo. Reflete a planilha demo do projeto (src/remessa/demo.py).
 */

export type Estilo = "titulo" | "cab" | "nota" | "num" | "num-forte" | "erro" | "ok" | "muted" | "faixa";
export type AcaoPainel = "testar" | "enviar" | "reenviar";

export interface Celula {
  v: string;
  f?: string;
  e?: Estilo;
  span?: number;
  botao?: { acao: AcaoPainel; cor: string };
}

export interface Aba {
  nome: string;
  /** Larguras relativas das colunas (somam ~100). */
  larguras: number[];
  /** Linhas a partir da linha 1; null = linha vazia. */
  linhas: ((Celula | null)[] | null)[];
  selecao: string;
  tipo: "PAINEL" | "CONTROLE" | "ORIGEM" | "cliente" | "LOG";
}

export interface LinhaLogPlanilha {
  dataHora: string;
  modo: string;
  cliente: string;
  canal: string;
  arquivo: string;
  status: "enviado" | "erro";
  erro: string;
}

const LETRAS = "ABCDEFGHIJ";
const n2 = (v: number, lang: Locale) => v.toLocaleString(lang === "en" ? "en-US" : "pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brl = (v: number, lang: Locale) => `R$ ${n2(v, lang)}`;
const ULTIMA = PRODUTOS_DEMO.length + 1;

export function abaCliente(aba: string, cliente: string, lang: Locale, apenasValores = false): Aba {
  const { desconto, linhas } = tabelaCliente(aba);
  const f = (s: string) => (apenasValores ? undefined : s);
  const casa = (col: string) => `INDEX(ORIGEM!$${col}$2:$${col}$${ULTIMA};MATCH($A{r};ORIGEM!$A$2:$A$${ULTIMA};0))`;
  return {
    nome: aba,
    tipo: "cliente",
    larguras: [13, 40, 11, 18, 18],
    selecao: apenasValores ? "B6" : "E6",
    linhas: [
      [{ v: `Tabela de preços – ${cliente}`, e: "titulo", span: 5 }],
      null,
      [{ v: "Desconto do cliente" , e: "muted" }, { v: `${(desconto * 100).toLocaleString(lang === "en" ? "en-US" : "pt-BR", { minimumFractionDigits: 1 })}%`, e: "faixa" }],
      null,
      ["Código", "Produto", "Unid.", "Preço base", "Preço cliente"].map((v) => ({ v, e: "cab" as Estilo })),
      ...linhas.map((l, i) => {
        const r = 6 + i;
        return [
          { v: l.codigo, f: f(`=ORIGEM!A${2 + i}`) },
          { v: l.produto, f: f(`=${casa("B").replaceAll("{r}", String(r))}`) },
          { v: l.unidade, f: f(`=${casa("C").replaceAll("{r}", String(r))}`) },
          { v: brl(l.preco, lang), f: f(`=${casa("D").replaceAll("{r}", String(r))}`), e: "num" as Estilo },
          { v: brl(l.precoCliente, lang), f: f(`=ROUND(D${r}*(1-$B$3);2)`), e: "num-forte" as Estilo },
        ];
      }),
    ],
  };
}

export function montarAbas(
  controle: LinhaControle[],
  log: LinhaLogPlanilha[],
  idsComErro: ReadonlySet<number>,
  lang: Locale,
): Aba[] {
  const painel: Aba = {
    nome: "PAINEL",
    tipo: "PAINEL",
    larguras: [4, 34, 62],
    selecao: "B7",
    linhas: [
      null,
      [null, { v: "Remessa", e: "titulo" }],
      [null, { v: "Cada cliente recebe a sua planilha, no canal certo.", e: "muted", span: 2 }],
      null,
      [null, { v: "1. Atualize a aba ORIGEM.   2. Teste.   3. Envie.   4. Confira a aba LOG.", span: 2 }],
      null,
      [null, { v: "▶  Testar envio", botao: { acao: "testar", cor: "#2E7D32" }, f: "🔗 ..\\scripts\\testar.bat" }, { v: "Gera tudo e envia só para você conferir.", e: "muted" }],
      null,
      [null, { v: "✔  Enviar para os clientes", botao: { acao: "enviar", cor: "#1F3A5F" }, f: "🔗 ..\\scripts\\rodar.bat" }, { v: "Envio real, conforme a aba CONTROLE.", e: "muted" }],
      null,
      [null, { v: "↻  Reenviar falhas", botao: { acao: "reenviar", cor: "#B26A00" }, f: "🔗 ..\\scripts\\reenviar-falhas.bat" }, { v: "Só os clientes que deram erro na última execução.", e: "muted" }],
      null,
      [null, { v: "Os botões abrem a ferramenta Remessa (o Excel pede confirmação no primeiro clique). WhatsApp somente pela API oficial da Meta, com opt-in do cliente.", e: "nota", span: 2 }],
    ],
  };

  const controleAba: Aba = {
    nome: "CONTROLE",
    tipo: "CONTROLE",
    larguras: [6, 16, 10, 7, 9, 22, 11, 19],
    selecao: "B2",
    linhas: [
      ["ativo", "cliente", "aba", "formato", "canal", "destinatario", "optin_whatsapp", "nome_arquivo"].map((v) => ({ v, e: "cab" as Estilo })),
      ...controle.map((l) => {
        const erro = idsComErro.has(l.id) ? validar(l) : null;
        return [
          { v: l.ativo ? "SIM" : "NÃO" },
          { v: l.cliente },
          { v: l.aba },
          { v: l.formato },
          { v: l.canal },
          { v: l.destinatario, e: erro === "email_invalido" || erro === "telefone_invalido" ? ("erro" as Estilo) : undefined },
          l.canal === "whatsapp"
            ? { v: l.optin ? l.optin.split("-").reverse().join("/") : "", e: erro === "sem_optin" ? ("erro" as Estilo) : ("ok" as Estilo) }
            : { v: "" },
          { v: "Precos_{semana}_{cliente}", e: "muted" as Estilo },
        ];
      }),
      [{ v: "NÃO", e: "muted" }, { v: "Cliente Inativo Ltda", e: "muted" }, { v: "BOMPRECO", e: "muted" }, { v: "PDF", e: "muted" }, { v: "email", e: "muted" }, { v: "inativo@exemplo.com", e: "muted" }, { v: "" }, { v: "" }],
    ],
  };

  const origem: Aba = {
    nome: "ORIGEM",
    tipo: "ORIGEM",
    larguras: [15, 45, 14, 26],
    selecao: "D2",
    linhas: [
      ["codigo", "produto", "unidade", "preco_base"].map((v) => ({ v, e: "cab" as Estilo })),
      ...PRODUTOS_DEMO.map((p) => [{ v: p.codigo }, { v: p.produto }, { v: p.unidade }, { v: brl(p.preco, lang), e: "num" as Estilo }]),
      [{ v: "… amostra de 8 produtos (a planilha demo do projeto tem 30)", e: "nota", span: 4 }],
    ],
  };

  const clientes = controle.map((l) => abaCliente(l.aba, l.cliente, lang));

  const logAba: Aba = {
    nome: "LOG",
    tipo: "LOG",
    larguras: [16, 7, 16, 9, 25, 9, 18],
    selecao: "A1",
    linhas: [
      ["data_hora", "modo", "cliente", "canal", "arquivo", "status", "erro"].map((v) => ({ v, e: "cab" as Estilo })),
      ...(log.length
        ? log.map((r) => [
            { v: r.dataHora },
            { v: r.modo },
            { v: r.cliente },
            { v: r.canal },
            { v: r.arquivo },
            { v: r.status, e: (r.status === "erro" ? "erro" : "ok") as Estilo },
            { v: r.erro },
          ])
        : [[{ v: "(vazia: a ferramenta escreve uma linha aqui a cada envio)", e: "nota" as Estilo, span: 7 }]]),
    ],
  };

  return [painel, controleAba, origem, ...clientes, logAba];
}

/** Grade no estilo do Excel. Sem rolagem horizontal a partir de sm; no celular, rola dentro do quadro. */
export function Grade({
  aba, selecao, onSelecionar, onAcao, acoesHabilitadas,
}: {
  aba: Aba;
  selecao?: string;
  onSelecionar?: (ref: string) => void;
  onAcao?: (a: AcaoPainel) => void;
  acoesHabilitadas?: Record<AcaoPainel, boolean>;
}) {
  const ncols = aba.larguras.length;
  return (
    <table className="w-full min-w-[560px] table-fixed border-collapse bg-white text-[11px] leading-snug text-[#1b1f24] sm:min-w-0">
      <colgroup>
        <col style={{ width: 30 }} />
        {aba.larguras.map((w, i) => (
          <col key={i} style={{ width: `${w}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr className="bg-[#f3f3f3] text-[10px] text-[#555]">
          <th className="border border-[#dcdcdc]" />
          {aba.larguras.map((_, i) => (
            <th key={i} className={`border border-[#dcdcdc] py-0.5 font-normal ${selecao?.[0] === LETRAS[i] ? "bg-[#d6e4f5] text-[#1f3a5f]" : ""}`}>
              {LETRAS[i]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {aba.linhas.map((linha, r) => {
          const numero = r + 1;
          const celulas: React.ReactNode[] = [];
          let col = 0;
          (linha ?? []).forEach((c, i) => {
            const ref = `${LETRAS[col]}${numero}`;
            const span = c?.span ?? 1;
            celulas.push(
              <CelulaView
                key={i}
                c={c}
                span={span}
                selecionada={selecao === ref}
                onClick={() => onSelecionar?.(ref)}
                onAcao={onAcao}
                habilitada={c?.botao ? (acoesHabilitadas?.[c.botao.acao] ?? false) : false}
              />,
            );
            col += span;
          });
          while (col < ncols) {
            const ref = `${LETRAS[col]}${numero}`;
            celulas.push(<CelulaView key={`v${col}`} c={null} span={1} selecionada={selecao === ref} onClick={() => onSelecionar?.(ref)} />);
            col += 1;
          }
          return (
            <tr key={r} className={linha?.some((c) => c?.botao) ? "h-9" : ""}>
              <td className={`border border-[#dcdcdc] bg-[#f3f3f3] text-center text-[10px] text-[#555] ${selecao?.slice(1) === String(numero) ? "bg-[#d6e4f5] text-[#1f3a5f]" : ""}`}>
                {numero}
              </td>
              {celulas}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const ESTILOS: Record<Estilo, string> = {
  titulo: "text-[13px] font-bold text-[#1f3a5f]",
  cab: "bg-[#1f3a5f] font-semibold text-white",
  nota: "italic text-[#8a93a0]",
  num: "text-right tabular-nums",
  "num-forte": "text-right font-semibold tabular-nums",
  erro: "bg-[#fde8e8] font-semibold text-[#b42318]",
  ok: "text-[#006300]",
  muted: "text-[#5a6472]",
  faixa: "bg-[#eef1f5] font-semibold",
};

function CelulaView({
  c, span, selecionada, onClick, onAcao, habilitada,
}: {
  c: Celula | null;
  span: number;
  selecionada: boolean;
  onClick: () => void;
  onAcao?: (a: AcaoPainel) => void;
  habilitada?: boolean;
}) {
  const sel = selecionada ? "outline outline-2 -outline-offset-2 outline-[#217346]" : "";
  if (c?.botao) {
    const { acao, cor } = c.botao;
    return (
      <td colSpan={span} className={`border border-[#dcdcdc] p-0.5 ${sel}`} onClick={onClick}>
        <button
          type="button"
          disabled={!habilitada}
          onClick={() => onAcao?.(acao)}
          style={{ backgroundColor: cor }}
          className="w-full rounded-sm px-2 py-1.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {c.v}
        </button>
      </td>
    );
  }
  return (
    <td
      colSpan={span}
      onClick={onClick}
      className={`cursor-cell border border-[#dcdcdc] px-1 py-0.5 align-top [overflow-wrap:anywhere] ${c?.e ? ESTILOS[c.e] : ""} ${sel}`}
    >
      {c?.v ?? ""}
    </td>
  );
}

function acharCelula(aba: Aba, ref: string): Celula | null {
  const col = LETRAS.indexOf(ref[0]);
  const linha = aba.linhas[Number(ref.slice(1)) - 1];
  if (!linha) return null;
  let c = 0;
  for (const cel of linha) {
    const span = cel?.span ?? 1;
    if (col >= c && col < c + span) return col === c ? cel : null;
    c += span;
  }
  return null;
}

export function Planilhao({
  t, abas, abaAtiva, onTrocarAba, onAcao, acoesHabilitadas, abasComNovidade,
}: {
  t: RemessaTexts;
  abas: Aba[];
  abaAtiva: string;
  onTrocarAba: (nome: string) => void;
  onAcao: (a: AcaoPainel) => void;
  acoesHabilitadas: Record<AcaoPainel, boolean>;
  abasComNovidade: ReadonlySet<string>;
}) {
  const aba = abas.find((a) => a.nome === abaAtiva) ?? abas[0];
  const [selecoes, setSelecoes] = useState<Record<string, string>>({});
  const ref = selecoes[aba.nome] ?? aba.selecao;
  const cel = acharCelula(aba, ref);
  const desc = aba.tipo === "cliente" ? t.planilha.abaDesc.cliente : t.planilha.abaDesc[aba.tipo];

  return (
    <section id="planilha" className="scroll-mt-28 rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileSpreadsheet className="h-4 w-4 text-good" /> {t.planilha.title}
        </h2>
        <p className="mt-1 text-xs text-ink-2">{t.planilha.hint}</p>
      </div>

      <div className="m-3 overflow-hidden rounded-md border border-[#c8ccd4]">
        {/* Barra de título e de fórmulas */}
        <div className="flex items-center gap-2 bg-[#217346] px-3 py-1.5 text-xs font-semibold text-white">
          <FileSpreadsheet className="h-3.5 w-3.5" /> {t.planilha.arquivo}
        </div>
        <div className="flex items-stretch border-b border-[#c8ccd4] bg-white font-mono text-[11px] text-[#1b1f24]">
          <span className="w-14 shrink-0 border-r border-[#dcdcdc] px-2 py-1 text-center">{ref}</span>
          <span className="shrink-0 border-r border-[#dcdcdc] px-2 py-1 italic text-[#555]">fx</span>
          <span className="min-w-0 flex-1 px-2 py-1 [overflow-wrap:anywhere]">{cel?.f ?? cel?.v ?? ""}</span>
        </div>

        <p className="bg-[#fafafa] px-3 py-1 text-[11px] text-[#5a6472]">
          <strong className="text-[#1b1f24]">{aba.nome}</strong> · {desc}
        </p>
        <div className="overflow-x-auto sm:overflow-visible">
          <Grade
            aba={aba}
            selecao={ref}
            onSelecionar={(r) => setSelecoes((s) => ({ ...s, [aba.nome]: r }))}
            onAcao={onAcao}
            acoesHabilitadas={acoesHabilitadas}
          />
        </div>
        <p className="bg-[#fafafa] px-3 py-1 text-[10px] text-[#8a93a0] sm:hidden">{t.planilha.mobileHint}</p>

        {/* Abas */}
        <div role="tablist" aria-label={t.planilha.arquivo} className="flex flex-wrap gap-0.5 border-t border-[#c8ccd4] bg-[#f3f3f3] px-1 pt-1">
          {abas.map((a) => {
            const ativa = a.nome === aba.nome;
            return (
              <button
                key={a.nome}
                type="button"
                role="tab"
                aria-selected={ativa}
                onClick={() => onTrocarAba(a.nome)}
                className={`relative rounded-t-sm px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  ativa ? "bg-white font-semibold text-[#217346] shadow-[inset_0_-2px_0_#217346]" : "text-[#444] hover:bg-white/70"
                }`}
              >
                {a.nome}
                {abasComNovidade.has(a.nome) && !ativa && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#d03b3b]" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
