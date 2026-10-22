import type { Locale } from "./config";

/**
 * Tradução dos valores que vêm do banco (status, categorias, produtos…) e dos
 * rótulos calculados nas análises. Os dados ficam sempre em português — inclusive
 * nos filtros da URL — e só a exibição é traduzida. Nomes de pessoas e empresas
 * (fictícios) não são traduzidos; valores sem tradução aparecem como estão.
 */
const EN: Record<string, string> = {
  // ---------- Compras: centros de custo ----------
  Manutenção: "Maintenance",
  Produção: "Production",
  Logística: "Logistics",
  Tecnologia: "Technology",
  Administrativo: "Administration",
  Comercial: "Sales",
  Qualidade: "Quality",
  Engenharia: "Engineering",
  Pessoas: "People",
  "Segurança do Trabalho": "Workplace Safety",

  // ---------- Compras: categorias ----------
  "Materiais elétricos": "Electrical supplies",
  EPI: "PPE",
  "TI e periféricos": "IT & peripherals",
  Escritório: "Office supplies",
  Embalagens: "Packaging",
  Ferramentas: "Tools",
  "Químicos e limpeza": "Chemicals & cleaning",
  "Peças mecânicas": "Mechanical parts",

  // ---------- Compras: status, prioridade, unidades ----------
  "Em aprovação": "Pending approval",
  Aprovada: "Approved",
  "Em pedido": "Ordered",
  Atendida: "Fulfilled",
  Reprovada: "Rejected",
  Cancelada: "Canceled",
  "Aguardando entrega": "Awaiting delivery",
  "Parcialmente recebido": "Partially received",
  Recebido: "Received",
  Cancelado: "Canceled",
  Normal: "Normal",
  Alta: "High",
  Urgente: "Urgent",
  UN: "pc",
  PAR: "pair",
  CX: "box",

  // ---------- Compras: rótulos das análises ----------
  "90 dias": "90 days",
  "6 meses": "6 months",
  "12 meses": "12 months",
  Tudo: "All",
  "Solicitação → Aprovação": "Request → Approval",
  "Aprovação → Pedido": "Approval → Order",
  "Pedido → Nota fiscal": "Order → Invoice",
  Solicitações: "Requests",
  Aprovadas: "Approved",
  "Com pedido": "With purchase order",
  "Com nota recebida": "Invoice received",
  Concluídas: "Completed",
  "até 15 d": "≤ 15 d",

  // ---------- Faturamento ----------
  Sudeste: "Southeast",
  Sul: "South",
  "Centro-Oeste": "Central-West",
  Nordeste: "Northeast",
  Norte: "North",
  Varejo: "Retail",
  Indústria: "Manufacturing",
  Distribuição: "Distribution",
  Construção: "Construction",
  Serviços: "Services",
  Agronegócio: "Agribusiness",
  Saúde: "Healthcare",
  Automação: "Automation",
  Iluminação: "Lighting",
  "Cabos e fios": "Cables & wires",
  "Proteção elétrica": "Electrical protection",
  Instrumentação: "Instrumentation",
  Climatização: "HVAC",
  Acessórios: "Accessories",
  Venda: "Sale",
  Devolução: "Return",
  "Mês atual": "This month",
  "Últimos 3 meses": "Last 3 months",
  "Ano atual": "Year to date",

  // ---------- Legal: áreas e objetos ----------
  Trabalhista: "Labor",
  Cível: "Civil",
  Consumidor: "Consumer",
  Tributário: "Tax",
  Empresarial: "Corporate",
  Ambiental: "Environmental",
  "Horas extras": "Overtime pay",
  "Verbas rescisórias": "Severance pay",
  "Adicional de insalubridade": "Hazard pay",
  "Equiparação salarial": "Pay equity",
  "Danos morais trabalhistas": "Workplace moral damages",
  "Indenização por danos materiais": "Property damage claim",
  Cobrança: "Debt collection",
  "Rescisão contratual": "Contract termination",
  "Obrigação de fazer": "Specific performance",
  "Responsabilidade civil": "Civil liability",
  "Vício do produto": "Product defect",
  "Cobrança indevida": "Undue charge",
  "Atraso na entrega": "Late delivery",
  "Negativação indevida": "Wrongful credit listing",
  "Compensação tributária": "Tax offset",
  "Anulação de auto de infração": "Annulment of tax assessment",
  "Exclusão de base de cálculo": "Tax base exclusion",
  "Repetição de indébito": "Tax refund claim",
  "Dissolução societária": "Partnership dissolution",
  "Execução de título": "Enforcement of debt instrument",
  "Recuperação de crédito": "Credit recovery",
  "Disputa contratual": "Contract dispute",
  Licenciamento: "Licensing",
  "Auto de infração ambiental": "Environmental violation notice",
  "Termo de ajustamento": "Conduct adjustment agreement",

  // ---------- Legal: status, fase, risco, resultado ----------
  "Em andamento": "In progress",
  "Aguardando audiência": "Awaiting hearing",
  "Aguardando julgamento": "Awaiting judgment",
  "Em recurso": "On appeal",
  "Em execução": "In enforcement",
  Suspenso: "Stayed",
  Encerrado: "Closed",
  Conhecimento: "Trial",
  Recursal: "Appeal",
  Execução: "Enforcement",
  Arquivado: "Archived",
  Provável: "Probable",
  Possível: "Possible",
  Remota: "Remote",
  Favorável: "Favorable",
  "Parcialmente favorável": "Partially favorable",
  Acordo: "Settlement",
  Desfavorável: "Unfavorable",

  // ---------- Legal: prazos e movimentações ----------
  Contestação: "Defense filing",
  Réplica: "Reply",
  Manifestação: "Brief",
  Recurso: "Appeal",
  Audiência: "Hearing",
  "Juntada de documentos": "Document filing",
  Contrarrazões: "Response to appeal",
  "Cumprimento de sentença": "Judgment enforcement",
  Pendente: "Pending",
  Cumprido: "Met",
  Citação: "Service of process",
  Petição: "Petition",
  Despacho: "Court order",
  Decisão: "Decision",
  Arquivamento: "Archiving",
  "Citação da parte contrária realizada": "Opposing party served",
  "Contestação apresentada": "Defense filed",
  "Audiência de conciliação realizada sem acordo": "Conciliation hearing held, no settlement",
  "Perícia técnica designada": "Technical expert examination ordered",
  "Sentença publicada": "Judgment published",
  "Recurso interposto": "Appeal filed",
  "Início do cumprimento de sentença": "Judgment enforcement started",
  "Processo suspenso por decisão judicial": "Case stayed by court order",
  "Acordo homologado judicialmente": "Settlement approved by the court",
  "Trânsito em julgado": "Judgment became final",
  "Autos arquivados definitivamente": "Case file permanently archived",
  "< 1 ano": "< 1 year",
  "1–2 anos": "1–2 years",
  "2–3 anos": "2–3 years",
  "3–5 anos": "3–5 years",
  "> 5 anos": "> 5 years",

  // ---------- Avisos do repositório ----------
  "Banco de dados indisponível no momento — exibindo a cópia local dos dados demonstrativos.":
    "Database currently unavailable — showing the local copy of the demo data.",
};

