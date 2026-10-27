import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "@/app/api/sami/route";
import { samiEn, samiPt } from "@/i18n/sami";
import evalJson from "@/content/sami-eval.json";
import { decisions, milestones, risks, tasks } from "@/lib/sami/atlas";
import { documents } from "@/lib/sami/documents";
import { ask, MAX_QUERY_LENGTH, route } from "@/lib/sami/engine";
import { citedRefs, refExists, runEval } from "@/lib/sami/eval";
import { REF_PATTERN, samiHref } from "@/lib/sami/links";
import { blockers, forecast, milestoneForecasts, overdueTasks, simulateDelay } from "@/lib/sami/projects";
import { search } from "@/lib/sami/retrieval";
import { queryTerms, stem } from "@/lib/sami/text";

const ids = new Set([...tasks, ...risks, ...decisions, ...milestones].map((x) => x.id));
const docIds = new Set(documents.map((d) => d.id));

describe("dados do Projeto Atlas", () => {
  it("toda referência entre registros e documentos aponta para algo que existe", () => {
    for (const t of tasks) {
      t.dependsOn.forEach((d) => expect(ids.has(d), `${t.id} → ${d}`).toBe(true));
      t.docs.forEach((d) => expect(docIds.has(d), `${t.id} → ${d}`).toBe(true));
      expect(ids.has(t.milestone)).toBe(true);
    }
    for (const r of risks) [...r.tasks, ...r.docs].forEach((x) => expect(ids.has(x) || docIds.has(x), `${r.id} → ${x}`).toBe(true));
    for (const d of decisions) expect(docIds.has(d.doc)).toBe(true);
    for (const doc of documents) {
      doc.related.forEach((x) => expect(ids.has(x) || docIds.has(x), `${doc.id} → ${x}`).toBe(true));
      for (const s of doc.sections)
        for (const lang of ["pt", "en"] as const)
          for (const m of s.body[lang].matchAll(REF_PATTERN)) expect(refExists(m[0]), `${doc.id}: ${m[0]}`).toBe(true);
    }
  });

  it("dependências não formam ciclos e tarefas em andamento não esperam tarefas abertas", () => {
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (id: string) => {
      expect(visiting.has(id), `ciclo em ${id}`).toBe(false);
      if (done.has(id)) return;
      visiting.add(id);
      byId.get(id)!.dependsOn.forEach(visit);
      visiting.delete(id);
      done.add(id);
    };
    tasks.forEach((t) => visit(t.id));
    for (const t of tasks.filter((x) => x.status === "in_progress")) {
      expect(t.dependsOn.every((d) => byId.get(d)!.status === "done"), t.id).toBe(true);
    }
  });

  it("textos de todos os registros existem nos dois idiomas", () => {
    for (const x of [...tasks, ...risks, ...decisions]) expect(x.title.pt && x.title.en).toBeTruthy();
    for (const d of documents) for (const s of d.sections) expect(s.body.pt && s.body.en && s.heading.pt && s.heading.en).toBeTruthy();
  });
});

describe("consultas estruturadas", () => {
  it("tarefas atrasadas em 20/10/2026", () => {
    expect(overdueTasks().map((t) => t.id)).toEqual(["T-06", "O-02", "T-05"]);
  });

  it("bloqueios com causa-raiz, inclusive entre projetos", () => {
    const b = blockers();
    expect(b.map((x) => x.task.id)).toEqual(["T-05", "T-08"]);
    expect(b[0].roots.map((t) => t.id)).toEqual(["T-06"]);
    expect(b[1].roots.map((t) => t.id)).toEqual(["O-02"]);
    expect(b[0].milestones).toContain("M2");
  });

  it("projeção: a Release 1 fecha no prazo sem folga", () => {
    const m2 = milestoneForecasts().find((m) => m.milestone.id === "M2")!;
    expect(m2.projected).toBe("2026-10-30");
    expect(m2.slip).toBe(0);
    expect(forecast().get("T-11")!.slack).toBe(0);
  });

  it("simulação: 5 dias de atraso na T-05 atrasam a Release 1 em 4 dias (1 dia de folga na T-09)", () => {
    const s = simulateDelay("T-05", 5);
    expect(s.shifted.map((x) => x.task.id)).toEqual(["T-05", "T-09", "T-11"]);
    expect(s.milestones).toHaveLength(1);
    expect(s.milestones[0]).toMatchObject({ before: "2026-10-30", after: "2026-11-03", slipAfter: 4 });
    expect(s.absorbed.map((t) => t.id).sort()).toEqual(["T-12", "T-13", "T-15", "T-16"]);
  });

  it("atraso dentro da folga não muda marcos", () => {
    const s = simulateDelay("T-04", 4);
    expect(s.milestones).toEqual([]);
  });
});

