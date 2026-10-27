import type { SamiDocument } from "./types";

/**
 * Base documental fictícia do Projeto Atlas, indexada pela recuperação (retrieval.ts).
 * Cada seção vira um trecho recuperável e citável como "<ID> §<n>".
 * Os identificadores citados nos textos existem em atlas.ts (verificado em tests/sami.test.ts).
 */
export const documents: SamiDocument[] = [
  {
    id: "REQ-001",
    type: "requirements",
    project: "ATLAS",
    title: { pt: "Requisitos do MVP de requisições de compra", en: "Purchase request MVP requirements" },
    date: "2026-08-06",
    author: "LP",
    related: ["T-01", "T-03", "T-07", "T-10", "T-12", "M1"],
    sections: [
      {
        heading: { pt: "Escopo", en: "Scope" },
        body: {
          pt: "O MVP substitui a planilha de requisições de compra. O solicitante cria a requisição com itens, centro de custo e justificativa, e acompanha o status até a geração do pedido no ERP.",
          en: "The MVP replaces the purchase request spreadsheet. The requester creates a request with items, cost center and justification, and follows its status until the purchase order is created in the ERP.",
        },
      },
      {
        heading: { pt: "Requisitos funcionais", en: "Functional requirements" },
        body: {
          pt: "RF-01: criar requisição com até 50 itens. RF-02: selecionar materiais do catálogo unificado. RF-03: aprovar conforme as regras de alçada por valor e centro de custo. RF-04: notificar o solicitante a cada mudança de status.",
          en: "FR-01: create a request with up to 50 items. FR-02: pick materials from the unified catalog. FR-03: approve according to authority rules by amount and cost center. FR-04: notify the requester on every status change.",
        },
      },
      {
        heading: { pt: "Requisitos não funcionais", en: "Non-functional requirements" },
        body: {
          pt: "RNF-01: tempo de resposta abaixo de 2 segundos nas telas principais. RNF-02: login pelo SSO corporativo. RNF-03: trilha de auditoria de todas as aprovações. RNF-04: disponibilidade em horário comercial com janela de manutenção noturna.",
          en: "NFR-01: response time under 2 seconds on the main screens. NFR-02: login through corporate SSO. NFR-03: audit trail for every approval. NFR-04: availability during business hours with a nightly maintenance window.",
        },
      },
      {
        heading: { pt: "Fora do escopo", en: "Out of scope" },
        body: {
          pt: "Cotação com fornecedores, contratos e pagamentos ficam fora do MVP. O treinamento dos usuários-chave acontece antes da Release 1.",
          en: "Supplier quotations, contracts and payments are out of the MVP. Key-user training happens before Release 1.",
        },
      },
    ],
  },
  {
    id: "ADR-001",
    type: "adr",
    project: "ATLAS",
    title: { pt: "ADR-001 — PostgreSQL como banco transacional", en: "ADR-001 — PostgreSQL as the transactional database" },
    date: "2026-07-22",
    author: "RN",
    related: ["D-01", "T-02", "T-04"],
    sections: [
      {
        heading: { pt: "Contexto", en: "Context" },
        body: {
          pt: "As requisições, itens e aprovações exigem consistência transacional e consultas relacionais para auditoria. A planilha atual não garante integridade entre requisição e aprovação.",
          en: "Requests, items and approvals need transactional consistency and relational queries for auditing. The current spreadsheet does not guarantee integrity between request and approval.",
        },
      },
      {
        heading: { pt: "Decisão", en: "Decision" },
        body: {
          pt: "Adotar PostgreSQL como banco transacional, com chaves estrangeiras, restrições de verificação e migrations versionadas no repositório.",
          en: "Adopt PostgreSQL as the transactional database, with foreign keys, check constraints and migrations versioned in the repository.",
        },
      },
      {
        heading: { pt: "Consequências", en: "Consequences" },
        body: {
          pt: "A equipe mantém um único modelo de dados para a API e para os relatórios. Consultas analíticas pesadas passam a usar views dedicadas para não competir com a operação.",
          en: "The team keeps a single data model for the API and the reports. Heavy analytical queries use dedicated views so they do not compete with operations.",
        },
      },
    ],
  },
  {
    id: "ADR-002",
    type: "adr",
    project: "ATLAS",
    title: { pt: "ADR-002 — Integração assíncrona com o ERP", en: "ADR-002 — Asynchronous ERP integration" },
    date: "2026-08-19",
    author: "BT",
    related: ["D-02", "T-05", "R-03", "INC-007"],
    sections: [
      {
        heading: { pt: "Contexto", en: "Context" },
        body: {
          pt: "A API do ERP tem limite de chamadas por minuto e instabilidade em horários de pico. Chamadas síncronas a partir da tela deixariam o usuário esperando e perderiam requisições em caso de falha.",
          en: "The ERP API has a per-minute call limit and is unstable at peak hours. Synchronous calls from the screen would keep the user waiting and lose requests on failure.",
        },
      },
      {
        heading: { pt: "Decisão", en: "Decision" },
        body: {
          pt: "A integração principal com o ERP usa uma fila de mensagens. Cada requisição aprovada gera uma mensagem idempotente com chave de correlação; um consumidor envia ao ERP com backoff exponencial e reprocessamento.",
          en: "The main ERP integration uses a message queue. Each approved request produces an idempotent message with a correlation key; a consumer sends it to the ERP with exponential backoff and retries.",
        },
      },
      {
        heading: { pt: "Consequências", en: "Consequences" },
        body: {
          pt: "O status do pedido passa a ser eventual: a tela mostra 'enviado ao ERP' até a confirmação. Mensagens com falha definitiva vão para uma fila de erros monitorada.",
          en: "Order status becomes eventually consistent: the screen shows 'sent to ERP' until confirmation. Messages that fail permanently go to a monitored dead-letter queue.",
        },
      },
    ],
  },
  {
    id: "ADR-003",
    type: "adr",
    project: "ATLAS",
    title: { pt: "ADR-003 — Autenticação por SSO corporativo", en: "ADR-003 — Corporate SSO authentication" },
    date: "2026-09-02",
    author: "HM",
    related: ["D-03"],
    sections: [
      {
        heading: { pt: "Contexto", en: "Context" },
        body: {
          pt: "Os aprovadores já possuem contas no diretório corporativo. Manter senhas próprias na aplicação criaria mais um cadastro a administrar e auditar.",
          en: "Approvers already have accounts in the corporate directory. Keeping separate passwords in the application would add one more registry to manage and audit.",
        },
      },
      {
        heading: { pt: "Decisão", en: "Decision" },
        body: {
          pt: "Autenticação por SSO com OpenID Connect. Os perfis de aprovação são derivados dos grupos do diretório e revisados trimestralmente.",
          en: "Authentication through SSO with OpenID Connect. Approval profiles are derived from directory groups and reviewed quarterly.",
        },
      },
    ],
  },
  {
    id: "ADR-004",
    type: "adr",
    project: "ATLAS",
    title: { pt: "ADR-004 — Testes ponta a ponta com Playwright", en: "ADR-004 — End-to-end testing with Playwright" },
    date: "2026-09-16",
    author: "OR",
    related: ["D-04", "T-09", "R-06"],
    sections: [
      {
        heading: { pt: "Contexto", en: "Context" },
        body: {
          pt: "Os testes manuais do fluxo de requisição levavam dois dias por entrega e dependiam de uma única pessoa de QA.",
          en: "Manual tests of the request flow took two days per delivery and depended on a single QA person.",
        },
      },
      {
        heading: { pt: "Decisão", en: "Decision" },
        body: {
          pt: "Automatizar os fluxos críticos com Playwright: criação de requisição, aprovação por alçada e envio ao ERP simulado. A suíte roda no pipeline a cada entrega.",
          en: "Automate the critical flows with Playwright: request creation, authority-based approval and submission to a simulated ERP. The suite runs in the pipeline on every delivery.",
        },
      },
      {
        heading: { pt: "Consequências", en: "Consequences" },
        body: {
          pt: "Os testes integrados do MVP (T-09) usam esta suíte. O conhecimento deixa de depender de uma pessoa, o que mitiga o risco R-06.",
          en: "The MVP integration tests (T-09) use this suite. Knowledge no longer depends on one person, which mitigates risk R-06.",
        },
      },
    ],
  },
  {
    id: "MTG-1014",
    type: "meeting",
    project: "ATLAS",
    title: { pt: "Ata da reunião de status — 14/10/2026", en: "Status meeting minutes — Oct 14, 2026" },
    date: "2026-10-14",
    author: "MC",
    related: ["T-05", "T-06", "T-08", "T-10", "T-14", "D-05", "D-06", "R-01", "R-04", "R-05"],
    sections: [
      {
        heading: { pt: "Participantes", en: "Attendees" },
        body: {
          pt: "Marina Couto, Rafael Nunes, Bianca Torres, Helena Moura, Lúcia Prado e Gabriel Faria.",
          en: "Marina Couto, Rafael Nunes, Bianca Torres, Helena Moura, Lúcia Prado and Gabriel Faria.",
        },
      },
      {
        heading: { pt: "Homologação do ERP", en: "ERP staging" },
        body: {
          pt: "O ambiente de homologação do ERP, previsto para 09/10, ainda não foi liberado pelo fornecedor. Sem ele, a integração principal está bloqueada e não há como executar os testes de ponta a ponta do conector. Helena escalou o tema ao fornecedor.",
          en: "The ERP staging environment, planned for Oct 9, has not been released by the vendor yet. Without it, the main integration is blocked and the connector's end-to-end tests cannot run. Helena escalated the issue to the vendor.",
        },
      },
      {
        heading: { pt: "Catálogo do Órion", en: "Orion catalog" },
        body: {
          pt: "A sincronização do catálogo de materiais aguarda a API do Projeto Órion. Diego informou nova previsão para a semana seguinte. Foi sugerida carga inicial por CSV como alternativa.",
          en: "The materials catalog synchronization is waiting for Project Orion's API. Diego reported a new estimate for the following week. An initial CSV load was suggested as an alternative.",
        },
      },
      {
        heading: { pt: "Decisões pendentes", en: "Pending decisions" },
        body: {
          pt: "Ficaram em aberto: o plano de contingência de liberar a Release 1 com a integração do ERP desligada por feature flag, a decidir até 23/10; e o escopo da migração histórica, 24 meses ou base completa, a decidir até 31/10.",
          en: "Left open: the contingency plan to ship Release 1 with the ERP integration turned off by a feature flag, to be decided by Oct 23; and the historical migration scope, 24 months or full history, to be decided by Oct 31.",
        },
      },
      {
        heading: { pt: "Encaminhamentos", en: "Action items" },
        body: {
          pt: "Lúcia confirma a agenda dos usuários-chave para o treinamento em duas turmas. Gabriel inicia o perfilamento dos dados históricos antes da decisão de escopo.",
          en: "Lúcia confirms key users' availability for training in two groups. Gabriel starts profiling the historical data ahead of the scope decision.",
        },
      },
    ],
  },
  {
    id: "INC-007",
    type: "incident",
    project: "ATLAS",
    title: { pt: "Incidente INC-007 — Timeouts na API do ERP no piloto", en: "Incident INC-007 — ERP API timeouts in the pilot" },
    date: "2026-09-25",
    author: "BT",
    related: ["T-05", "T-16", "R-03", "ADR-002"],
    sections: [
      {
        heading: { pt: "Resumo", en: "Summary" },
        body: {
          pt: "Durante o piloto do conector, 18% das chamadas ao ERP terminaram em timeout entre 10h e 11h. Nenhuma requisição foi perdida porque as mensagens permaneceram na fila.",
          en: "During the connector pilot, 18% of ERP calls timed out between 10 and 11 a.m. No request was lost because the messages stayed in the queue.",
        },
      },
      {
        heading: { pt: "Causa raiz", en: "Root cause" },
        body: {
          pt: "O consumidor enviava lotes sem respeitar o limite de 60 chamadas por minuto da API do ERP, que passou a rejeitar as conexões excedentes.",
          en: "The consumer sent batches without honoring the ERP API limit of 60 calls per minute, and the API began rejecting the extra connections.",
        },
      },
      {
        heading: { pt: "Ações", en: "Actions" },
        body: {
          pt: "Limitador de taxa no consumidor, backoff exponencial com jitter e alerta para a fila de erros. Os testes de carga da integração (T-16) devem validar o comportamento com volume de produção.",
          en: "Rate limiter in the consumer, exponential backoff with jitter and an alert on the dead-letter queue. The integration load tests (T-16) must validate the behavior at production volume.",
        },
      },
    ],
  },
  {
    id: "SCH-002",
    type: "schedule",
    project: "ATLAS",
    title: { pt: "Cronograma revisado — versão 2", en: "Revised schedule — version 2" },
    date: "2026-09-30",
    author: "MC",
    related: ["M2", "M3", "M4", "T-06", "T-11", "T-15"],
    sections: [
      {
        heading: { pt: "Marcos", en: "Milestones" },
        body: {
          pt: "Release 1 (MVP de requisições) em 30/10, Release 2 (pedidos e aprovações) em 27/11 e go-live em 18/12.",
          en: "Release 1 (requests MVP) on Oct 30, Release 2 (orders and approvals) on Nov 27 and go-live on Dec 18.",
        },
      },
      {
        heading: { pt: "Caminho crítico", en: "Critical path" },
        body: {
          pt: "O caminho crítico da Release 1 passa pela liberação da homologação do ERP, pela integração principal, pelos testes integrados e pela implantação. A folga total da Release 1 é de poucos dias.",
          en: "The Release 1 critical path goes through the ERP staging release, the main integration, integration testing and deployment. Release 1 has only a few days of total float.",
        },
      },
      {
        heading: { pt: "Premissas", en: "Assumptions" },
        body: {
          pt: "O cronograma considera dias corridos e assume a liberação da homologação do ERP até 09/10. Qualquer atraso nessa premissa consome a folga da Release 1.",
          en: "The schedule uses calendar days and assumes the ERP staging release by Oct 9. Any delay in that assumption consumes Release 1's float.",
        },
      },
    ],
  },
  {
    id: "TEC-003",
    type: "technical",
    project: "ATLAS",
    title: { pt: "Guia técnico do conector ERP", en: "ERP connector technical guide" },
    date: "2026-10-02",
    author: "BT",
    related: ["T-05", "T-13", "ADR-002"],
    sections: [
      {
        heading: { pt: "Visão geral", en: "Overview" },
        body: {
          pt: "O conector traduz requisições aprovadas em pedidos do ERP e devolve números de pedido e centros de custo validados. Ele roda como serviço independente da API de requisições.",
          en: "The connector turns approved requests into ERP purchase orders and returns order numbers and validated cost centers. It runs as a service independent from the request API.",
        },
      },
      {
        heading: { pt: "Fluxo de mensagens", en: "Message flow" },
        body: {
          pt: "API de requisições publica o evento 'requisição aprovada'; o conector consome, chama o ERP e publica 'pedido criado' ou 'pedido rejeitado'. O painel de acompanhamento de pedidos lê esses eventos.",
          en: "The request API publishes the 'request approved' event; the connector consumes it, calls the ERP and publishes 'order created' or 'order rejected'. The order tracking dashboard reads those events.",
        },
      },
      {
        heading: { pt: "Observabilidade", en: "Observability" },
        body: {
          pt: "Cada mensagem carrega uma chave de correlação registrada nos logs da API, do conector e do ERP. Métricas: tamanho da fila, latência de ponta a ponta e taxa de rejeição.",
          en: "Each message carries a correlation key logged by the API, the connector and the ERP. Metrics: queue depth, end-to-end latency and rejection rate.",
        },
      },
    ],
  },
  {
    id: "CHG-001",
    type: "changelog",
    project: "ATLAS",
    title: { pt: "Histórico de alterações do projeto", en: "Project change log" },
    date: "2026-10-16",
    author: "MC",
    related: ["M1", "R-06", "T-11", "SCH-002"],
    sections: [
      {
        heading: { pt: "Agosto", en: "August" },
        body: {
          pt: "07/08: marco de requisitos aprovados atingido. 27/08: modelo de dados de requisições concluído.",
          en: "Aug 7: requirements approved milestone reached. Aug 27: purchase request data model completed.",
        },
      },
      {
        heading: { pt: "Setembro", en: "September" },
        body: {
          pt: "15/09: regras de alçada concluídas com quatro dias de atraso. 30/09: cronograma revisado (versão 2). Risco R-06 mitigado com a automação dos testes.",
          en: "Sep 15: authority rules completed four days late. Sep 30: revised schedule (version 2). Risk R-06 mitigated by test automation.",
        },
      },
      {
        heading: { pt: "Outubro", en: "October" },
        body: {
          pt: "16/10: integração principal com o ERP passa ao status bloqueado. A janela de implantação da Release 1 permanece em 30/10.",
          en: "Oct 16: main ERP integration moves to blocked status. The Release 1 deployment window remains on Oct 30.",
        },
      },
    ],
  },
  {
    id: "ORI-001",
    type: "status",
    project: "ORION",
    title: { pt: "Relatório de status do Projeto Órion", en: "Project Orion status report" },
    date: "2026-10-13",
    author: "DS",
    related: ["O-01", "O-02", "T-08", "R-02", "MO1"],
    sections: [
      {
        heading: { pt: "Situação", en: "Status" },
        body: {
          pt: "A padronização dos códigos de materiais foi concluída em 10/09. A publicação da API do catálogo unificado atrasou por revisão das regras de unidade de medida.",
          en: "Material code standardization was completed on Sep 10. The unified catalog API release slipped because of a review of unit-of-measure rules.",
        },
      },
      {
        heading: { pt: "Impacto em outros projetos", en: "Impact on other projects" },
        body: {
          pt: "O Projeto Atlas depende da API para sincronizar o catálogo de materiais na tela de requisição. Até a publicação, o Atlas pode usar uma exportação CSV do catálogo.",
          en: "Project Atlas depends on the API to synchronize the materials catalog on the request form. Until the release, Atlas can use a CSV export of the catalog.",
        },
      },
    ],
  },
];

export const getDocument = (id: string) => documents.find((d) => d.id === id);