/** Termos com sentido diferente no contexto jurídico (ex.: "Distribuição" = ajuizamento). */
const LEGAL_EN: Record<string, string> = {
  Distribuição: "Filing",
};

/** Itens-base dos produtos (a descrição é "<item> <variação>"). */
const PRODUTOS_EN: Record<string, string> = {
  // Compras
  "Disjuntor bipolar": "Two-pole breaker",
  "Cabo flexível": "Flexible cable",
  "Contator tripolar": "Three-pole contactor",
  "Tomada industrial": "Industrial socket",
  "Relé térmico": "Thermal relay",
  "Eletroduto corrugado": "Corrugated conduit",
  "Luva nitrílica": "Nitrile gloves",
  "Óculos de proteção": "Safety glasses",
  "Protetor auricular": "Ear plugs",
  "Capacete classe B": "Class B hard hat",
  "Botina de segurança": "Safety boots",
  "Máscara PFF2": "PFF2 respirator",
  'Monitor 24"': '24" monitor',
  "Teclado USB": "USB keyboard",
  "Mouse óptico": "Optical mouse",
  "Memória RAM": "RAM module",
  Nobreak: "UPS",
  "Papel A4": "A4 paper",
  "Caneta esferográfica": "Ballpoint pen",
  "Pasta suspensa": "Hanging folder",
  Grampeador: "Stapler",
  "Bloco de notas": "Notepad",
  "Etiqueta adesiva": "Adhesive label",
  "Caixa de papelão": "Cardboard box",
  "Fita adesiva": "Adhesive tape",
  "Filme stretch": "Stretch film",
  "Saco plástico": "Plastic bag",
  "Palete PBR": "PBR pallet",
  Cantoneira: "Edge protector",
  "Chave combinada": "Combination wrench",
  "Alicate universal": "Combination pliers",
  "Furadeira de impacto": "Hammer drill",
  "Jogo de soquetes": "Socket set",
  Trena: "Tape measure",
  "Nível a laser": "Laser level",
  Desengraxante: "Degreaser",
  "Detergente neutro": "Neutral detergent",
  "Álcool 70%": "70% alcohol",
  "Lubrificante spray": "Spray lubricant",
  Desinfetante: "Disinfectant",
  "Pano de limpeza": "Cleaning cloth",
  Rolamento: "Bearing",
  "Correia em V": "V-belt",
  Retentor: "Oil seal",
  Mancal: "Bearing housing",
  Acoplamento: "Coupling",
  Engrenagem: "Gear",
  // Faturamento
  "Controlador lógico": "Logic controller",
  "Inversor de frequência": "Frequency inverter",
  "Sensor indutivo": "Inductive sensor",
  "Módulo de E/S": "I/O module",
  "Fonte chaveada": "Switching power supply",
  "Luminária LED": "LED luminaire",
  "Refletor LED": "LED floodlight",
  "Painel LED": "LED panel",
  "Lâmpada tubular": "Tube lamp",
  Arandela: "Wall sconce",
  "Cabo PP": "PP cable",
  "Cabo de rede": "Network cable",
  "Fio rígido": "Solid wire",
  "Cabo blindado": "Shielded cable",
  Cordoalha: "Braided strap",
  Parafusadeira: "Cordless screwdriver",
  Esmerilhadeira: "Angle grinder",
  "Kit de chaves": "Screwdriver kit",
  Multímetro: "Multimeter",
  "Alicate amperímetro": "Clamp meter",
  "Disjuntor DR": "RCD breaker",
  DPS: "Surge protector",
  "Quadro de distribuição": "Distribution board",
  "Fusível NH": "NH fuse",
  "Chave seccionadora": "Disconnect switch",
  "Transmissor de pressão": "Pressure transmitter",
  Termopar: "Thermocouple",
  "Medidor de vazão": "Flow meter",
  "Indicador digital": "Digital indicator",
  Manômetro: "Pressure gauge",
  "Exaustor axial": "Axial exhaust fan",
  "Ventilador industrial": "Industrial fan",
  Climatizador: "Evaporative cooler",
  "Cortina de ar": "Air curtain",
  Termostato: "Thermostat",
  Abraçadeira: "Cable clamp",
  "Prensa-cabo": "Cable gland",
  Canaleta: "Cable duct",
  "Etiqueta de identificação": "ID label",
};

