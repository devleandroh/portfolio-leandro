"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, FileText, Mail, MessageCircle, Play, RotateCcw, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { remessaTexts } from "@/i18n/remessa";
import type { Locale } from "@/i18n/config";
import {
  CONTROLE_INICIAL, DATA_OPTIN_DEMO, EMAIL_CORRIGIDO, SEMANA, mascarar, planejarLote, resumir, type Canal, type ItemLote, type LinhaControle,
  type Motivo,
} from "@/lib/remessa";

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

const PASSO_MS = 450;
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function RemessaSimulator({ lang }: { lang: Locale }) {
  const t = remessaTexts[lang];
  const [controle, setControle] = useState<LinhaControle[]>(CONTROLE_INICIAL);
  const [teste, setTeste] = useState(true);
  const [log, setLog] = useState<LinhaLog[]>([]);
  const [rodando, setRodando] = useState(false);
  const [resumo, setResumo] = useState<{ enviados: number; erros: number } | null>(null);
  const [falhas, setFalhas] = useState<Set<number>>(new Set());
  const execRef = useRef(0);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  async function executar(apenas?: ReadonlySet<number>) {
    const lote = planejarLote(controle, { teste, apenas });
    if (lote.length === 0) return;
    setRodando(true);
    setResumo(null);
    execRef.current += 1;
    const execucao = `exec-${String(execRef.current).padStart(4, "0")}`;
    const atualizar = (key: string, etapa: Etapa) =>
      setLog((l) => l.map((r) => (r.key === key ? { ...r, etapa } : r)));

    for (const item of lote) {
      if (!vivo.current) return;
      const key = `${execucao}-${item.linha.id}`;
      setLog((l) => [novaLinha(key, execucao, item, teste), ...l]);
      await espera(PASSO_MS);
      if (item.motivo) {
        atualizar(key, "erro");
        continue;
      }
      atualizar(key, "enviando");
      await espera(PASSO_MS);
      atualizar(key, "enviado");
    }
    if (!vivo.current) return;
    setResumo(resumir(lote));
    setFalhas(new Set(lote.filter((i) => i.motivo).map((i) => i.linha.id)));
    setRodando(false);
  }

  function corrigir(id: number, campo: "optin" | "email") {
    setControle((c) =>
      c.map((l) => (l.id !== id ? l : campo === "optin" ? { ...l, optin: DATA_OPTIN_DEMO } : { ...l, destinatario: EMAIL_CORRIGIDO })),
    );
  }

  function reiniciar() {
    setControle(CONTROLE_INICIAL);
    setLog([]);
    setResumo(null);
    setFalhas(new Set());
    execRef.current = 0;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-4">
        {/* CONTROLE */}
        <section className="rounded-lg border border-line bg-surface">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileSpreadsheet className="h-4 w-4 text-good" /> {t.controle}
            </h2>
            <p className="text-xs text-muted">{t.controleHint}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-page font-mono text-[11px] text-muted">
                <tr>
                  {Object.values(t.cols).map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {controle.map((l) => {
                  const pendente = falhas.has(l.id) && !rodando;
                  return (
                    <tr key={l.id}>
                      <td className="px-3 py-2 font-mono text-xs">{l.ativo ? t.sim : t.nao}</td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{l.cliente}</td>
                      <td className="px-3 py-2 font-mono text-xs">{l.aba}</td>
                      <td className="px-3 py-2 font-mono text-xs">{l.formato}</td>
                      <td className="px-3 py-2"><CanalTag canal={l.canal} nome={t.canalNome[l.canal]} /></td>
                      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                        {mascarar(l.destinatario, l.canal)}
                        {pendente && l.canal === "email" && l.destinatario !== EMAIL_CORRIGIDO && (
                          <button type="button" onClick={() => corrigir(l.id, "email")} className="ml-2 rounded border border-accent px-1.5 py-0.5 font-sans text-[11px] text-accent-strong hover:bg-accent-soft/40">
                            {t.corrigirEmail}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                        {l.canal !== "whatsapp" ? (
                          <span className="text-muted">{t.naoSeAplica}</span>
                        ) : l.optin ? (
                          <span className="text-good-text">{l.optin}</span>
                        ) : (
                          <>
                            <span className="text-critical">{t.vazio}</span>
                            {pendente && (
                              <button type="button" onClick={() => corrigir(l.id, "optin")} className="ml-2 rounded border border-accent px-1.5 py-0.5 font-sans text-[11px] text-accent-strong hover:bg-accent-soft/40">
                                {t.registrarOptin}
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            <Play className="h-4 w-4" /> {rodando ? t.rodando : t.rodar}
          </button>
          {falhas.size > 0 && (
            <button
              type="button"
              onClick={() => executar(falhas)}
              disabled={rodando}
              className="inline-flex items-center gap-2 rounded-md border border-axis bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-ink disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" /> {t.reenviar(falhas.size)}
            </button>
          )}
          {log.length > 0 && (
            <button type="button" onClick={reiniciar} disabled={rodando} className="ml-auto inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink disabled:opacity-60">
              <Trash2 className="h-3.5 w-3.5" /> {t.limpar}
            </button>
          )}
          <p className="w-full text-xs text-muted">{t.modoTesteHint}</p>
        </section>

        {resumo && (
          <p
            role="status"
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              resumo.erros ? "border-warning/60 bg-warning/10" : "border-good/50 bg-good/10"
            }`}
          >
            {resumo.erros ? <XCircle className="h-4 w-4 text-critical" /> : <CheckCircle2 className="h-4 w-4 text-good" />}
            <span>
              <strong className="font-semibold">{t.resumo(resumo.enviados, resumo.erros)}</strong>
              <span className="text-ink-2"> · {t.pasta(SEMANA)}</span>
            </span>
          </p>
        )}

        {/* LOG */}
        <section className="rounded-lg border border-line bg-surface">
          <h2 className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm font-semibold">
            <FileText className="h-4 w-4 text-ink-2" /> {t.log}
          </h2>
          {log.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">{t.logVazio}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-xs">
                <thead className="border-b border-line bg-page font-mono text-[11px] text-muted">
                  <tr>
                    {t.logCols.map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line" aria-live="polite">
                  {log.map((r) => (
                    <tr key={r.key}>
                      <td className="px-3 py-2 font-mono whitespace-nowrap">{r.hora}</td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap">{r.execucao}</td>
                      <td className="px-3 py-2">{r.teste ? t.modo.teste : t.modo.real}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.cliente}</td>
                      <td className="px-3 py-2"><CanalTag canal={r.canal} nome={t.canalNome[r.canal]} /></td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap">{r.arquivo}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><Status etapa={r.etapa} texto={t.status[r.etapa]} /></td>
                      <td className="px-3 py-2 text-ink-2">{r.motivo && r.etapa === "erro" ? t.motivos[r.motivo] : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
