import type { Locale } from "./config";

/**
 * Guia recolhível de cada demonstração: como navegar pelo painel e como ele foi construído.
 * O fluxo e a stack vêm do case correspondente (src/content/cases.ts); aqui ficam só
 * as dicas de uso e uma frase sobre como a demo roda. O inglês tem as mesmas chaves do português.
 */
export type GuideKey = "remessa" | "banco" | "bancoPipeline" | "compras" | "faturamento" | "juridico";

export interface DemoGuideText {
  /** Slug do case em src/content/cases.ts. */
  caseSlug: string;
  steps: string[];
  /** Como esta demo roda, em uma frase. */
  runtime: string;
}

const pt: Record<GuideKey, DemoGuideText> = {
  remessa: {
    caseSlug: "remessa",
    steps: [
      "Confira a aba CONTROLE: cada linha é um cliente, com formato (PDF ou Excel), canal e destinatário.",
      "Deixe o modo de teste ligado e clique em Rodar envio. A aba LOG registra cada envio, linha por linha.",
      "Algumas linhas falham de propósito (sem opt-in, e-mail ou telefone inválido). Corrija com um clique.",
      "Clique em Reenviar falhas: só quem falhou recebe de novo, sem duplicar quem já recebeu.",
    ],
    runtime:
      "Esta página simula no navegador o robô em Python, que de verdade roda no computador do usuário, a partir de um botão na planilha ou do Agendador de Tarefas.",
  },
  banco: {
    caseSlug: "banco-360",
    steps: [
      "Os cartões do topo mostram a carteira hoje e como ela mudou em 12 meses.",
      "Filtre por segmento e produto: todos os gráficos e indicadores são recalculados.",
      "Passe o mouse (ou toque) nos gráficos para ver os valores de cada mês.",
      "Abra a aba Pipeline e qualidade para ver de onde vêm esses números e as regras que validam cada execução.",
    ],
    runtime:
      "Os números vêm do Data Warehouse (PostgreSQL no Supabase), carregado todo dia pelo pipeline PySpark; o site só lê as views públicas.",
  },
  bancoPipeline: {
    caseSlug: "banco-360",
    steps: [
      "O fluxo mostra o volume que passou por cada camada na última execução: Origem, Bronze, Silver, Gold e Warehouse.",
      "Em Etapas, veja quanto tempo cada job levou.",
      "Em Qualidade de dados, cada regra aparece aprovada ou reprovada. Se uma regra crítica falha, o pipeline para antes de publicar.",
      "O histórico mostra as últimas execuções diárias. Volte à aba Painel de negócio para ver o resultado.",
    ],
    runtime:
      "Esta página lê as tabelas de observabilidade que o próprio pipeline grava a cada execução (GitHub Actions, todos os dias).",
  },
  compras: {
    caseSlug: "compras-360",
    steps: [
      "Escolha o período e, se quiser, centro de custo, categoria, status ou prioridade. Depois clique em Aplicar.",
      "O funil mostra quantas solicitações viraram pedido e nota. O tempo por etapa mostra onde a compra demora.",
      "Pedidos em atraso aparecem à direita. Clique no número para abrir a linha do tempo completa.",
      "Na lista, busque pelo número ou fornecedor e clique em uma solicitação para ver itens e notas vinculadas.",
    ],
    runtime:
      "O servidor Next.js lê as views do PostgreSQL (Supabase), aplica os filtros e calcula os indicadores antes de enviar a página.",
  },
  faturamento: {
    caseSlug: "faturamento",
    steps: [
      "Escolha o período. Cada indicador é comparado automaticamente com o mesmo período do ano anterior.",
      "Refine por região, categoria, segmento ou vendedor; a comparação anual acompanha o filtro.",
      "Passe o mouse no gráfico mensal para comparar mês a mês com o ano anterior.",
      "Os rankings mostram a concentração: quanto do faturamento está nos 10 maiores clientes.",
    ],
    runtime:
      "O servidor Next.js lê as notas fiscais das views do PostgreSQL (Supabase) e calcula as agregações por período antes de enviar a página.",
  },
  juridico: {
    caseSlug: "legal-bi",
    steps: [
      "Use Situação para alternar entre processos ativos, encerrados ou todos. Combine com área, tribunal ou risco.",
      "A agenda de prazos destaca o que está vencido ou vence em 7 e 30 dias.",
      "O aging e o painel de risco mostram há quanto tempo cada processo está aberto e quanto está provisionado.",
      "Clique no número de um processo para abrir a ficha com todas as movimentações.",
    ],
    runtime:
      "O servidor Next.js lê processos, prazos e movimentações das views do PostgreSQL (Supabase) e monta a página já com os números calculados.",
  },
};

