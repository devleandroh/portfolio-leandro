/**
 * Conteúdo dos cases exibidos no portfólio.
 * Para adicionar um case novo, inclua um objeto aqui e crie a rota da
 * demonstração em src/app/demo/<slug>/ (ver README → "Como adicionar novos cases").
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
}

export const cases: CaseStudy[] = [
  {
    slug: "compras-360",
    index: "01",
    name: "Compras 360",
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
    name: "Dashboard de Faturamento",
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

export const getCase = (slug: string) => cases.find((c) => c.slug === slug);
