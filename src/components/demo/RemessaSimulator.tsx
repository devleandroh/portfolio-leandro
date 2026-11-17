"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight, Check, CheckCircle2, ChevronDown, FileSpreadsheet, FileText, FolderOpen, HelpCircle, Mail, MessageCircle, MousePointerClick,
  Play, RotateCcw, Send, ShieldCheck, Table2, Trash2, Wrench, X, XCircle,
} from "lucide-react";
import { remessaTexts, type RemessaTexts } from "@/i18n/remessa";
import { Grade, Planilhao, abaCliente, montarAbas, type AcaoPainel } from "./Planilhao";
import type { Locale } from "@/i18n/config";
import {
  CONTROLE_INICIAL, DATA_OPTIN_DEMO, EMAIL_CORRIGIDO, mascarar, pastaEnvio, planejarLote, resumir, tabelaCliente, validar, type Canal,
  type Formato, type ItemLote, type LinhaControle, type Motivo,
} from "@/lib/remessa";

interface Arquivo {
  nome: string;
  pasta: string;
  formato: Formato;
  aba: string;
  cliente: string;
  canal: Canal;
  enviado: boolean;
  novo: boolean;
}

type Etapa = "gerando" | "enviando" | "enviado" | "erro";

interface LinhaLog {
  key: string;
  hora: string;
  execucao: string;
  teste: boolean;
  id: number;
  cliente: string;
  canal: Canal;
  arquivo: string;
  etapa: Etapa;
  motivo: Motivo | null;
}

interface Falha {
  id: number;
  cliente: string;
  motivo: Motivo;
}

