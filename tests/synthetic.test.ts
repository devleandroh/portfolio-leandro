import { describe, expect, it } from "vitest";
import { generateComprasTables } from "@/lib/synthetic/compras";
import { generateFaturamentoTables } from "@/lib/synthetic/faturamento";
import { generateLegalTables } from "@/lib/synthetic/legal";
import { Random } from "@/lib/synthetic/random";

const anchor = new Date("2026-10-06T00:00:00Z");

describe("gerador pseudoaleatório", () => {
  it("é determinístico para a mesma seed", () => {
    const a = new Random(42);
    const b = new Random(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()));
  });
});

describe("dados sintéticos de compras", () => {
  const t = generateComprasTables(anchor);

  it("gera o mesmo conjunto em execuções diferentes", () => {
    expect(generateComprasTables(anchor)).toEqual(t);
  });

  it("atende os volumes mínimos", () => {
    expect(t.solicitacoes.length).toBeGreaterThanOrEqual(1000);
    expect(t.pedidos.length).toBeGreaterThanOrEqual(500);
    expect(t.notas_fiscais.length).toBeGreaterThanOrEqual(300);
  });

  it("respeita a ordem cronológica das etapas", () => {
    const scs = new Map(t.solicitacoes.map((s) => [s.id, s]));
    for (const pc of t.pedidos) {
      const sc = scs.get(pc.solicitacao_id)!;
      expect(sc.data_aprovacao).not.toBeNull();
      expect(pc.data_emissao >= sc.data_aprovacao!).toBe(true);
    }
    const pcs = new Map(t.pedidos.map((p) => [p.id, p]));
    for (const nf of t.notas_fiscais) {
      expect(nf.data_recebimento >= pcs.get(nf.pedido_id)!.data_emissao).toBe(true);
      expect(nf.data_recebimento <= "2026-10-06").toBe(true);
    }
  });

  it("não gera solicitações no futuro", () => {
    expect(t.solicitacoes.every((s) => s.data_solicitacao <= "2026-10-06")).toBe(true);
  });
});

describe("dados sintéticos de faturamento", () => {
  const t = generateFaturamentoTables(anchor);

  it("atende os volumes mínimos", () => {
    expect(t.notas.length).toBeGreaterThanOrEqual(2000);
    expect(t.produtos.length).toBeGreaterThanOrEqual(200);
    expect(t.clientes.length).toBeGreaterThanOrEqual(50);
  });

  it("devoluções sempre referenciam uma venda anterior do mesmo cliente", () => {
    const notas = new Map(t.notas.map((n) => [n.id, n]));
    for (const d of t.notas.filter((n) => n.tipo_operacao === "Devolução")) {
      const ref = notas.get(d.nota_referencia_id!)!;
      expect(ref.tipo_operacao).toBe("Venda");
      expect(ref.cliente_id).toBe(d.cliente_id);
      expect(d.data_emissao > ref.data_emissao).toBe(true);
    }
  });
});

describe("dados sintéticos jurídicos", () => {
  const t = generateLegalTables(anchor);

  it("gera centenas de processos com numeração de demonstração", () => {
    expect(t.processos.length).toBeGreaterThanOrEqual(300);
    expect(t.processos.every((p) => /^DEMO-\d{4}-\d{4}$/.test(p.numero))).toBe(true);
    expect(new Set(t.processos.map((p) => p.numero)).size).toBe(t.processos.length);
  });

  it("processos encerrados têm data e resultado; ativos não", () => {
    for (const p of t.processos) {
      if (p.status === "Encerrado") {
        expect(p.data_encerramento).not.toBeNull();
        expect(p.resultado).not.toBeNull();
        expect(p.data_encerramento! >= p.data_distribuicao).toBe(true);
      } else {
        expect(p.data_encerramento).toBeNull();
      }
    }
  });

  it("movimentações não antecedem a distribuição", () => {
    const procs = new Map(t.processos.map((p) => [p.id, p]));
    expect(t.movimentacoes.every((m) => m.data >= procs.get(m.processo_id)!.data_distribuicao)).toBe(true);
  });
});