const en: Record<GuideKey, DemoGuideText> = {
  remessa: {
    caseSlug: "remessa",
    steps: [
      "Check the CONTROL sheet: each row is a customer, with a format (PDF or Excel), channel and recipient.",
      "Keep test mode on and click Run batch. The LOG sheet records every send, row by row.",
      "Some rows fail on purpose (no opt-in, invalid e-mail or phone). Fix them with one click.",
      "Click Retry failures: only the failed rows are sent again, with no duplicates for customers who already got theirs.",
    ],
    runtime:
      "This page simulates in the browser the Python robot that really runs on the user's computer, from a button in the workbook or Windows Task Scheduler.",
  },
  banco: {
    caseSlug: "banco-360",
    steps: [
      "The cards at the top show today's portfolio and how it changed over 12 months.",
      "Filter by segment and product: every chart and metric is recalculated.",
      "Hover (or tap) the charts to see each month's values.",
      "Open the Pipeline & data quality tab to see where these numbers come from and the rules that check every run.",
    ],
    runtime:
      "The numbers come from the Data Warehouse (PostgreSQL on Supabase), loaded daily by the PySpark pipeline; the site only reads public views.",
  },
  bancoPipeline: {
    caseSlug: "banco-360",
    steps: [
      "The flow shows the volume that went through each layer in the last run: Source, Bronze, Silver, Gold and Warehouse.",
      "Under Steps, see how long each job took.",
      "Under Data quality, each rule shows as passed or failed. If a critical rule fails, the pipeline stops before publishing.",
      "The history lists the latest daily runs. Go back to the Business dashboard tab to see the result.",
    ],
    runtime:
      "This page reads the observability tables the pipeline itself writes on every run (GitHub Actions, daily).",
  },
  compras: {
    caseSlug: "compras-360",
    steps: [
      "Pick a period and, if you like, a cost center, category, status or priority. Then click Apply.",
      "The funnel shows how many requests became orders and invoices. Time per stage shows where purchases slow down.",
      "Late orders appear on the right. Click the number to open the full timeline.",
      "In the list, search by number or supplier and click a request to see its items and linked invoices.",
    ],
    runtime:
      "The Next.js server reads the PostgreSQL views (Supabase), applies the filters and calculates the metrics before sending the page.",
  },
  faturamento: {
    caseSlug: "faturamento",
    steps: [
      "Pick a period. Every metric is automatically compared with the same period of the previous year.",
      "Narrow down by region, category, segment or sales rep; the year-over-year comparison follows the filter.",
      "Hover the monthly chart to compare each month with the previous year.",
      "The rankings show concentration: how much revenue comes from the top 10 customers.",
    ],
    runtime:
      "The Next.js server reads invoices from the PostgreSQL views (Supabase) and calculates the period aggregations before sending the page.",
  },
  juridico: {
    caseSlug: "legal-bi",
    steps: [
      "Use Situation to switch between active, closed or all cases. Combine it with area, court or risk.",
      "The deadline calendar highlights what is overdue or due in 7 and 30 days.",
      "Aging and the risk panel show how long each case has been open and how much is provisioned.",
      "Click a case number to open its file with the full activity history.",
    ],
    runtime:
      "The Next.js server reads cases, deadlines and activity from the PostgreSQL views (Supabase) and builds the page with the numbers already calculated.",
  },
};

export const guideLabels: Record<Locale, { howTo: string; architecture: string; runtime: string; stack: string; more: string; tip: string }> = {
  pt: {
    howTo: "Como navegar",
    architecture: "Arquitetura",
    runtime: "Nesta demo",
    stack: "Stack",
    more: "Ver o case completo",
    tip: "Os filtros ficam no endereço da página: dá para copiar o link e compartilhar a mesma visão.",
  },
  en: {
    howTo: "How to navigate",
    architecture: "Architecture",
    runtime: "In this demo",
    stack: "Stack",
    more: "See the full case",
    tip: "Filters are kept in the page address: copy the link to share the same view.",
  },
};

const guides: Record<Locale, Record<GuideKey, DemoGuideText>> = { pt, en };
export const getGuide = (lang: Locale, key: GuideKey) => guides[lang][key];