describe("recuperação documental (BM25)", () => {
  it("normaliza acentos, plurais e trunca o radical", () => {
    expect(stem("integracoes")).toBe("integr");
    expect(queryTerms("Integração com o ERP")).toEqual(["integr", "erp"]);
  });

  it("encontra trechos reais com referência", () => {
    const res = search("pt", "limite de chamadas do ERP");
    expect(res.hits.length).toBeGreaterThan(0);
    const top = res.hits.map((h) => h.chunk.docId);
    expect(top).toContain("INC-007");
    for (const h of res.hits) {
      const doc = documents.find((d) => d.id === h.chunk.docId)!;
      expect(doc.sections[h.chunk.section - 1].body.pt).toBe(h.chunk.text);
    }
  });

  it("rejeita candidatos abaixo da cobertura mínima", () => {
    const res = search("en", "kubernetes cluster deploy");
    expect(res.hits).toEqual([]);
  });

  it("busca restrita a documentos específicos", () => {
    const res = search("en", "queue", { onlyDocs: ["ADR-002"] });
    expect(res.hits.every((h) => h.chunk.docId === "ADR-002")).toBe(true);
  });
});

describe("motor de respostas", () => {
  it("roteia as sugestões da página para o mecanismo esperado nos dois idiomas", () => {
    const expected = ["structured", "hybrid", "structured", "structured", "none"];
    for (const dict of [samiPt, samiEn]) {
      const lang = dict === samiPt ? "pt" : "en";
      dict.chat.suggestions.forEach((q, i) => expect(ask(q, lang).mechanism, q).toBe(expected[i]));
    }
  });

  it("responde sem evidência de forma explícita, sem citar fontes", () => {
    const a = ask("Qual a receita de bolo de cenoura?", "pt");
    expect(a.mechanism).toBe("none");
    expect(a.noneReason).toBe("no_evidence");
    expect(a.records).toEqual([]);
    expect(a.passages).toEqual([]);
  });

  it("pergunta de atraso sem tarefa identificável não é suportada", () => {
    const a = ask("What if the integration slips 5 days?", "en");
    expect(a).toMatchObject({ mechanism: "none", noneReason: "unsupported", intent: null });
  });

  it("extrai entidades: tarefa por apelido, dias por extenso e semanas", () => {
    expect(route("O que acontece se a integração principal atrasar cinco dias?").entities).toMatchObject({ taskId: "T-05", days: 5 });
    expect(route("what if T-06 slips two weeks").entities).toMatchObject({ taskId: "T-06", days: 14 });
  });

  it("é determinístico (exceto tempos) e toda referência citada existe", () => {
    const strip = (a: ReturnType<typeof ask>) => ({ ...a, trace: a.trace.map((t) => t.step), elapsedMs: 0 });
    const q = "Por que a T-05 está bloqueada?";
    expect(strip(ask(q, "pt"))).toEqual(strip(ask(q, "pt")));
    for (const ref of citedRefs(ask(q, "pt"))) expect(refExists(ref), ref).toBe(true);
  });

  it("limpa caracteres de controle e limita o tamanho", () => {
    const a = ask(`riscos\u0000 críticos ${"x".repeat(1000)}`, "pt");
    expect(a.query.length).toBeLessThanOrEqual(MAX_QUERY_LENGTH);
    expect(a.query).not.toContain("\u0000");
  });

  it("links de referência apontam para o painel ou para o trecho do documento", () => {
    expect(samiHref("pt", "T-05")).toBe("/pt/sami#rec-T-05");
    expect(samiHref("en", "ADR-002§2")).toBe("/sami/docs/ADR-002#s-2");
  });
});

describe("avaliação publicada na página", () => {
  it("o arquivo sami-eval.json corresponde ao motor atual (rode npm run sami:eval se falhar)", () => {
    const fresh = runEval();
    const { generatedAt: _g, environment: _e, latencyMs: _l, ...stored } = evalJson;
    void _g;
    void _e;
    void _l;
    expect(stored).toEqual(JSON.parse(JSON.stringify(fresh)));
  });
});

describe("API /api/sami", () => {
  const call = (body: unknown, headers: Record<string, string> = {}) =>
    POST(
      new Request("http://localhost/api/sami", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": headers.ip ?? "10.0.0.1", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }) as unknown as NextRequest,
    );

  it("responde perguntas válidas", async () => {
    const res = await call({ q: "Quais tarefas estão atrasadas?", lang: "pt" });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const data = await res.json();
    expect(data.mechanism).toBe("structured");
  });

  it("valida idioma, tamanho e JSON", async () => {
    expect((await call({ q: "oi", lang: "fr" }, { ip: "10.0.0.2" })).status).toBe(400);
    expect((await call({ q: "x", lang: "pt" }, { ip: "10.0.0.2" })).status).toBe(400);
    expect((await call({ q: "x".repeat(301), lang: "pt" }, { ip: "10.0.0.2" })).status).toBe(400);
    expect((await call("{not json", { ip: "10.0.0.2" })).status).toBe(400);
    expect((await call({ q: "riscos", lang: "pt" }, { ip: "10.0.0.2", "content-type": "text/plain" })).status).toBe(415);
  });

  it("limita requisições por IP", async () => {
    let last = 200;
    for (let i = 0; i < 31; i++) last = (await call({ q: "riscos", lang: "pt" }, { ip: "10.0.0.3" })).status;
    expect(last).toBe(429);
  });
});