const PASSO_MS = 450;
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function RemessaSimulator({ lang }: { lang: Locale }) {
  const t = remessaTexts[lang];
  const [controle, setControle] = useState<LinhaControle[]>(CONTROLE_INICIAL);
  const [teste, setTeste] = useState(true);
  const [log, setLog] = useState<LinhaLog[]>([]);
  const [rodando, setRodando] = useState(false);
  const [resumo, setResumo] = useState<{ enviados: number; erros: number; pasta: string } | null>(null);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [previa, setPrevia] = useState<Arquivo | null>(null);
  const fecharPrevia = useCallback(() => setPrevia(null), []);
  const [abaAtiva, setAbaAtiva] = useState("PAINEL");
  const [novidades, setNovidades] = useState<Set<string>>(new Set());
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [destaque, setDestaque] = useState<number | null>(null);
  const execRef = useRef(0);
  const vivo = useRef(true);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const linhaPorId = new Map(controle.map((l) => [l.id, l]));
  const corrigida = (f: Falha) => {
    const l = linhaPorId.get(f.id);
    return l ? validar(l) === null : false;
  };
  const pendentes = falhas.filter((f) => !corrigida(f));
  const idsComErro = new Set(pendentes.map((f) => f.id));
  // Passo atual do guia: 0 = rodar, 1 = corrigir, 2 = reenviar, 3 = concluído
  const passo = rodando ? (falhas.length ? 2 : 0) : !resumo ? 0 : falhas.length === 0 ? 3 : pendentes.length ? 1 : 2;
  // Etapas do diagrama "Como funciona" em destaque durante o lote: gerando → gera + salva; enviando → envia.
  const etapaAtual = rodando ? log[0]?.etapa : undefined;
  const fases = etapaAtual === "gerando" ? [2, 3] : etapaAtual === "enviando" ? [4] : [];

  async function executar(apenas?: ReadonlySet<number>, modoTeste: boolean = teste) {
    const lote = planejarLote(controle, { teste: modoTeste, apenas });
    if (lote.length === 0) return;
    setRodando(true);
    execRef.current += 1;
    const execucao = `exec-${String(execRef.current).padStart(4, "0")}`;
    const atualizar = (key: string, etapa: Etapa) => setLog((l) => l.map((r) => (r.key === key ? { ...r, etapa } : r)));
    const pasta = pastaEnvio(modoTeste);
    const gravarArquivo = (item: ItemLote, enviado: boolean) =>
      setArquivos((lista) => {
        const arq: Arquivo = {
          nome: item.arquivo, pasta, formato: item.linha.formato, aba: item.linha.aba, cliente: item.linha.cliente, canal: item.linha.canal,
          enviado, novo: !enviado,
        };
        const resto = lista.filter((a) => !(a.nome === arq.nome && a.pasta === arq.pasta)).map((a) => ({ ...a, novo: false }));
        return [arq, ...resto];
      });

    for (const item of lote) {
      if (!vivo.current) return;
      const key = `${execucao}-${item.linha.id}`;
      setLog((l) => [novaLinha(key, execucao, item, modoTeste), ...l]);
      await espera(PASSO_MS * 1.4);
      if (item.motivo) {
        atualizar(key, "erro"); // validação falhou: nenhum arquivo é gerado
        continue;
      }
      gravarArquivo(item, false);
      atualizar(key, "enviando");
      await espera(PASSO_MS * 1.4);
      gravarArquivo(item, true);
      atualizar(key, "enviado");
    }
    setNovidades((n) => new Set(n).add("LOG"));
    if (!vivo.current) return;
    const novasFalhas = lote.filter((i) => i.motivo).map((i) => ({ id: i.linha.id, cliente: i.linha.cliente, motivo: i.motivo as Motivo }));
    setResumo({ ...resumir(lote), pasta });
    setFalhas(novasFalhas);
    setRodando(false);
    if (novasFalhas.length) {
      requestAnimationFrame(() => painelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
  }

  function corrigir(f: Falha) {
    setControle((c) =>
      c.map((l) => {
        if (l.id !== f.id) return l;
        if (f.motivo === "sem_optin") return { ...l, optin: DATA_OPTIN_DEMO };
        if (f.motivo === "email_invalido") return { ...l, destinatario: EMAIL_CORRIGIDO };
        return l;
      }),
    );
    setDestaque(f.id);
    setTimeout(() => setDestaque((d) => (d === f.id ? null : d)), 1600);
  }

  function reiniciar() {
    setControle(CONTROLE_INICIAL);
    setLog([]);
    setResumo(null);
    setFalhas([]);
    setArquivos([]);
    setNovidades(new Set());
    execRef.current = 0;
  }

  const abas = montarAbas(
    controle,
    [...log].reverse().filter((r) => r.etapa === "enviado" || r.etapa === "erro").map((r) => ({
      dataHora: r.hora, modo: r.teste ? "teste" : "real", cliente: r.cliente, canal: r.canal, arquivo: r.etapa === "erro" ? "" : r.arquivo,
      status: r.etapa === "erro" ? "erro" : "enviado", erro: r.motivo && r.etapa === "erro" ? remessaTexts.pt.motivos[r.motivo] : "",
    })),
    idsComErro,
    lang,
  );

  function trocarAba(nome: string) {
    setAbaAtiva(nome);
    setNovidades((n) => {
      const novo = new Set(n);
      novo.delete(nome);
      return novo;
    });
  }

  function acaoPainel(a: AcaoPainel) {
    if (a === "testar" || a === "enviar") {
      setTeste(a === "testar");
      void executar(undefined, a === "testar");
    } else if (falhas.length && !pendentes.length) {
      void executar(new Set(falhas.map((f) => f.id)));
    }
  }

  const verAba = useCallback((aba: string) => {
    setPrevia(null);
    setAbaAtiva(aba);
    requestAnimationFrame(() => document.getElementById("planilha")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  return (
    <div className="space-y-4">
    <ComoFunciona t={t} fases={fases} />
    <Planilhao
      t={t}
      abas={abas}
      abaAtiva={abaAtiva}
      onTrocarAba={trocarAba}
      onAcao={acaoPainel}
      acoesHabilitadas={{ testar: !rodando, enviar: !rodando, reenviar: !rodando && falhas.length > 0 && pendentes.length === 0 }}
      abasComNovidade={novidades}
    />
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Guia passos={t.passos} atual={passo} rotuloAtual={t.passoAtual} />

        {/* CONTROLE */}
        <section className="rounded-lg border border-line bg-surface">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileSpreadsheet className="h-4 w-4 text-good" /> {t.controle}
            </h2>
            <p className="text-xs text-muted">{t.controleHint}</p>
          </div>
          <div className={`hidden ${GRADE_CONTROLE} border-b border-line bg-page px-4 py-2 font-mono text-[11px] text-muted sm:grid`}>
            <span>{t.colsCurtas.cliente}</span>
            <span>{t.colsCurtas.arquivo}</span>
            <span>{t.colsCurtas.destinatario}</span>
            <span>{t.colsCurtas.optin}</span>
          </div>
          <ul className="divide-y divide-line">
            {controle.map((l) => {
              const comErro = idsComErro.has(l.id) && !rodando;
              const piscando = destaque === l.id;
              return (
                <li
                  key={l.id}
                  className={`grid gap-x-3 gap-y-1 px-4 py-2.5 text-sm transition-colors duration-500 sm:items-center ${GRADE_CONTROLE} ${
                    piscando ? "bg-good/15" : comErro ? "bg-critical/5 shadow-[inset_3px_0_0_var(--color-critical)]" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{l.cliente}</p>
                    <p className="font-mono text-[11px] text-muted">
                      {t.cols.aba}: {l.aba}
                      {comErro && <span className="ml-2 font-sans text-critical">● {t.linhaComErro}</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded border border-line bg-page px-1.5 py-0.5 font-mono text-[11px]">{l.formato}</span>
                    <CanalTag canal={l.canal} nome={t.canalNome[l.canal]} />
                  </div>
                  <Campo rotulo={t.colsCurtas.destinatario}>
                    <span className={`font-mono text-xs break-all ${comErro && validar(l) === "email_invalido" ? "text-critical" : ""}`}>
                      {mascarar(l.destinatario, l.canal)}
                    </span>
                  </Campo>
                  <Campo rotulo={t.colsCurtas.optin}>
                    {l.canal !== "whatsapp" ? (
                      <span className="font-mono text-xs text-muted">{t.naoSeAplica}</span>
                    ) : l.optin ? (
                      <span className="font-mono text-xs text-good-text">{l.optin}</span>
                    ) : (
                      <span className="font-mono text-xs text-critical">{t.vazio}</span>
                    )}
                  </Campo>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Ações */}
        <section className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm" title={t.modoTesteHint}>
            <input type="checkbox" checked={teste} disabled={rodando} onChange={(e) => setTeste(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
            <span className="font-medium">{t.modoTeste}</span>
          </label>
          <button
            type="button"
            onClick={() => executar()}
            disabled={rodando}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
              passo === 0 ? "btn-grad" : "border border-axis bg-surface hover:border-ink"
            }`}
          >
            <Play className="h-4 w-4" /> {rodando ? t.rodando : t.rodar}
          </button>
          {log.length > 0 && (
            <button type="button" onClick={reiniciar} disabled={rodando} className="ml-auto inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink disabled:opacity-60">
              <Trash2 className="h-3.5 w-3.5" /> {t.limpar}
            </button>
          )}
          <p className="w-full text-xs text-muted">{t.modoTesteHint}</p>
        </section>

        {resumo && (
          <div ref={painelRef} className="space-y-3">
            <p
              role="status"
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                resumo.erros ? "border-warning/60 bg-warning/10" : "border-good/50 bg-good/10"
              }`}
            >
              {resumo.erros ? <XCircle className="h-4 w-4 shrink-0 text-critical" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-good" />}
              <span>
                <strong className="font-semibold">{t.resumo(resumo.enviados, resumo.erros)}</strong>
                <span className="text-ink-2"> · {t.salvoEm(resumo.pasta)}</span>
              </span>
            </p>

            {falhas.length > 0 && (
              <PainelFalhas
                t={t}
                falhas={falhas}
                corrigida={corrigida}
                pendentes={pendentes.length}
                rodando={rodando}
                onCorrigir={corrigir}
                onReenviar={() => executar(new Set(falhas.map((f) => f.id)))}
              />
            )}
            {passo === 3 && falhas.length === 0 && resumo.erros === 0 && (
              <p className="flex items-center gap-2 text-sm font-medium text-good-text">
                <CheckCircle2 className="h-4 w-4" /> {t.concluido}
              </p>
            )}
          </div>
        )}

        <PastaEnvios t={t} arquivos={arquivos} teveErro={log.some((r) => r.etapa === "erro")} onAbrir={setPrevia} />

        {/* LOG */}
        <section className="rounded-lg border border-line bg-surface">
          <h2 className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm font-semibold">
            <FileText className="h-4 w-4 text-ink-2" /> {t.log}
          </h2>
          {log.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">{t.logVazio}</p>
          ) : (
            <>
              <div className={`hidden ${GRADE_LOG} border-b border-line bg-page px-4 py-2 font-mono text-[11px] text-muted sm:grid`}>
                <span>{t.logColsCurtas.quando}</span>
                <span>{t.logColsCurtas.cliente}</span>
                <span>{t.logColsCurtas.arquivo}</span>
                <span>{t.logColsCurtas.status}</span>
              </div>
              <ul className="divide-y divide-line text-xs" aria-live="polite">
                {log.map((r) => (
                  <li key={r.key} className={`grid gap-x-3 gap-y-1 px-4 py-2 sm:items-start ${GRADE_LOG}`}>
                    <div className="font-mono">
                      <p>{r.hora}</p>
                      <p className="text-muted">
                        {r.execucao} · {r.teste ? t.modo.teste : t.modo.real}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{r.cliente}</span>
                      <CanalTag canal={r.canal} nome={t.canalNome[r.canal]} />
                    </div>
                    <p className="min-w-0 truncate font-mono text-ink-2" title={r.arquivo}>{r.arquivo}</p>
                    <div className="min-w-0">
                      <Status etapa={r.etapa} texto={t.status[r.etapa]} />
                      {r.motivo && r.etapa === "erro" && <p className="mt-0.5 text-ink-2">{t.motivos[r.motivo]}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-lg border border-line bg-surface p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-good" /> {t.conformidade.title}
          </h2>
          <ul className="mt-3 space-y-3">
            {t.conformidade.itens.map((i) => (
              <li key={i.t} className="text-xs leading-relaxed">
                <p className="font-semibold text-ink">{i.t}</p>
                <p className="mt-0.5 text-ink-2">{i.d}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-line bg-surface p-4">
          <h2 className="text-sm font-semibold">{t.como.title}</h2>
          <ul className="mt-3 space-y-2">
            {t.como.itens.map((i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink-2">
                <span aria-hidden className="mt-1.5 h-1 w-3 shrink-0 bg-accent" />
                {i}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
    <Faq t={t} />
    {previa && <Previa t={t} lang={lang} arquivo={previa} onFechar={fecharPrevia} onVerAba={verAba} />}
    </div>
  );
}

const ICONES_ETAPA = [Table2, MousePointerClick, FileText, FolderOpen, Send];

function ComoFunciona({ t, fases }: { t: RemessaTexts; fases: number[] }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold">{t.comoFunciona.title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-ink-2">{t.comoFunciona.lead}</p>
      <ol className="mt-4 grid gap-2 md:grid-cols-5 md:gap-0">
        {t.comoFunciona.etapas.map((e, i) => {
          const Icon = ICONES_ETAPA[i];
          const ativa = fases.includes(i);
          return (
            <li key={e.t} className="flex items-stretch md:flex-col">
              <div className="flex flex-1 items-stretch">
                <div
                  className={`flex-1 rounded-md border p-3 transition-colors duration-300 ${
                    ativa ? "border-accent bg-accent-soft/50" : "border-line bg-page"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${ativa ? "bg-accent-strong text-surface" : "bg-surface text-ink-2"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-semibold leading-tight">
                      <span className="font-mono text-[11px] text-muted">{i + 1}.</span> {e.t}
                    </p>
                    {ativa && <span className="ml-auto animate-pulse text-[11px] font-medium text-accent-strong">{t.comoFunciona.agora}</span>}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{e.d}</p>
                </div>
                {i < 4 && (
                  <ArrowRight aria-hidden className="mx-1 hidden h-4 w-4 shrink-0 self-center text-muted md:block" />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PastaEnvios({
  t, arquivos, teveErro, onAbrir,
}: {
  t: RemessaTexts;
  arquivos: Arquivo[];
  teveErro: boolean;
  onAbrir: (a: Arquivo) => void;
}) {
  const pastas = [...new Set(arquivos.map((a) => a.pasta))].sort();
  return (
    <section className="rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FolderOpen className="h-4 w-4 text-warning" /> {t.pasta.title}
        </h2>
        <p className="mt-1 text-xs text-muted">{t.pasta.hint}</p>
      </div>
      {arquivos.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted">{t.pasta.vazia}</p>
      ) : (
        <div className="space-y-3 px-4 py-3">
          {pastas.map((pasta) => (
            <div key={pasta}>
              <p className="flex items-center gap-1.5 font-mono text-xs text-ink-2">
                <FolderOpen className="h-3.5 w-3.5 text-warning" /> {pasta}
              </p>
              <ul className="mt-1.5 space-y-1 border-l border-line pl-3">
                {arquivos
                  .filter((a) => a.pasta === pasta)
                  .map((a) => {
                    const Icon = a.formato === "PDF" ? FileText : FileSpreadsheet;
                    return (
                      <li key={a.nome}>
                        <button
                          type="button"
                          onClick={() => onAbrir(a)}
                          className={`group flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-page ${
                            a.novo ? "bg-accent-soft/40" : ""
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${a.formato === "PDF" ? "text-critical" : "text-good"}`} />
                          <span className="min-w-0 break-all font-mono">{a.nome}</span>
                          <span className={`text-[11px] ${a.enviado ? "text-good-text" : "text-accent-strong"}`}>
                            {a.enviado ? `✔ ${t.pasta.enviadoPor(t.canalNome[a.canal])}` : `● ${t.pasta.gerado}`}
                          </span>
                          <span className="ml-auto text-[11px] text-accent-strong underline-offset-2 group-hover:underline">{t.pasta.ver}</span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
          {teveErro && <p className="text-xs text-muted">{t.pasta.semArquivo}</p>}
        </div>
      )}
    </section>
  );
}

const brl = (v: number, lang: string) => v.toLocaleString(lang === "en" ? "en-US" : "pt-BR", { style: "currency", currency: "BRL" });

function Previa({
  t, lang, arquivo, onFechar, onVerAba,
}: { t: RemessaTexts; lang: Locale; arquivo: Arquivo; onFechar: () => void; onVerAba: (aba: string) => void }) {
  const { desconto, linhas } = tabelaCliente(arquivo.aba);
  const pct = `${(desconto * 100).toLocaleString(lang === "en" ? "en-US" : "pt-BR")}%`;
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fecharRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFechar]);

  const pdf = arquivo.formato === "PDF";
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-night/75 p-3 sm:p-6" onClick={onFechar} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={arquivo.nome}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="flex items-start gap-3 border-b border-line px-4 py-3">
          {pdf ? <FileText className="mt-0.5 h-5 w-5 shrink-0 text-critical" /> : <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-good" />}
          <div className="min-w-0 flex-1">
            <p className="break-all font-mono text-sm font-semibold">{arquivo.pasta}{arquivo.nome}</p>
            <p className="text-xs text-ink-2">{t.previa.origem(arquivo.aba)}</p>
          </div>
          <button ref={fecharRef} type="button" onClick={onFechar} aria-label={t.previa.fechar} className="rounded p-1 text-ink-2 hover:bg-page hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-page p-3 sm:p-4">
          {pdf ? (
            <div className="mx-auto max-w-xl bg-white p-6 text-[#1b1f24] shadow-sm">
              <p className="text-center text-base font-bold">{t.previa.titulo(arquivo.cliente)}</p>
              <table className="mt-4 w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#1f3a5f] text-white">
                    {t.previa.cols.map((c, i) => (
                      <th key={c} className={`border border-[#c8ccd4] px-1.5 py-1 font-semibold ${i >= 3 ? "text-right" : "text-left"}`}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={l.codigo} className={i % 2 ? "bg-[#f4f6f9]" : ""}>
                      <td className="border border-[#c8ccd4] px-1.5 py-1">{l.codigo}</td>
                      <td className="border border-[#c8ccd4] px-1.5 py-1">{l.produto}</td>
                      <td className="border border-[#c8ccd4] px-1.5 py-1">{l.unidade}</td>
                      <td className="border border-[#c8ccd4] px-1.5 py-1 text-right">{brl(l.preco, lang)}</td>
                      <td className="border border-[#c8ccd4] px-1.5 py-1 text-right font-semibold">{brl(l.precoCliente, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-hidden rounded border border-[#c8ccd4]">
              <div className="flex items-center gap-2 border-b border-[#c8ccd4] bg-[#217346] px-2 py-1 text-[11px] font-semibold text-white">
                <FileSpreadsheet className="h-3.5 w-3.5" /> {arquivo.nome}
              </div>
              <div className="overflow-x-auto sm:overflow-visible">
                <Grade aba={abaCliente(arquivo.aba, arquivo.cliente, lang, true)} />
              </div>
              <div className="border-t border-[#c8ccd4] bg-[#f3f3f3] px-1 pt-1">
                <span className="inline-block rounded-t-sm bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-[#217346] shadow-[inset_0_-2px_0_#217346]">{arquivo.aba}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1 border-t border-line px-4 py-3 text-xs text-ink-2">
          <p className="font-medium text-ink">{t.previa.desconto(pct)}</p>
          <p>{pdf ? t.previa.pdfNota : t.previa.xlsxNota}</p>
          <p className="text-muted">{t.previa.amostra}</p>
          <button type="button" onClick={() => onVerAba(arquivo.aba)} className="pt-1 font-medium text-accent-strong hover:underline">
            {t.planilha.verNaPlanilha} →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Faq({ t }: { t: RemessaTexts }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <HelpCircle className="h-4 w-4 text-accent-strong" /> {t.faq.title}
      </h2>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {t.faq.itens.map((i) => (
          <details key={i.q} open className="group rounded-md border border-line bg-page px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
              {i.q}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const GRADE_CONTROLE = "sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.9fr)]";
const GRADE_LOG = "sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.5fr)]";

function Guia({ passos, atual, rotuloAtual }: { passos: string[]; atual: number; rotuloAtual: string }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {passos.map((p, i) => {
        const feito = i < atual;
        const agora = i === atual;
        return (
          <li
            key={p}
            aria-current={agora ? "step" : undefined}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
              agora ? "border-accent bg-accent-soft/40 font-semibold text-ink" : feito ? "border-good/40 text-good-text" : "border-line text-muted"
            }`}
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                agora ? "bg-accent-strong text-surface" : feito ? "bg-good/20" : "bg-page"
              }`}
            >
              {feito ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="min-w-0">
              {p}
              {agora && <span className="block text-[11px] font-normal text-accent-strong">{rotuloAtual}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function PainelFalhas({
  t, falhas, corrigida, pendentes, rodando, onCorrigir, onReenviar,
}: {
  t: RemessaTexts;
  falhas: Falha[];
  corrigida: (f: Falha) => boolean;
  pendentes: number;
  rodando: boolean;
  onCorrigir: (f: Falha) => void;
  onReenviar: () => void;
}) {
  const pronto = pendentes === 0;
  return (
    <section className="rounded-lg border-2 border-accent bg-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Wrench className="h-4 w-4 text-accent-strong" /> {t.corrigirTitulo}
      </h2>
      <p className="mt-1 text-xs text-ink-2">{t.corrigirHint}</p>
      <ul className="mt-3 space-y-2">
        {falhas.map((f) => {
          const ok = corrigida(f);
          return (
            <li key={f.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2 ${ok ? "border-good/40 bg-good/5" : "border-critical/30 bg-critical/5"}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{f.cliente}</p>
                <p className={`text-xs ${ok ? "text-good-text" : "text-critical"}`}>{ok ? `✔ ${t.corrigido}` : t.motivos[f.motivo]}</p>
              </div>
              {!ok && (
                <button
                  type="button"
                  onClick={() => onCorrigir(f)}
                  disabled={rodando}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent-strong px-3 py-1.5 text-xs font-semibold text-surface hover:bg-ink disabled:opacity-60"
                >
                  <Wrench className="h-3.5 w-3.5" /> {t.acao[f.motivo]}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={onReenviar}
          disabled={!pronto || rodando}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            pronto ? "btn-grad" : "cursor-not-allowed border border-line bg-page text-muted"
          } ${pronto && !rodando ? "ring-4 ring-accent/30" : ""}`}
        >
          <RotateCcw className="h-4 w-4" /> {rodando ? t.rodando : t.reenviar(falhas.length)}
          {pronto && !rodando && <ArrowRight className="h-4 w-4" />}
        </button>
        <p className={`text-xs ${pronto ? "font-medium text-good-text" : "text-muted"}`}>{pronto ? t.prontoReenviar : t.faltaCorrigir(pendentes)}</p>
      </div>
    </section>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <span className="font-mono text-[11px] text-muted sm:hidden">{rotulo}:</span>
      {children}
    </div>
  );
}

function novaLinha(key: string, execucao: string, item: ItemLote, teste: boolean): LinhaLog {
  const agora = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    key,
    hora: `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())} ${p(agora.getHours())}:${p(agora.getMinutes())}:${p(agora.getSeconds())}`,
    execucao,
    teste,
    id: item.linha.id,
    cliente: item.linha.cliente,
    canal: item.linha.canal,
    arquivo: item.arquivo,
    etapa: "gerando",
    motivo: item.motivo,
  };
}

function CanalTag({ canal, nome }: { canal: Canal; nome: string }) {
  const Icon = canal === "email" ? Mail : MessageCircle;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-line bg-page px-1.5 py-0.5 text-[11px] whitespace-nowrap">
      <Icon className="h-3 w-3" /> {nome}
    </span>
  );
}

function Status({ etapa, texto }: { etapa: Etapa; texto: string }) {
  if (etapa === "enviado") return <span className="inline-flex items-center gap-1 font-medium text-good-text"><CheckCircle2 className="h-3.5 w-3.5" /> {texto}</span>;
  if (etapa === "erro") return <span className="inline-flex items-center gap-1 font-medium text-critical"><XCircle className="h-3.5 w-3.5" /> {texto}</span>;
  return <span className="animate-pulse text-ink-2">{texto}</span>;
}
