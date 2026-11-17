import type { Locale } from "@/i18n/config";

/**
 * Conteúdo dos cases exibidos no portfólio, em cada idioma.
 * Para adicionar um case novo, inclua um objeto em `pt` e em `en` e crie a rota da
 * demonstração em src/app/[lang]/demo/<slug>/ (ver README → "Como adicionar novos cases").
 */
export interface CaseStudy {
  slug: string;
  index: string;
  name: string;
  tagline: string;
  demoHref: string;
  problem: string;
  solution: string;
  outcome: string[];
  features: string[];
  stack: string[];
  entities: string[];
  pipeline: string[];
  /** Texto acima da lista de entidades (senão, usa o texto padrão das demos com banco). */
  entitiesText?: string;
  /** Etapas da arquitetura específicas do case (senão, usa as etapas padrão das demos). */
  architecture?: { t: string; d: string }[];
  /** Repositório com o código do case. */
  repoHref?: string;
  /** Equivalência com serviços AWS (case Banco 360). */
  awsMap?: { local: string; aws: string; uso: string }[];
}

const REPO_BANCO = "https://github.com/devleandroh/banco-360-pipeline";

const STACK_REMESSA = ["Python", "xlwings", "openpyxl", "reportlab", "pywin32 (Outlook)", "smtplib", "WhatsApp Cloud API", "httpx", "pydantic", "typer", "rich", "pytest", "respx", "GitHub Actions"];

