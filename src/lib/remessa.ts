/**
 * Lógica da demonstração do Remessa (automação de envio de planilhas, 100% no navegador, dados fictícios).
 * Espelha as regras do projeto Python: validação da aba CONTROLE, nome do arquivo,
 * modo de teste, opt-in obrigatório para WhatsApp (Cloud API oficial) e reenvio só das falhas.
 */

export type Canal = "email" | "whatsapp";
export type Formato = "PDF" | "XLSX";
export type Motivo = "sem_optin" | "email_invalido" | "telefone_invalido";

export interface LinhaControle {
  id: number;
  ativo: boolean;
  cliente: string;
  aba: string;
  formato: Formato;
  canal: Canal;
  destinatario: string;
  /** Data do opt-in para WhatsApp (coluna optin_whatsapp; só se aplica ao canal whatsapp). */
  optin: string | null;
}

export interface ItemLote {
  linha: LinhaControle;
  arquivo: string;
  /** Destino efetivo (no modo de teste, o próprio usuário). */
  destino: string;
  motivo: Motivo | null;
}

export const SEMANA = "2026-S47";
export const DESTINO_TESTE = { email: "voce@exemplo.com", whatsapp: "5531900000000" } as const;

/** Aba CONTROLE inicial, igual à planilha demo do projeto (src/remessa/demo.py), com dois erros propositais. */
export const CONTROLE_INICIAL: LinhaControle[] = [
  { id: 1, ativo: true, cliente: "Mercado Bom Preço", aba: "BOMPRECO", formato: "PDF", canal: "email", destinatario: "compras@bompreco.exemplo.com", optin: null },
  { id: 2, ativo: true, cliente: "Padaria Central", aba: "PADARIA", formato: "XLSX", canal: "whatsapp", destinatario: "5531900000001", optin: "2026-09-02" },
  { id: 3, ativo: true, cliente: "Empório Serra Verde", aba: "EMPORIO", formato: "PDF", canal: "whatsapp", destinatario: "5531900000002", optin: null },
  { id: 4, ativo: true, cliente: "Distribuidora Horizonte", aba: "HORIZONTE", formato: "XLSX", canal: "email", destinatario: "financeiro@horizonte", optin: null },
  { id: 5, ativo: true, cliente: "Hortifrúti Vale Azul", aba: "HORTIFRUTI", formato: "PDF", canal: "email", destinatario: "contato@valeazul.exemplo.com", optin: null },
];

/** E-mail corrigido usado pelo botão "corrigir" da demonstração. */
export const EMAIL_CORRIGIDO = "financeiro@horizonte.exemplo.com";
/** Data gravada pelo botão "registrar opt-in" da demonstração. */
export const DATA_OPTIN_DEMO = "2026-11-17";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONE_RE = /^55\d{10,11}$/;

/**
 * Igual a nome_arquivo_seguro (src/remessa/controle.py): remove acentos e troca o que não for
 * letra, número, "-", "_" ou "." por "_". "Precos_2026-S47_Mercado Bom Preço" → "Precos_2026-S47_Mercado_Bom_Preco".
 */
export function nomeArquivoSeguro(nome: string): string {
  const limpo = nome
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^\w\-.]+/g, "_")
    .replace(/^[._]+|[._]+$/g, "");
  return limpo.slice(0, 120) || "arquivo";
}

/** Modelo padrão da coluna nome_arquivo: "Precos_{semana}_{cliente}". */
export function nomeArquivo(linha: Pick<LinhaControle, "cliente" | "formato">, semana = SEMANA): string {
  return `${nomeArquivoSeguro(`Precos_${semana}_${linha.cliente}`)}.${linha.formato.toLowerCase()}`;
}

/** Valida a linha antes de gerar ou enviar qualquer coisa. Retorna o motivo do bloqueio, se houver. */
export function validar(linha: LinhaControle): Motivo | null {
  if (linha.canal === "email") return EMAIL_RE.test(linha.destinatario) ? null : "email_invalido";
  if (!TELEFONE_RE.test(linha.destinatario)) return "telefone_invalido";
  return linha.optin ? null : "sem_optin";
}

/** Mascara o destinatário para exibição: "co***@bompreco.exemplo.com", "+55 31 9****-0001". */
export function mascarar(destinatario: string, canal: Canal): string {
  if (canal === "email") {
    const [user, domain] = destinatario.split("@");
    return domain === undefined ? `${user.slice(0, 2)}***` : `${user.slice(0, 2)}***@${domain}`;
  }
  const d = destinatario.replace(/\D/g, "");
  if (d.length < 8) return "***";
  return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d[4]}****-${d.slice(-4)}`;
}

/**
 * Monta o lote: só linhas ativas (e, no reenvio, só as falhas informadas).
 * A validação roda igual no modo de teste — só o destino muda — para o usuário ver os erros antes do disparo real.
 */
export function planejarLote(linhas: LinhaControle[], opts: { teste: boolean; apenas?: ReadonlySet<number> }): ItemLote[] {
  return linhas
    .filter((l) => l.ativo && (!opts.apenas || opts.apenas.has(l.id)))
    .map((linha) => ({
      linha,
      arquivo: nomeArquivo(linha),
      destino: opts.teste ? DESTINO_TESTE[linha.canal] : linha.destinatario,
      motivo: validar(linha),
    }));
}

export function resumir(itens: { motivo: Motivo | null }[]): { enviados: number; erros: number } {
  const erros = itens.filter((i) => i.motivo !== null).length;
  return { enviados: itens.length - erros, erros };
}