/** Variações e linhas de produto (o que vem depois do item-base). */
const VARIACOES_EN: Record<string, string> = {
  P: "S",
  G: "L",
  GG: "XL",
  incolor: "clear",
  fumê: "tinted",
  básico: "basic",
  intermediário: "mid-range",
  avançado: "advanced",
  azul: "blue",
  preta: "black",
  "cx 500": "box of 500",
  "cx 50": "box of 50",
  "pct 100": "pack of 100",
  "pct 10": "pack of 10",
  reforçada: "heavy-duty",
  profissional: "professional",
  galão: "gallon",
  "2,5mm²": "2.5mm²",
  "Linha A": "Line A",
  "Linha B": "Line B",
  Compacto: "Compact",
};

const PRODUTOS_POR_TAMANHO = Object.keys(PRODUTOS_EN).sort((a, b) => b.length - a.length);

function produtoEn(descricao: string): string {
  const base = PRODUTOS_POR_TAMANHO.find((p) => descricao === p || descricao.startsWith(`${p} `));
  if (!base) return descricao;
  const resto = descricao.slice(base.length).trim();
  return resto ? `${PRODUTOS_EN[base]} ${VARIACOES_EN[resto] ?? resto}` : PRODUTOS_EN[base];
}

/** Traduz um valor de dado para o idioma exibido. */
export function translateValue(lang: Locale, value: string, context?: "legal"): string {
  if (lang === "pt") return value;
  if (context === "legal" && value in LEGAL_EN) return LEGAL_EN[value];
  if (value in EN) return EN[value];
  // "Processo distribuído — TJSP"
  if (value.startsWith("Processo distribuído — ")) return `Case filed — ${value.slice(23)}`;
  return value;
}

/** Traduz a descrição de um produto; aceita o formato "CÓDIGO · descrição". */
export function translateProduct(lang: Locale, value: string): string {
  if (lang === "pt") return value;
  const sep = value.indexOf(" · ");
  return sep >= 0 ? `${value.slice(0, sep + 3)}${produtoEn(value.slice(sep + 3))}` : produtoEn(value);
}

/** Nome por extenso dos tribunais. */
export function translateCourt(lang: Locale, nome: string): string {
  if (lang === "pt") return nome;
  const tj = nome.match(/^Tribunal de Justiça d[eoa] (.+)$/);
  if (tj) return `${tj[1]} State Court of Justice`;
  const reg = nome.match(/^Tribunal Regional (do Trabalho|Federal) da (\d+)ª Região$/);
  if (reg) return `Regional ${reg[1] === "Federal" ? "Federal Court" : "Labor Court"} — ${ordinal(Number(reg[2]))} Region`;
  return nome;
}

function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
}

/** Atalho: `const tv = valueTranslator(lang); tv("Aprovada")`. */
export const valueTranslator = (lang: Locale, context?: "legal") => (value: string) => translateValue(lang, value, context);
