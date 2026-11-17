import type { Locale } from "./config";

/**
 * Textos da demonstração do Remessa (automação de envio de planilhas).
 * Importado direto pela página e pelo componente cliente (RemessaSimulator); o inglês precisa ter as mesmas chaves do português.
 */
const pt = {
  metaTitle: "Remessa",
  title: "Remessa · Automação de envio de planilhas",
  description:
    "Cada cliente recebe a sua planilha, no canal certo. Simulação do lote semanal de uma distribuidora fictícia: para cada linha da aba CONTROLE, o robô gera o arquivo do cliente, envia pelo canal certo e registra tudo na aba LOG.",
  controle: "Aba CONTROLE",
  controleHint: "Adicionar um cliente é preencher uma linha. Destinatários mascarados.",
  cols: {
    ativo: "ativo",
    cliente: "cliente",
    aba: "aba",
    formato: "formato",
    canal: "canal",
    destinatario: "destinatário",
    optin: "optin_whatsapp",
  },
  sim: "SIM",
  nao: "NÃO",
  naoSeAplica: "—",
  vazio: "(vazio)",
  registrarOptin: "registrar opt-in",
  corrigirEmail: "corrigir e-mail",
  modoTeste: "Modo de teste",
  modoTesteHint: "Gera tudo, valida tudo e envia só para você conferir antes do disparo real.",
  rodar: "Rodar envio",
  rodando: "Enviando…",
  reenviar: (n: number) => `Reenviar falhas (${n})`,
  limpar: "Limpar LOG",
  log: "Aba LOG",
  logVazio: "Nenhuma execução ainda. Clique em \"Rodar envio\".",
  logCols: ["data_hora", "execução", "modo", "cliente", "canal", "arquivo", "status", "motivo"],
  modo: { teste: "teste", real: "real" },
  status: { gerando: "gerando arquivo…", enviando: "enviando…", enviado: "enviado", erro: "erro" },
  motivos: {
    sem_optin: "sem opt-in registrado (exigido pela política do WhatsApp Business)",
    email_invalido: "E-mail inválido na aba CONTROLE.",
    telefone_invalido: "Telefone fora do formato internacional (55 + DDD + número).",
  },
  resumo: (env: number, err: number) =>
    `${env} ${env === 1 ? "enviado" : "enviados"}, ${err} com erro${err ? " — corrija na CONTROLE e reenvie só as falhas" : ""}`,
  pasta: (semana: string) => `Arquivos salvos em Envios/${semana}/`,
  canalNome: { email: "e-mail", whatsapp: "WhatsApp" },
  conformidade: {
    title: "Conformidade com a Meta",
    itens: [
      { t: "API oficial", d: "WhatsApp Cloud API (Graph API da Meta): upload do arquivo como mídia e envio pelo número comercial verificado. Nada de automação do WhatsApp Web." },
      { t: "Template aprovado", d: "Mensagens iniciadas pela empresa usam um template de utilidade aprovado pela Meta, com o PDF/Excel no cabeçalho de documento." },
      { t: "Opt-in por cliente", d: "Só recebe pelo WhatsApp quem autorizou. A coluna optin_whatsapp guarda a data do opt-in; sem ela, a linha é bloqueada e registrada no LOG." },
      { t: "Opt-out respeitado", d: "Se o cliente pediu para não receber (erro 131050 da API), o envio é registrado no LOG com o motivo. O procedimento é apagar a data de opt-in ou mudar ativo para NÃO." },
      { t: "Ritmo de envio", d: "Só clientes que já compram da empresa, em frequência semanal combinada, com pausa entre envios e nova tentativa com espera em limites de taxa." },
    ],
  },
  como: {
    title: "O que esta simulação mostra",
    itens: [
      "Validação antes do envio: um erro não trava o lote.",
      "Modo de teste com o mesmo fluxo do disparo real.",
      "Resumo final e reenvio só das falhas, sem duplicar quem já recebeu.",
    ],
  },
};

export type RemessaTexts = typeof pt;

const en: RemessaTexts = {
  metaTitle: "Remessa",
  title: "Remessa · Spreadsheet delivery automation",
  description:
    "Every customer gets their own spreadsheet, on the right channel. Simulation of a fictitious distributor's weekly batch: for each row of the CONTROL sheet, the bot builds the customer's file, sends it through the right channel and logs everything in the LOG sheet.",
  controle: "CONTROL sheet",
  controleHint: "Adding a customer means filling in one row. Recipients are masked.",
  cols: {
    ativo: "active",
    cliente: "customer",
    aba: "sheet",
    formato: "format",
    canal: "channel",
    destinatario: "recipient",
    optin: "optin_whatsapp",
  },
  sim: "YES",
  nao: "NO",
  naoSeAplica: "—",
  vazio: "(empty)",
  registrarOptin: "record opt-in",
  corrigirEmail: "fix e-mail",
  modoTeste: "Test mode",
  modoTesteHint: "Builds and validates everything, but sends only to you so you can check before the real run.",
  rodar: "Run batch",
  rodando: "Sending…",
  reenviar: (n: number) => `Retry failures (${n})`,
  limpar: "Clear LOG",
  log: "LOG sheet",
  logVazio: "No runs yet. Click \"Run batch\".",
  logCols: ["timestamp", "run", "mode", "customer", "channel", "file", "status", "reason"],
  modo: { teste: "test", real: "live" },
  status: { gerando: "building file…", enviando: "sending…", enviado: "sent", erro: "error" },
  motivos: {
    sem_optin: "no opt-in on record (required by the WhatsApp Business policy)",
    email_invalido: "Invalid e-mail in the CONTROL sheet.",
    telefone_invalido: "Phone number not in international format (country + area code + number).",
  },
  resumo: (env: number, err: number) =>
    `${env} sent, ${err} with errors${err ? " — fix them in CONTROL and retry only the failures" : ""}`,
  pasta: (semana: string) => `Files saved to Envios/${semana}/`,
  canalNome: { email: "e-mail", whatsapp: "WhatsApp" },
  conformidade: {
    title: "Meta compliance",
    itens: [
      { t: "Official API", d: "WhatsApp Cloud API (Meta Graph API): the file is uploaded as media and sent from the verified business number. No WhatsApp Web automation." },
      { t: "Approved template", d: "Business-initiated messages use a Meta-approved utility template, with the PDF/Excel in the document header." },
      { t: "Per-customer opt-in", d: "Only customers who agreed receive WhatsApp messages. The optin_whatsapp column stores the opt-in date; without it the row is blocked and logged." },
      { t: "Opt-out honored", d: "If the customer asked not to receive messages (API error 131050), the send is logged with the reason. The procedure is to clear the opt-in date or set active to NO." },
      { t: "Sending pace", d: "Existing customers only, on an agreed weekly cadence, with a pause between sends and retry with backoff on rate limits." },
    ],
  },
  como: {
    title: "What this simulation shows",
    itens: [
      "Validation before sending: one error never stops the batch.",
      "Test mode runs the same flow as the real run.",
      "Final summary and retry of failures only, without re-sending to anyone who already received it.",
    ],
  },
};

export const remessaTexts: Record<Locale, RemessaTexts> = { pt, en };