const pt: CaseStudy[] = [
  {
    slug: "remessa",
    index: "06",
    name: "Remessa · Automação de envio de planilhas",
    tagline: "Cada cliente recebe a sua planilha, no canal certo: PDF ou Excel por e-mail e WhatsApp, com um clique, log e reenvio só das falhas.",
    demoHref: "/demo/remessa",
    problem:
      "Empresas que enviam tabelas de preço, relatórios ou extratos semanais a dezenas de clientes fazem tudo à mão: atualizam a aba de origem, conferem a aba de cada cliente, exportam PDF ou Excel um a um e anexam em e-mails e conversas. São horas por semana, e o risco de mandar o preço errado para o cliente errado é alto.",
    solution:
      "Uma automação acionada por um botão que, para cada linha de uma aba CONTROLE, recalcula a pasta de trabalho, gera o arquivo no formato do cliente, salva numa pasta por semana, envia pelo canal certo (Outlook, SMTP ou a API oficial do WhatsApp) com mensagem personalizada e registra o resultado na aba LOG.",
    outcome: [
      "Um lote de dezenas de clientes sai em minutos, com resumo final: \"28 enviados, 2 com erro (motivo)\".",
      "Modo de teste: tudo é gerado e validado, mas enviado só para o próprio usuário conferir antes do disparo real.",
      "WhatsApp dentro das regras da Meta: Cloud API oficial, template aprovado e opt-in registrado por cliente.",
    ],
    features: [
      "Aba CONTROLE validada antes do envio: adicionar um cliente é preencher uma linha",
      "PDF da área de impressão ou .xlsx só com a aba do cliente, convertida em valores",
      "E-mail via Outlook (COM) ou SMTP, com detecção do \"novo Outlook\"",
      "WhatsApp Cloud API: upload do arquivo e template com cabeçalho de documento",
      "Opt-in e opt-out por cliente; linhas sem opt-in são bloqueadas e registradas",
      "Erros não travam o lote; \"reenviar falhas\" processa só o que falhou, sem duplicar",
      "Execução por botão na planilha, .bat ou Agendador de Tarefas do Windows",
      "Roda com ou sem Excel instalado; 26 testes (pytest + respx) e CI no GitHub Actions",
    ],
    stack: STACK_REMESSA,
    entitiesText: "Abas da planilha e arquivos que a automação lê e grava:",
    entities: ["ORIGEM", "abas dos clientes", "CONTROLE", "LOG", "config.yaml", ".env", "Envios/AAAA-Sxx/", "logs/*.jsonl"],
    pipeline: ["Planilha Excel", "Arquivo por cliente", "E-mail e WhatsApp", "LOG"],
    architecture: [
      { t: "Planilha", d: "Aba de origem com os preços, uma aba por cliente puxando por fórmula, a aba CONTROLE e a aba LOG." },
      { t: "Leitura e validação", d: "pydantic valida cada linha da CONTROLE (formato, canal, destinatário, opt-in) antes de gerar qualquer arquivo." },
      { t: "Geração dos arquivos", d: "Com Excel: xlwings recalcula (fórmulas e Power Query) e exporta. Sem Excel: openpyxl + avaliação de fórmulas + reportlab." },
      { t: "Canais", d: "Interface única Canal.enviar(): Outlook (pywin32), SMTP (smtplib) e WhatsApp Cloud API (httpx, Graph API)." },
      { t: "Log e reenvio", d: "Cada envio vai para a aba LOG e para logs/AAAA-MM-DD.jsonl; o ID da execução evita envio duplicado." },
      { t: "Operação", d: "Pacote Python remessa com CLI (typer + rich): remessa rodar | testar | reenviar-falhas | validar; credenciais só no .env." },
    ],
  },
  {
    slug: "banco-360",
    index: "05",
    name: "Banco 360",
    tagline: "Lakehouse bancário de ponta a ponta: ingestão, PySpark, qualidade de dados e Data Warehouse dimensional.",
    demoHref: "/demo/banco",
    problem:
      "Bancos têm dados de clientes, contas, crédito e transações espalhados em sistemas diferentes — banco relacional do core, arquivos diários de cartões e Pix, APIs externas. Sem um pipeline confiável, cada área monta seus números à mão, e indicadores críticos como inadimplência e provisão ficam sem rastreabilidade.",
    solution:
      "Um pipeline diário que extrai três tipos de fonte (PostgreSQL, arquivos CSV/JSON e a API real do Banco Central), organiza o lake em Bronze, Silver e Gold com PySpark, aplica regras de qualidade e LGPD, carrega um modelo estrela no Data Warehouse e publica o painel de crédito — com cada execução registrada e auditável.",
    outcome: [
      "Inadimplência, estágios de risco e provisão calculados de forma reprodutível, com reconciliação entre camadas.",
      "62 regras de qualidade por execução: o pipeline para antes de publicar dado errado.",
      "O CPF não passa da Bronze: vira hash com sal secreto na Silver, sem nome, e-mail ou data de nascimento.",
    ],
    features: [
      "Ingestão de banco relacional, arquivos CSV/JSON e API REST do Banco Central",
      "Jobs PySpark no formato AWS Glue (Bronze → Silver → Gold, Parquet particionado)",
      "Modelo dimensional: 2 fatos, 5 dimensões e 5 marts",
      "Portões de qualidade, quarentena e reconciliação Bronze × Silver × Gold",
      "Orquestração com Airflow (DAG) e execução diária via GitHub Actions",
      "Página de observabilidade com etapas, volumes e resultado de cada regra",
    ],
    stack: ["Python", "PySpark", "SQL", "Apache Airflow", "Parquet", "PostgreSQL", "Supabase", "Docker", "Next.js"],
    entities: ["fato_transacao", "fato_posicao_contrato", "dim_cliente", "dim_conta", "dim_produto", "dim_canal", "dim_tempo", "mart_carteira_mensal", "mart_perfil_risco", "pipeline_execucoes", "dq_resultados"],
    pipeline: ["Core bancário, arquivos e API", "Bronze · Silver · Gold", "Data Warehouse", "Painel"],
    repoHref: REPO_BANCO,
    architecture: [
      { t: "Fontes", d: "Core bancário em PostgreSQL, arquivos diários de cartões (CSV) e pagamentos (JSON) e API SGS do Banco Central." },
      { t: "Bronze", d: "Dado bruto particionado por data, com manifesto (linhas, bytes, SHA-256) para auditoria." },
      { t: "Silver", d: "PySpark: tipagem, deduplicação, quarentena de inválidos e anonimização do CPF (LGPD)." },
      { t: "Gold", d: "Modelo estrela e marts de carteira, risco, transações, clientes e macroeconomia." },
      { t: "Data Warehouse", d: "PostgreSQL (Supabase) via COPY, idempotente, com RLS e views públicas somente leitura." },
      { t: "Orquestração", d: "DAG do Airflow e GitHub Actions diário; cada etapa registrada para observabilidade." },
    ],
    awsMap: [
      { local: "Supabase Storage (API S3)", aws: "Amazon S3", uso: "Data Lake: Bronze, Silver e Gold em Parquet" },
      { local: "Jobs PySpark (Spark 3.5)", aws: "AWS Glue (Glue 5.0)", uso: "ETL distribuído entre as camadas" },
      { local: "DuckDB sobre Parquet", aws: "Amazon Athena + Glue Data Catalog", uso: "SQL direto nos arquivos do lake" },
      { local: "PostgreSQL (Supabase)", aws: "Amazon Redshift", uso: "Data Warehouse dimensional" },
      { local: "Apache Airflow 2.10", aws: "Amazon MWAA", uso: "Orquestração e agendamento" },
      { local: "Regras YAML + Spark", aws: "Glue Data Quality", uso: "Portões de qualidade de dados" },
      { local: "Tabelas de execução", aws: "Amazon CloudWatch", uso: "Monitoramento e observabilidade" },
      { local: "Hash com sal + RLS", aws: "KMS + Lake Formation + IAM", uso: "Segurança e LGPD" },
    ],
  },
  {
    slug: "compras-360",
    index: "01",
    name: "Fluxo Compras",
    tagline: "Visibilidade ponta a ponta do ciclo de compras: da solicitação à nota fiscal.",
    demoHref: "/demo/compras",
    problem:
      "Em muitas operações, ninguém sabe ao certo em que etapa está cada compra. Solicitações, pedidos e notas vivem em telas e planilhas separadas, e a pergunta \"onde está minha compra?\" vira uma sequência de mensagens.",
    solution:
      "Um painel que conecta solicitação, pedido e nota fiscal em uma única linha do tempo, com indicadores de volume, valor, tempo entre etapas e alertas de pedidos em atraso.",
    outcome: [
      "Qualquer pessoa encontra o status de uma compra em segundos, pelo número ou fornecedor.",
      "Gargalos ficam visíveis: tempo médio de cada etapa e distribuição do ciclo completo.",
      "Pedidos atrasados aparecem antes de virarem problema.",
    ],
    features: [
      "Funil Solicitação → Pedido → Nota fiscal",
      "Tempo médio e mediano entre etapas",
      "Economia negociada (estimado × comprado)",
      "Filtros por período, centro de custo, categoria e status",
      "Detalhe do processo com itens e notas vinculadas",
    ],
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Recharts", "Tailwind CSS"],
    entities: ["Solicitações e itens", "Pedidos e itens", "Notas fiscais", "Fornecedores", "Produtos", "Centros de custo", "Usuários"],
    pipeline: ["Sistemas de origem", "Modelo relacional", "Views de processo", "Painel web"],
  },
  {
    slug: "faturamento",
    index: "02",
    name: "Faturamento",
    tagline: "Receita, ticket médio e devoluções com comparação automática entre períodos.",
    demoHref: "/demo/faturamento",
    problem:
      "É comum o fechamento do faturamento ser montado à mão em planilhas todo mês. Comparar períodos, regiões ou categorias exige retrabalho, e os números mudam conforme quem faz o relatório.",
    solution:
      "Um dashboard que lê as notas fiscais diretamente do banco, calcula faturamento líquido, ticket médio e devoluções, e compara cada recorte com o mesmo período do ano anterior.",
    outcome: [
      "Uma única fonte de verdade para receita, sem consolidação manual.",
      "Comparação ano contra ano em qualquer combinação de filtros.",
      "Concentração de clientes e devoluções monitoradas continuamente.",
    ],
    features: [
      "Faturamento líquido, bruto, notas e ticket médio",
      "Evolução mensal × ano anterior",
      "Análise por categoria, região e segmento",
      "Ranking de clientes, vendedores e produtos",
      "Taxa de devolução mensal",
    ],
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Recharts", "Tailwind CSS"],
    entities: ["Notas fiscais e itens", "Clientes", "Produtos e categorias", "Vendedores", "Regiões"],
    pipeline: ["Notas fiscais", "Fato de itens", "Agregações por período", "Dashboard"],
  },
  {
    slug: "legal-bi",
    index: "03",
    name: "Legal BI",
    tagline: "Carteira de processos, risco financeiro e prazos em um só painel.",
    demoHref: "/demo/juridico",
    problem:
      "Carteiras jurídicas costumam ser acompanhadas em planilhas mantidas por pessoas diferentes. Falta uma visão consolidada de valores em discussão, risco, prazos críticos e do resultado dos processos encerrados.",
    solution:
      "Um BI jurídico que organiza processos, movimentações e prazos, mostra a distribuição por área, tribunal e status, e destaca prazos vencidos ou próximos.",
    outcome: [
      "Valor em discussão e provisão visíveis por área e por grau de risco.",
      "Prazos críticos destacados antes do vencimento.",
      "Histórico de cada processo em uma linha do tempo de movimentações.",
    ],
    features: [
      "Processos ativos, encerrados e taxa de êxito",
      "Distribuição por status, área e tribunal",
      "Aging da carteira ativa",
      "Agenda de prazos (vencidos, 7 e 30 dias)",
      "Ficha do processo com movimentações",
    ],
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Recharts", "Tailwind CSS"],
    entities: ["Processos", "Movimentações", "Prazos", "Clientes", "Advogados", "Áreas", "Tribunais"],
    pipeline: ["Planilhas e sistemas", "Modelo relacional", "Views analíticas", "BI web"],
  },
];

