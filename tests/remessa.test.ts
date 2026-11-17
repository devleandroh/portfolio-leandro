import { describe, expect, it } from "vitest";
import {
  CONTROLE_INICIAL, DATA_OPTIN_DEMO, DESTINO_TESTE, EMAIL_CORRIGIDO, mascarar, nomeArquivo, nomeArquivoSeguro, pastaEnvio, planejarLote, resumir, tabelaCliente, validar,
} from "@/lib/remessa";

describe("Remessa: envio de planilhas", () => {
  it("gera nome de arquivo igual ao nome_arquivo_seguro do projeto Python", () => {
    expect(nomeArquivoSeguro("Precos_2026-S47_Mercado Bom Preço")).toBe("Precos_2026-S47_Mercado_Bom_Preco");
    expect(nomeArquivoSeguro("  ..Hortifrúti / Vale: Azul..")).toBe("Hortifruti_Vale_Azul");
    expect(nomeArquivoSeguro("ççç")).toBe("ccc");
    expect(nomeArquivoSeguro("???")).toBe("arquivo");
    expect(nomeArquivo({ cliente: "Mercado Bom Preço", formato: "PDF" })).toBe("Precos_2026-S47_Mercado_Bom_Preco.pdf");
    expect(nomeArquivo({ cliente: "Padaria Central", formato: "XLSX" }, "2026-S48")).toBe("Precos_2026-S48_Padaria_Central.xlsx");
  });

  it("bloqueia WhatsApp sem opt-in e e-mail inválido", () => {
    const motivos = Object.fromEntries(CONTROLE_INICIAL.map((l) => [l.cliente, validar(l)]));
    expect(motivos["Empório Serra Verde"]).toBe("sem_optin");
    expect(motivos["Distribuidora Horizonte"]).toBe("email_invalido");
    expect(motivos["Padaria Central"]).toBeNull();
    expect(validar({ ...CONTROLE_INICIAL[1], destinatario: "123" })).toBe("telefone_invalido");
  });

  it("resume o lote e reenvia só as falhas", () => {
    const lote = planejarLote(CONTROLE_INICIAL, { teste: false });
    expect(resumir(lote)).toEqual({ enviados: 3, erros: 2 });
    const falhas = new Set(lote.filter((i) => i.motivo).map((i) => i.linha.id));
    const corrigido = CONTROLE_INICIAL.map((l) =>
      l.id === 3 ? { ...l, optin: DATA_OPTIN_DEMO } : l.id === 4 ? { ...l, destinatario: EMAIL_CORRIGIDO } : l,
    );
    const reenvio = planejarLote(corrigido, { teste: false, apenas: falhas });
    expect(reenvio).toHaveLength(2);
    expect(resumir(reenvio)).toEqual({ enviados: 2, erros: 0 });
  });

  it("modo de teste troca só o destino e mantém a validação", () => {
    const lote = planejarLote(CONTROLE_INICIAL, { teste: true });
    expect(lote.every((i) => i.destino === DESTINO_TESTE[i.linha.canal])).toBe(true);
    expect(resumir(lote).erros).toBe(2);
  });

  it("ignora linhas inativas", () => {
    const linhas = CONTROLE_INICIAL.map((l) => (l.id === 1 ? { ...l, ativo: false } : l));
    expect(planejarLote(linhas, { teste: false })).toHaveLength(4);
  });

  it("mascara destinatários", () => {
    expect(mascarar("compras@bompreco.exemplo.com", "email")).toBe("co***@bompreco.exemplo.com");
    expect(mascarar("5531900000001", "whatsapp")).toBe("+55 31 9****-0001");
  });
});

describe("arquivos gerados", () => {
  it("calcula a tabela do cliente com o desconto da aba", () => {
    const { desconto, linhas } = tabelaCliente("PADARIA");
    expect(desconto).toBe(0.03);
    expect(linhas[0]).toMatchObject({ codigo: "P001", preco: 27.75, precoCliente: 26.92 });
  });

  it("separa a pasta do modo de teste", () => {
    expect(pastaEnvio(false)).toBe("Envios/2026-S47/");
    expect(pastaEnvio(true)).toBe("Envios/2026-S47/teste/");
  });
});
