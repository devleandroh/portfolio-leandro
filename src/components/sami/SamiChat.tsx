"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, ArrowUp, ChevronDown, Loader2, RotateCcw } from "lucide-react";
import type { Locale } from "@/i18n/config";
// Só os textos da SAMI vão para o navegador (não o dicionário inteiro do site).
import { samiEn, samiPt } from "@/i18n/sami";
import type { Passage, SamiAnswer } from "@/lib/sami/engine";
import { samiHref } from "@/lib/sami/links";
import { normalize, stem } from "@/lib/sami/text";
import { RefText } from "./RefText";

const MAX = 300;
const TIMEOUT_MS = 12_000;

type Turn =
  | { id: number; q: string; state: "loading" }
  | { id: number; q: string; state: "done"; answer: SamiAnswer; roundTripMs: number }
  | { id: number; q: string; state: "error"; error: string };

type ApiResult =
  | { kind: "ok"; answer: SamiAnswer; roundTripMs: number }
  | { kind: "rate_limited"; retryAfter: number }
  | { kind: "invalid" | "server" | "timeout" | "network" };

/** Chamada à API fora do componente: rede, tempo limite e classificação dos erros. */
async function postQuestion(q: string, lang: Locale): Promise<ApiResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch("/api/sami", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, lang }),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { kind: "ok", answer: data as SamiAnswer, roundTripMs: performance.now() - started };
    if (res.status === 429) return { kind: "rate_limited", retryAfter: Number(data.retryAfter) || 60 };
    return { kind: res.status < 500 ? "invalid" : "server" };
  } catch (err) {
    return { kind: (err as Error).name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

export function SamiChat({ lang }: { lang: Locale }) {
  const t = (lang === "pt" ? samiPt : samiEn).chat;
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const nextId = useRef(1);
  const lastRef = useRef<HTMLLIElement>(null);
  const busy = turns.some((x) => x.state === "loading");

  useEffect(() => {
    lastRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns]);

  async function send(question: string, replaceId?: number) {
    const q = question.trim();
    if (q.length < 2 || q.length > MAX || busy) return;
    const id = replaceId ?? nextId.current++;
    setTurns((prev) => (replaceId ? prev.map((x) => (x.id === id ? { id, q, state: "loading" } : x)) : [...prev, { id, q, state: "loading" }]));
    setInput("");

    const r = await postQuestion(q, lang);
    const result: Turn =
      r.kind === "ok"
        ? { id, q, state: "done", answer: r.answer, roundTripMs: r.roundTripMs }
        : {
            id,
            q,
            state: "error",
            error:
              r.kind === "rate_limited"
                ? t.errors.rateLimit(r.retryAfter)
                : r.kind === "invalid"
                  ? t.errors.invalid
                  : r.kind === "timeout"
                    ? t.errors.timeout
                    : r.kind === "network"
                      ? t.errors.network
                      : t.errors.server,
          };
    setTurns((prev) => prev.map((x) => (x.id === id ? result : x)));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line bg-page/60 p-4">
        <p className="font-mono text-[11px] tracking-wide text-muted uppercase">{t.suggestionsLabel}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {t.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => send(s)}
              className="rounded-md border border-line bg-surface px-3 py-1.5 text-left text-sm text-ink-2 transition-colors hover:border-accent hover:text-ink disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t.more}</p>
      </div>

      <div className="p-4">
        {turns.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{t.empty}</p>
        ) : (
          <ol className="space-y-6" aria-live="polite">
            {turns.map((turn, i) => (
              <li key={turn.id} ref={i === turns.length - 1 ? lastRef : undefined} className="scroll-mt-24">
                <p className="ml-auto w-fit max-w-[90%] rounded-lg bg-ink px-3.5 py-2 text-sm text-surface">
                  <span className="sr-only">{t.you}: </span>
                  {turn.q}
                </p>
                <div className="mt-3">
                  {turn.state === "loading" && (
                    <p className="flex items-center gap-2 text-sm text-ink-2" role="status">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" /> {t.loading}
                    </p>
                  )}
                  {turn.state === "error" && (
                    <div className="flex flex-wrap items-center gap-3 rounded-md border border-critical/30 bg-critical/5 px-3.5 py-2.5 text-sm" role="alert">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-critical" />
                      <span className="flex-1">{turn.error}</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => send(turn.q, turn.id)}
                        className="inline-flex items-center gap-1 rounded border border-axis bg-surface px-2.5 py-1 text-xs font-medium hover:border-ink disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> {t.retry}
                      </button>
                    </div>
                  )}
                  {turn.state === "done" && <AnswerCard lang={lang} answer={turn.answer} roundTripMs={turn.roundTripMs} />}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-line bg-page/60 p-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="sr-only">{t.inputLabel}</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            maxLength={MAX}
            placeholder={t.placeholder}
            className="block w-full resize-none rounded-md border border-axis bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <span className="font-mono text-[11px] text-muted">{t.counter(input.length, MAX)}</span>
          <div className="flex gap-2">
            {turns.length > 0 && (
              <button type="button" disabled={busy} onClick={() => setTurns([])} className="rounded-md border border-axis px-3 py-2 text-sm text-ink-2 hover:border-ink disabled:opacity-50">
                {t.clear}
              </button>
            )}
            <button
              type="submit"
              disabled={busy || input.trim().length < 2}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-accent-strong disabled:opacity-40"
            >
              {t.send} <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const MECHANISM_STYLE: Record<string, string> = {
  structured: "border-accent/30 bg-accent-soft/50 text-accent-strong",
  retrieval: "border-series-3/30 bg-series-3/10 text-[#0b6b4a]",
  hybrid: "border-warning/50 bg-warning/15 text-[#7a5200]",
  none: "border-axis bg-wash text-ink-2",
};

function AnswerCard({ lang, answer, roundTripMs }: { lang: Locale; answer: SamiAnswer; roundTripMs: number }) {
  const t = (lang === "pt" ? samiPt : samiEn).chat;
  const label = answer.mechanism === "none" ? t.mechanism[answer.noneReason ?? "no_evidence"] : t.mechanism[answer.mechanism];
  return (
    <article className="rounded-lg border border-line bg-page p-4">
      <header className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded border px-2 py-0.5 font-medium ${MECHANISM_STYLE[answer.mechanism]}`}>{label}</span>
        {answer.intent && (
          <span className="font-mono text-muted">
            {t.intent}: {answer.intent}
          </span>
        )}
        <span className="ml-auto font-mono text-muted">
          {t.serverTime(answer.elapsedMs.toFixed(2))} · {t.roundTrip(roundTripMs.toFixed(0))}
        </span>
      </header>

      <p className="mt-3 leading-relaxed">
        <RefText lang={lang} text={answer.lead} />
      </p>
      {answer.points.length > 0 && (
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-2">
          {answer.points.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-2.5 shrink-0 bg-accent" />
              <span className="min-w-0 break-words">
                <RefText lang={lang} text={p} />
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2">
        {answer.records.length > 0 && (
          <Section title={`${t.sections.records} (${answer.records.length})`} open>
            <ul className="divide-y divide-line">
              {answer.records.map((r) => (
                <li key={r.id} className="flex flex-col gap-0.5 py-1.5 text-sm sm:flex-row sm:gap-3">
                  <a href={samiHref(lang, r.id)} className="w-12 shrink-0 font-mono text-accent-strong hover:underline">
                    {r.id}
                  </a>
                  <span className="min-w-0 flex-1">{r.label}</span>
                  <span className="text-xs text-muted sm:text-right">{r.detail}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {answer.passages.length > 0 && (
          <Section title={`${t.sections.passages} (${answer.passages.length})`} open>
            <ul className="space-y-3">
              {answer.passages.map((p) => (
                <PassageItem key={p.chunkId} lang={lang} p={p} />
              ))}
            </ul>
          </Section>
        )}
        {answer.limitations.length > 0 && (
          <Section title={t.sections.limitations}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
              {answer.limitations.map((l, i) => (
                <li key={i}>
                  <RefText lang={lang} text={l} />
                </li>
              ))}
            </ul>
          </Section>
        )}
        <Section title={t.sections.trace}>
          <ol className="space-y-1 font-mono text-[11px] text-ink-2">
            {answer.trace.map((s, i) => (
              <li key={i} className="grid grid-cols-[1fr_auto] gap-x-3">
                <span className="min-w-0 break-words">
                  <span className="text-ink">{s.step}</span> — {s.detail}
                </span>
                <span className="text-muted">{s.ms.toFixed(3)} ms</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </article>
  );
}

function Section({ title, open = false, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group rounded-md border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 font-mono text-[11px] tracking-wide text-muted uppercase">
        {title}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-3 py-2.5">{children}</div>
    </details>
  );
}

function PassageItem({ lang, p }: { lang: Locale; p: Passage }) {
  const t = (lang === "pt" ? samiPt : samiEn).chat;
  const matched = new Set(p.matched);
  // Destaca as palavras do trecho cujo radical coincide com um termo da consulta.
  const parts = p.text.split(/([\p{L}\p{N}]+)/u);
  return (
    <li className="text-sm">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <a href={samiHref(lang, p.chunkId)} className="font-mono text-xs text-accent-strong hover:underline">
          {p.chunkId}
        </a>
        <span className="font-medium">{p.docTitle}</span>
        <span className="text-ink-2">· {p.heading}</span>
      </div>
      <p className="mt-1 border-l-2 border-accent-soft pl-3 leading-relaxed text-ink-2">
        {parts.map((w, i) =>
          i % 2 === 1 && matched.has(stem(normalize(w))) ? (
            <mark key={i} className="rounded-sm bg-accent-soft/70 px-0.5 text-ink">
              {w}
            </mark>
          ) : (
            <span key={i}>{w}</span>
          ),
        )}
      </p>
      <p className="mt-1 font-mono text-[11px] text-muted">
        {t.score} {p.score.toFixed(2)} · {t.coverage} {Math.round(p.coverage * 100)}% · {t.matched}: {p.matched.join(", ")}
      </p>
    </li>
  );
}