const en: CaseStudy[] = [
  {
    slug: "remessa",
    index: "06",
    name: "Remessa · Spreadsheet delivery automation",
    tagline: "Every customer gets their own spreadsheet, on the right channel: PDF or Excel by e-mail and WhatsApp, in one click, with a log and retry of failures only.",
    demoHref: "/demo/remessa",
    problem:
      "Companies that send weekly price lists, reports or statements to dozens of customers do it all by hand: update the source sheet, check each customer's sheet, export PDF or Excel one by one and attach them to e-mails and chats. It takes hours every week, and the risk of sending the wrong prices to the wrong customer is high.",
    solution:
      "A one-click automation that, for each row of a CONTROL sheet, recalculates the workbook, builds the file in the customer's format, saves it in a weekly folder, sends it through the right channel (Outlook, SMTP or the official WhatsApp API) with a personalized message and records the result in the LOG sheet.",
    outcome: [
      "A batch of dozens of customers goes out in minutes, with a final summary: \"28 sent, 2 with errors (reason)\".",
      "Test mode: everything is built and validated, but sent only to the user to check before the real run.",
      "WhatsApp within Meta's rules: official Cloud API, approved template and opt-in recorded per customer.",
    ],
    features: [
      "CONTROL sheet validated before sending: adding a customer means filling in one row",
      "PDF of the print area, or an .xlsx with only the customer's sheet, converted to values",
      "E-mail via Outlook (COM) or SMTP, detecting the \"new Outlook\"",
      "WhatsApp Cloud API: file upload and a template with a document header",
      "Per-customer opt-in and opt-out; rows without opt-in are blocked and logged",
      "Errors never stop the batch; \"retry failures\" processes only what failed, with no duplicates",
      "Run from a button in the workbook, a .bat file or Windows Task Scheduler",
      "Runs with or without Excel installed; 26 tests (pytest + respx) and CI on GitHub Actions",
    ],
    stack: STACK_REMESSA,
    entitiesText: "Workbook sheets and files the automation reads and writes:",
    entities: ["ORIGEM (source)", "customer sheets", "CONTROLE (control)", "LOG", "config.yaml", ".env", "Envios/YYYY-Wxx/", "logs/*.jsonl"],
    pipeline: ["Excel workbook", "File per customer", "E-mail and WhatsApp", "LOG"],
    architecture: [
      { t: "Workbook", d: "Source sheet with prices, one sheet per customer pulling via formulas, the CONTROL sheet and the LOG sheet." },
      { t: "Reading and validation", d: "pydantic validates every CONTROL row (format, channel, recipient, opt-in) before any file is built." },
      { t: "File generation", d: "With Excel: xlwings recalculates (formulas and Power Query) and exports. Without Excel: openpyxl + formula evaluation + reportlab." },
      { t: "Channels", d: "A single Channel.send() interface: Outlook (pywin32), SMTP (smtplib) and WhatsApp Cloud API (httpx, Graph API)." },
      { t: "Log and retry", d: "Every send goes to the LOG sheet and to logs/YYYY-MM-DD.jsonl; the run ID prevents duplicate sends." },
      { t: "Operation", d: "Python package remessa with a CLI (typer + rich): remessa rodar | testar | reenviar-falhas | validar (run, test, retry failures, validate); credentials only in .env." },
    ],
  },
  {
    slug: "banco-360",
    index: "05",
    name: "Bank 360",
    tagline: "End-to-end banking lakehouse: ingestion, PySpark, data quality and a dimensional Data Warehouse.",
    demoHref: "/demo/banco",
    problem:
      "Banks keep customer, account, credit and transaction data in different systems — the core banking database, daily card and Pix files, external APIs. Without a reliable pipeline each team builds its own numbers by hand, and critical metrics such as delinquency and provisions lack traceability.",
    solution:
      "A daily pipeline that extracts three kinds of sources (PostgreSQL, CSV/JSON files and the real Central Bank API), organizes the lake into Bronze, Silver and Gold with PySpark, applies data quality and privacy rules, loads a star schema into the Data Warehouse and publishes the credit dashboard — with every run logged and auditable.",
    outcome: [
      "Delinquency, risk stages and provisions calculated reproducibly, reconciled across layers.",
      "62 data quality rules per run: the pipeline stops before publishing bad data.",
      "Tax IDs never leave Bronze: salted hash in Silver, no name, e-mail or birth date.",
    ],
    features: [
      "Ingestion from a relational database, CSV/JSON files and the Central Bank REST API",
      "PySpark jobs in AWS Glue format (Bronze → Silver → Gold, partitioned Parquet)",
      "Dimensional model: 2 facts, 5 dimensions and 5 marts",
      "Quality gates, quarantine and Bronze × Silver × Gold reconciliation",
      "Airflow orchestration (DAG) and daily runs on GitHub Actions",
      "Observability page with steps, volumes and the result of every rule",
    ],
    stack: ["Python", "PySpark", "SQL", "Apache Airflow", "Parquet", "PostgreSQL", "Supabase", "Docker", "Next.js"],
    entities: ["fato_transacao", "fato_posicao_contrato", "dim_cliente", "dim_conta", "dim_produto", "dim_canal", "dim_tempo", "mart_carteira_mensal", "mart_perfil_risco", "pipeline_execucoes", "dq_resultados"],
    pipeline: ["Core banking, files and API", "Bronze · Silver · Gold", "Data Warehouse", "Dashboard"],
    repoHref: REPO_BANCO,
    architecture: [
      { t: "Sources", d: "Core banking on PostgreSQL, daily card (CSV) and payment (JSON) files and the Central Bank SGS API." },
      { t: "Bronze", d: "Raw data partitioned by date, with a manifest (rows, bytes, SHA-256) for auditing." },
      { t: "Silver", d: "PySpark: typing, deduplication, quarantine of invalid records and tax ID anonymization (LGPD)." },
      { t: "Gold", d: "Star schema plus portfolio, risk, transaction, customer and macro marts." },
      { t: "Data Warehouse", d: "PostgreSQL (Supabase) via COPY, idempotent, with RLS and read-only public views." },
      { t: "Orchestration", d: "Airflow DAG and a daily GitHub Actions run; every step logged for observability." },
    ],
    awsMap: [
      { local: "Supabase Storage (S3 API)", aws: "Amazon S3", uso: "Data Lake: Bronze, Silver and Gold in Parquet" },
      { local: "PySpark jobs (Spark 3.5)", aws: "AWS Glue (Glue 5.0)", uso: "Distributed ETL between layers" },
      { local: "DuckDB over Parquet", aws: "Amazon Athena + Glue Data Catalog", uso: "SQL straight on lake files" },
      { local: "PostgreSQL (Supabase)", aws: "Amazon Redshift", uso: "Dimensional Data Warehouse" },
      { local: "Apache Airflow 2.10", aws: "Amazon MWAA", uso: "Orchestration and scheduling" },
      { local: "YAML rules + Spark", aws: "Glue Data Quality", uso: "Data quality gates" },
      { local: "Run log tables", aws: "Amazon CloudWatch", uso: "Monitoring and observability" },
      { local: "Salted hash + RLS", aws: "KMS + Lake Formation + IAM", uso: "Security and privacy (LGPD)" },
    ],
  },
  {
    slug: "compras-360",
    index: "01",
    name: "Purchasing Flow",
    tagline: "End-to-end visibility of the purchasing cycle: from purchase request to invoice.",
    demoHref: "/demo/compras",
    problem:
      "In many operations, nobody knows for sure which stage each purchase is at. Requests, orders and invoices live in separate screens and spreadsheets, and the question \"where is my purchase?\" turns into a chain of messages.",
    solution:
      "A dashboard that connects request, order and invoice in a single timeline, with metrics for volume, value, time between stages and alerts for late orders.",
    outcome: [
      "Anyone can find the status of a purchase in seconds, by number or supplier.",
      "Bottlenecks become visible: average time per stage and distribution of the full cycle.",
      "Late orders show up before they become a problem.",
    ],
    features: [
      "Request → Order → Invoice funnel",
      "Average and median time between stages",
      "Negotiated savings (estimated × purchased)",
      "Filters by period, cost center, category and status",
      "Process detail with items and linked invoices",
    ],
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Recharts", "Tailwind CSS"],
    entities: ["Requests and items", "Orders and items", "Invoices", "Suppliers", "Products", "Cost centers", "Users"],
    pipeline: ["Source systems", "Relational model", "Process views", "Web dashboard"],
  },
  {
    slug: "faturamento",
    index: "02",
    name: "Billing",
    tagline: "Revenue, average ticket and returns with automatic period-over-period comparison.",
    demoHref: "/demo/faturamento",
    problem:
      "Monthly revenue closing is often assembled by hand in spreadsheets. Comparing periods, regions or categories means rework, and the numbers change depending on who builds the report.",
    solution:
      "A dashboard that reads invoices straight from the database, calculates net revenue, average ticket and returns, and compares every slice with the same period of the previous year.",
    outcome: [
      "A single source of truth for revenue, with no manual consolidation.",
      "Year-over-year comparison for any combination of filters.",
      "Customer concentration and returns monitored continuously.",
    ],
    features: [
      "Net and gross revenue, invoices and average ticket",
      "Monthly trend × previous year",
      "Analysis by category, region and segment",
      "Customer, sales rep and product rankings",
      "Monthly return rate",
    ],
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Recharts", "Tailwind CSS"],
    entities: ["Invoices and items", "Customers", "Products and categories", "Sales reps", "Regions"],
    pipeline: ["Invoices", "Item fact table", "Period aggregations", "Dashboard"],
  },
  {
    slug: "legal-bi",
    index: "03",
    name: "Legal BI",
    tagline: "Case portfolio, financial risk and deadlines in a single dashboard.",
    demoHref: "/demo/juridico",
    problem:
      "Legal portfolios are often tracked in spreadsheets maintained by different people. There is no consolidated view of amounts in dispute, risk, critical deadlines and the outcome of closed cases.",
    solution:
      "A legal BI that organizes cases, activity and deadlines, shows the distribution by area, court and status, and highlights overdue or upcoming deadlines.",
    outcome: [
      "Amount in dispute and provisions visible by area and risk level.",
      "Critical deadlines highlighted before they expire.",
      "History of each case in an activity timeline.",
    ],
    features: [
      "Active and closed cases, and success rate",
      "Distribution by status, area and court",
      "Active portfolio aging",
      "Deadline calendar (overdue, 7 and 30 days)",
      "Case file with activity history",
    ],
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Recharts", "Tailwind CSS"],
    entities: ["Cases", "Activity", "Deadlines", "Clients", "Lawyers", "Areas", "Courts"],
    pipeline: ["Spreadsheets and systems", "Relational model", "Analytical views", "Web BI"],
  },
];

const cases: Record<Locale, CaseStudy[]> = { pt, en };

export const getCases = (lang: Locale) => cases[lang];
export const getCase = (lang: Locale, slug: string) => cases[lang].find((c) => c.slug === slug);
