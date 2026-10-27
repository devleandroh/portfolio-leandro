/**
 * Textos do case S.A.M.I. (página, chat, painel e frases do motor de respostas).
 * Incluídos em dictionaries.ts como `sami`; o inglês precisa ter as mesmas chaves do português.
 */

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const diasPt = (n: number) => `${n} ${plural(n, "dia", "dias")}`;
const daysEn = (n: number) => `${n} ${plural(n, "day", "days")}`;

export const samiPt = {
  meta: {
    title: "S.A.M.I. — Symbiotic Artificial Machine Intelligence",
    description:
      "Case de Engenharia de IA: assistente que combina consultas estruturadas, recuperação documental com citações e orquestração de ferramentas. Demonstração funcional com dados fictícios.",
  },
  nav: "S.A.M.I.",
  home: {
    eyebrow: "Case em destaque · Engenharia de IA",
    title: "S.A.M.I. — assistente de IA com fontes verificáveis",
    text: "Projeto pessoal de assistente que integra conhecimento, gestão de projetos e automação. A demonstração pública responde perguntas sobre um projeto fictício com consultas estruturadas e recuperação documental, sempre citando a origem — e diz quando não há evidência.",
    points: ["Consultas determinísticas sobre tarefas, riscos e dependências", "RAG com BM25 e citações por trecho", "Arquitetura completa: Ollama, memória, Playwright e observabilidade"],
    cta: "Abrir o case S.A.M.I.",
  },
  hero: {
    eyebrow: "case / 04 · engenharia de IA",
    expanded: "Symbiotic Artificial Machine Intelligence",
    problem:
      "Conhecimento de projeto fica espalhado entre tarefas, atas, decisões e incidentes. Perguntas simples — o que está travando a entrega? onde essa decisão foi registrada? — exigem abrir vários sistemas, e assistentes genéricos respondem com confiança mesmo sem fonte.",
    value:
      "A S.A.M.I. é um assistente pessoal que separa o que é cálculo do que é linguagem: regras determinísticas respondem sobre os dados estruturados, a recuperação documental encontra e cita os trechos, e a camada generativa (na implementação completa) só sintetiza o que foi recuperado. Quando não há evidência, ela diz isso.",
    stackLabel: "Componentes",
    stack: ["Next.js", "TypeScript", "BM25", "Análise de caminho crítico", "Ollama (SAMI completa)", "Playwright (SAMI completa)", "Vitest"],
    notice: "Demonstração com dados 100% fictícios: o Projeto Atlas, as pessoas e os documentos foram criados para este case.",
    ctaDemo: "Fazer uma pergunta",
    ctaArch: "Ver arquitetura",
    allCases: "Todos os cases",
  },
  modes: {
    eyebrow: "O que roda aqui",
    label: "modo",
    title: "Três capacidades, separadas de propósito.",
    text: "A página pública não tem modelo generativo hospedado. Em vez de simular um, ela mostra o que um assistente confiável faz sem ele — e deixa claro o que pertence à implementação completa.",
    items: [
      {
        key: "A",
        title: "Consultas operacionais determinísticas",
        text: "Atrasos, bloqueios, causas-raiz, riscos, decisões e simulação de atraso calculados sobre os registros do projeto. Mesma pergunta, mesma resposta.",
      },
      {
        key: "B",
        title: "RAG demonstrativo",
        text: "Busca lexical BM25 sobre 11 documentos fictícios divididos em trechos. A resposta é extrativa: mostra as frases e as referências, sem síntese generativa.",
      },
      {
        key: "C",
        title: "Arquitetura da SAMI completa",
        text: "Orquestração, modelos locais via Ollama, memória, automação com Playwright e observabilidade — documentados no diagrama, não executados nesta página.",
      },
    ],
  },
  states: {
    live: "Executa nesta demo",
    partial: "Demonstrado parcialmente",
    documented: "Somente na SAMI completa",
  },
  chat: {
    eyebrow: "Demonstração",
    title: "Pergunte sobre o Projeto Atlas.",
    text: "Cada pergunta é enviada à API desta página, roteada por regras e respondida com consultas aos registros e/ou busca nos documentos. Veja o mecanismo, as fontes e o rastro de execução de cada resposta.",
    suggestionsLabel: "Sugestões",
    suggestions: [
      "Quais tarefas estão bloqueando o Projeto Atlas?",
      "Quais decisões arquiteturais foram tomadas e onde estão documentadas?",
      "Quais riscos ameaçam a próxima entrega?",
      "O que acontece se a integração principal atrasar cinco dias?",
      "O que sabemos sobre um assunto que não existe na documentação?",
    ],
    more: "Outras perguntas suportadas: tarefas atrasadas · o que concluir primeiro · tarefas da Bianca · detalhe da T-08 · situação do projeto · busca livre (ex.: limite de chamadas do ERP).",
    placeholder: "Ex.: quais tarefas estão atrasadas?",
    inputLabel: "Pergunta",
    send: "Perguntar",
    clear: "Limpar conversa",
    counter: (n: number, max: number) => `${n}/${max}`,
    empty: "Escolha uma sugestão ou escreva uma pergunta.",
    loading: "Consultando registros e documentos…",
    you: "Você",
    mechanism: {
      structured: "Consulta estruturada",
      retrieval: "Recuperação documental",
      hybrid: "Combinação de fontes",
      no_evidence: "Sem evidências suficientes",
      unsupported: "Pergunta não suportada",
    },
    intent: "intenção",
    sections: {
      records: "Registros consultados",
      passages: "Trechos que sustentam a resposta",
      limitations: "Limitações",
      trace: "Rastro de execução",
    },
    score: "BM25",
    coverage: "cobertura",
    matched: "termos",
    serverTime: (ms: string) => `motor: ${ms} ms`,
    roundTrip: (ms: string) => `ida e volta: ${ms} ms`,
    errors: {
      network: "Não foi possível falar com a API. Verifique a conexão e tente de novo.",
      timeout: "A API não respondeu a tempo. Tente de novo.",
      rateLimit: (s: number) => `Muitas perguntas em sequência. Aguarde ${s} s e tente de novo.`,
      invalid: "Pergunta inválida: use entre 2 e 300 caracteres.",
      server: "Erro interno ao processar a pergunta. Nada foi inventado: a resposta simplesmente não foi gerada.",
    },
    retry: "Tentar de novo",
  },
  panel: {
    eyebrow: "Painel do projeto",
    title: "Projeto Atlas — Modernização de Compras",
    text: "Os mesmos registros que o chat consulta. Cada referência nas respostas aponta para uma linha desta seção.",
    reference: (d: string) => `retrato do projeto em ${d}`,
    kpis: { tasks: "Tarefas", overdue: "Atrasadas", blocked: "Bloqueadas", criticalRisks: "Riscos críticos", pendingDecisions: "Decisões pendentes" },
    milestones: { title: "Marcos", due: "Prazo", projected: "Projeção", reached: (d: string) => `atingido em ${d}`, onTime: "no prazo", slack: (n: number) => `folga de ${diasPt(n)}`, late: (n: number) => `${diasPt(n)} de atraso` },
    tasks: { title: "Tarefas e dependências", id: "ID", task: "Tarefa", owner: "Responsável", status: "Status", priority: "Prioridade", due: "Prazo", forecast: "Fim projetado", slack: "Folga", deps: "Depende de", project: "Projeto" },
    risks: { title: "Riscos", level: "Severidade", score: "P × I", tasks: "Tarefas", mitigation: "Mitigação", mitigated: "mitigado" },
    decisions: { title: "Decisões", doc: "Registro" },
    documents: { title: "Base documental", text: "Documentos indexados pela recuperação. Abra um documento para ver os trechos citáveis." },
    projects: "Projetos",
    dependsOnOrion: "O Atlas depende do Projeto Órion (O-02) para o catálogo de materiais.",
    scrollHint: "Deslize a tabela para ver todas as colunas.",
  },
  arch: {
    eyebrow: "Arquitetura",
    title: "Da pergunta à resposta com fonte.",
    text: "A arquitetura da S.A.M.I. completa, com o que esta página executa de fato. Os componentes marcados como “somente na SAMI completa” fazem parte do produto, mas não rodam aqui: não há Ollama, memória persistente nem automação de navegador nesta demonstração.",
    layers: [
      {
        name: "Interface",
        nodes: [
          { name: "Chat e painel", state: "live", desc: "Página Next.js: perguntas, mecanismo usado, fontes clicáveis e rastro de execução." },
        ],
      },
      {
        name: "API e orquestração",
        nodes: [
          { name: "API de perguntas", state: "live", desc: "Route Handler com validação, limite de tamanho e limite de requisições por IP." },
          { name: "Roteador de intenções", state: "partial", desc: "Aqui: regras determinísticas e extração de entidades. Na SAMI completa: orquestração de ferramentas pelo modelo." },
        ],
      },
      {
        name: "Conhecimento",
        nodes: [
          { name: "Camada de projetos", state: "live", desc: "Tarefas, marcos, riscos e decisões; projeção de cronograma, folgas, causas-raiz e simulação de atraso." },
          { name: "Recuperação documental (RAG)", state: "partial", desc: "Aqui: BM25 lexical sobre trechos, com limiar de evidência. Recuperação semântica não roda nesta demo." },
          { name: "Memória e contexto", state: "documented", desc: "Organização de conhecimento entre projetos e conversas na implementação completa." },
        ],
      },
      {
        name: "Geração e ferramentas",
        nodes: [
          { name: "Modelo local via Ollama", state: "documented", desc: "Síntese de respostas a partir dos trechos recuperados, executada localmente. Opcional: a demo funciona sem ele." },
          { name: "Automação com Playwright", state: "documented", desc: "Ferramenta da SAMI completa para executar fluxos em navegador de forma controlada. Nenhum navegador é exposto nesta página." },
        ],
      },
      {
        name: "Qualidade",
        nodes: [
          { name: "Observabilidade e avaliação", state: "partial", desc: "Aqui: rastro por resposta e suíte de avaliação offline com métricas registradas. Monitoramento contínuo pertence à SAMI completa." },
        ],
      },
    ],
    flowTitle: "Fluxo nesta página",
    flow: [
      "Pergunta validada (2–300 caracteres, limite por IP)",
      "Roteador identifica intenção e entidades (tarefa, marco, pessoa, dias)",
      "Consulta estruturada e/ou BM25 nos trechos",
      "Limiar de evidência: sem cobertura mínima, não há resposta categórica",
      "Resposta montada a partir dos registros, com citações e rastro",
    ],
    fullTitle: "Na SAMI completa",
    full: [
      "Orquestrador escolhe ferramentas: consulta, busca, automação",
      "Trechos recuperados vão para um modelo local (Ollama)",
      "O modelo sintetiza apenas sobre as fontes, que continuam citadas",
      "Memória mantém contexto entre projetos e sessões",
      "Execuções registradas para avaliação e auditoria",
    ],
  },
  evidence: {
    eyebrow: "Evidências de engenharia",
    title: "Números medidos, não prometidos.",
    text: "Resultados da suíte de avaliação executada sobre o motor desta página. Rode de novo com npm run sami:eval; um teste automatizado falha se estes números ficarem desatualizados.",
    metrics: {
      questions: "Perguntas avaliadas",
      routing: "Mecanismo correto",
      recordRecall: "Registros esperados encontrados",
      recordPrecision: "Precisão dos registros citados",
      docRecall: "Documentos esperados citados",
      docPrecision: "Precisão das referências documentais",
      refusals: "Perguntas sem evidência recusadas",
      falseRefusals: "Recusas indevidas",
      validRefs: "Citações que apontam para registros existentes",
      latency: "Latência do motor (p50 / p95)",
    },
    of: (a: number, b: number) => `${a} de ${b}`,
    runAt: (d: string, env: string) => `Execução: ${d} · ${env}`,
    caveat:
      "Ressalva: o conjunto de avaliação foi escrito junto com o motor e mede regressão sobre este corpus, não generalização. A latência é do motor em Node.js, sem rede; o tempo real de cada pergunta aparece no rastro da resposta.",
  },
  limits: {
    title: "Limitações conhecidas",
    items: [
      "Busca lexical: sinônimos e paráfrases sem termos em comum não são recuperados.",
      "O roteador reconhece um conjunto definido de intenções; perguntas fora dele caem na busca documental.",
      "O cronograma usa dias corridos e não considera realocação de equipe.",
      "Respostas extrativas: não há síntese em linguagem natural sem um modelo generativo.",
      "O limite de requisições é por instância do servidor (melhor esforço), não global.",
    ],
  },
  docs: {
    back: "Voltar ao case S.A.M.I.",
    eyebrow: "Documento fictício",
    author: "Autor",
    date: "Data",
    related: "Registros relacionados",
    section: "Trecho",
    types: {
      requirements: "Requisitos",
      adr: "Decisão arquitetural",
      meeting: "Ata de reunião",
      incident: "Incidente",
      schedule: "Cronograma",
      technical: "Documentação técnica",
      changelog: "Histórico de alterações",
      status: "Relatório de status",
    },
  },
  engine: {
    status: { done: "concluída", in_progress: "em andamento", blocked: "bloqueada", todo: "não iniciada" },
    priority: { critical: "crítica", high: "alta", medium: "média", low: "baixa" },
    level: { critical: "crítico", high: "alto", medium: "médio", low: "baixo" },
    decisionStatus: { decided: "decidida", pending: "pendente" },
    trace: {
      route: "Roteamento",
      routeDetail: (intent: string, rule: string, ents: string[]) => `intenção ${intent} (regra ${rule})${ents.length ? ` · entidades: ${ents.join(", ")}` : ""}`,
      structured: "Consulta estruturada",
      structuredDetail: (n: number) => `${n} ${plural(n, "registro", "registros")} selecionados`,
      retrieval: "Recuperação BM25",
      retrievalDetail: (t: string[], cand: number, acc: number, req: number) =>
        `termos [${t.join(", ")}] · ${cand} trechos com pontuação · ${acc} aceitos (mínimo ${req} ${plural(req, "termo", "termos")} em comum)`,
      evidenceDetail: (docs: string[], n: number) => `busca restrita a ${docs.join(", ")} · ${n} ${plural(n, "trecho", "trechos")}`,
      compose: "Composição",
      composeDetail: (p: number, r: number, s: number) => `${p} itens · ${r} registros · ${s} trechos`,
    },
    common: {
      due: "prazo",
      decideBy: "decidir até",
      projected: "projeção",
      projectAtlas: "Projeto Atlas",
      daysLate: (n: number) => `${diasPt(n)} de atraso`,
      calendarDays: "Projeção em dias corridos a partir de 20/10/2026, seguindo as dependências registradas.",
      noSupportingPassage: "Nenhum trecho dos documentos associados confirmou parte da resposta; ela se apoia apenas nos registros estruturados.",
    },
    delay: {
      needTask: "Entendi uma pergunta sobre atraso, mas não identifiquei qual tarefa. Cite o ID ou o nome da tarefa.",
      examples: (list: string[]) => `Exemplos: ${list.join("; ")}.`,
      alreadyDone: (id: string, title: string, d: string) => `${id} (${title}) já foi concluída em ${d}; um atraso nela não altera o cronograma.`,
      noDays: (id: string, title: string, slack: number, finish: string) =>
        slack > 0
          ? `${id} (${title}) termina em ${finish} pela projeção e tem folga de ${diasPt(slack)}: atrasos de até ${diasPt(slack)} não mudam nenhum marco.`
          : slack === 0
            ? `${id} (${title}) termina em ${finish} pela projeção e não tem folga: qualquer atraso nela atrasa o marco.`
            : `${id} (${title}) termina em ${finish} pela projeção e já está ${diasPt(-slack)} além do fim permitido.`,
      successors: (ids: string[]) => (ids.length ? `Tarefas que seriam empurradas: ${ids.join(", ")}.` : "Nenhuma tarefa sucessora seria empurrada."),
      firstImpact: (id: string, title: string, d: number) => `A partir de ${diasPt(d)} de atraso, o marco ${id} (${title}) passa do prazo.`,
      askDays: "Informe a quantidade de dias (ex.: “se a T-05 atrasar 5 dias”) para simular as novas datas.",
      lead: (id: string, title: string, days: number, others: number, ms: string[]) =>
        `Se ${id} (${title}) atrasar ${diasPt(days)}, ${others ? `${others} ${plural(others, "tarefa sucessora é empurrada", "tarefas sucessoras são empurradas")}` : "nenhuma tarefa sucessora é empurrada"}${ms.length ? ` e ${plural(ms.length, "o marco", "os marcos")} ${ms.join(", ")} ${plural(ms.length, "estoura", "estouram")} o prazo` : " e nenhum marco estoura o prazo"}.`,
      shift: (id: string, title: string, before: string, after: string, n: number) => `${id} ${title}: fim ${before} → ${after} (+${diasPt(n)}).`,
      absorbed: (list: string) => `Absorvem o atraso pela folga (sem mudança de datas): ${list}.`,
      milestone: (id: string, title: string, due: string, before: string, after: string, slip: number) =>
        `Marco ${id} (${title}): projeção ${before} → ${after}; prazo ${due}${slip > 0 ? ` — ${diasPt(slip)} de atraso` : " — ainda dentro do prazo"}.`,
      noMilestone: "Nenhum marco tem a data projetada alterada.",
      noReplan: "A simulação não considera realocação de pessoas nem execução em paralelo além do que as dependências permitem.",
    },
    blockers: {
      lead: (n: number, scope: string) => `${n} ${plural(n, "tarefa está bloqueada", "tarefas estão bloqueadas")} afetando ${scope}.`,
      none: (scope: string) => `Nenhuma tarefa bloqueada afeta ${scope} nos registros atuais.`,
      item: (id: string, title: string, owner: string, waiting: string, reason: string) => `${id} ${title} (${owner}) aguarda ${waiting}. ${reason}`,
      root: (id: string, title: string, owner: string, due: string, late: number, cross: boolean) =>
        `Causa-raiz: ${id} ${title} (${owner}${cross ? ", outro projeto" : ""}), prazo ${due}${late ? `, ${diasPt(late)} de atraso` : ""}.`,
      impact: (n: number, list: string, ms: string) => (n ? `Trava adiante ${n} ${plural(n, "tarefa", "tarefas")} (${list}) e os marcos ${ms}.` : `Não trava outras tarefas; marco ${ms}.`),
      definition: "Bloqueada = status registrado como bloqueada. Causa-raiz = dependência aberta, atrasada ou bloqueada, que não depende de outra problemática.",
    },
    risks: {
      lead: (n: number, level: string, scope: string) => `${n} ${plural(n, "risco aberto", "riscos abertos")}${level ? ` (${level})` : ""} ${plural(n, "ameaça", "ameaçam")} ${scope}, do mais ao menos severo.`,
      none: (scope: string) => `Nenhum risco aberto com esse filtro ameaça ${scope}.`,
      item: (id: string, title: string, level: string, p: number, i: number, s: number, tasks: string, mit: string) =>
        `${id} ${title} — ${level} (P${p} × I${i} = ${s}); tarefas ${tasks}. Mitigação: ${mit}`,
      scale: "Severidade = probabilidade × impacto (1–5 cada): crítico ≥ 15, alto ≥ 10, médio ≥ 5. Um risco ameaça um marco quando alguma tarefa ligada a ele pertence ao marco.",
      mitigatedHidden: (n: number) => `${n} ${plural(n, "risco mitigado não aparece", "riscos mitigados não aparecem")} na lista.`,
    },
    decisions: {
      architecture: "arquiteturais",
      headingHint: "decisão",
      lead: (n: number, f: string) => `${n} ${plural(n, "decisão", "decisões")}${f ? ` (${f})` : ""} nos registros do projeto.`,
      none: (f: string) => `Nenhuma decisão${f ? ` (${f})` : ""} nos registros do projeto.`,
      decided: (id: string, title: string, d: string, owner: string, doc: string) => `${id} ${title} — decidida em ${d} por ${owner}; registrada em ${doc}.`,
      pending: (id: string, title: string, d: string, left: number, owner: string, doc: string) =>
        `${id} ${title} — pendente, decidir até ${d} (${left >= 0 ? `em ${diasPt(left)}` : `vencida há ${diasPt(-left)}`}); responsável ${owner}; discutida em ${doc}.`,
    },
    overdue: {
      lead: (n: number, ref: string) => `${n} ${plural(n, "tarefa aberta passou", "tarefas abertas passaram")} do prazo em ${ref}.`,
      none: (ref: string) => `Nenhuma tarefa aberta está com o prazo vencido em ${ref}.`,
      item: (id: string, title: string, owner: string, due: string, late: number, status: string, proj: string) =>
        `${id} ${title} (${owner}) — prazo ${due}, ${diasPt(late)} de atraso, ${status}; fim projetado ${proj}.`,
      definition: "Atrasada = não concluída e com prazo planejado anterior à data de referência.",
    },
    order: {
      lead: (n: number) => `Ordem sugerida para as próximas ${n} tarefas abertas:`,
      item: (i: number, id: string, title: string, slack: number, prio: string, m: string) =>
        `${i}. ${id} ${title} — ${slack < 0 ? `${diasPt(-slack)} além do permitido` : slack === 0 ? "sem folga" : `folga de ${diasPt(slack)}`}, prioridade ${prio}, marco ${m}.`,
      criterion: "Critério: respeita as dependências; entre as tarefas liberadas, vem primeiro a de menor folga e, no empate, a de maior prioridade.",
    },
    owner: {
      lead: (name: string, role: string, open: number, total: number) => `${name} (${role}) tem ${total} ${plural(total, "tarefa", "tarefas")} no registro, ${open} em aberto.`,
      item: (id: string, title: string, status: string, due: string) => `${id} ${title} — ${status}, prazo ${due}.`,
    },
    task: {
      lead: (id: string, title: string, m: string) => `${id} ${title} (marco ${m}).`,
      owner: (name: string, prio: string, status: string) => `Responsável: ${name} · prioridade ${prio} · ${status}.`,
      dates: (start: string, due: string, finish: string, done: boolean, slack: number) =>
        done
          ? `Planejada de ${start} a ${due}; concluída em ${finish}.`
          : `Planejada de ${start} a ${due}; fim projetado ${finish} (${slack < 0 ? `${diasPt(-slack)} além do permitido` : slack === 0 ? "sem folga" : `folga de ${diasPt(slack)}`}).`,
      blocked: (r: string) => `Bloqueio: ${r}`,
      deps: (s: string) => `Depende de: ${s}.`,
      dependents: (s: string) => `É pré-requisito de: ${s}.`,
      risks: (s: string) => `Riscos ligados: ${s}.`,
      docs: (s: string) => `Documentos: ${s}.`,
    },
    milestone: {
      lead: (n: number) => `Situação ${plural(n, "do marco", `dos ${n} marcos abertos`)}:`,
      reached: (id: string, title: string, d: string) => `O marco ${id} (${title}) foi atingido em ${d}.`,
      item: (id: string, title: string, due: string, proj: string, slip: number, open: number, critical: string) =>
        `${id} ${title}: prazo ${due}, projeção ${proj} (${slip > 0 ? `${diasPt(slip)} de atraso` : slip === 0 ? "sem folga" : `folga de ${diasPt(-slip)}`}); ${open} ${plural(open, "tarefa aberta", "tarefas abertas")}${critical ? `; sem folga: ${critical}` : ""}.`,
    },
    summary: {
      lead: (total: number, done: number, prog: number, blocked: number, todo: number) =>
        `O Projeto Atlas tem ${total} tarefas: ${done} concluídas, ${prog} em andamento, ${blocked} bloqueadas e ${todo} não iniciadas.`,
      overdue: (n: number) => `${n} ${plural(n, "tarefa está", "tarefas estão")} com prazo vencido.`,
      next: (id: string, title: string, due: string, proj: string, slip: number) =>
        `Próxima entrega: ${id} ${title}, prazo ${due}, projeção ${proj} (${slip > 0 ? `${diasPt(slip)} de atraso` : slip === 0 ? "sem folga" : `folga de ${diasPt(-slip)}`}).`,
      risks: (n: number) => `${n} ${plural(n, "risco crítico aberto", "riscos críticos abertos")}.`,
      decisions: (n: number) => `${n} ${plural(n, "decisão pendente", "decisões pendentes")}.`,
    },
    search: {
      lead: (n: number, docs: number) => `Encontrei ${n} ${plural(n, "trecho relevante", "trechos relevantes")} em ${docs} ${plural(docs, "documento", "documentos")}:`,
      quote: (s: string, ref: string) => `“${s}” — ${ref}`,
      noTerms: "A pergunta não cita nenhum assunto específico para buscar, então não há evidência a apresentar — e a SAMI não inventa uma resposta.",
      tryExamples: "Pergunte sobre algo concreto, por exemplo: “limite de chamadas do ERP”, “SSO” ou “carga por CSV”.",
      noEvidence: "Não encontrei evidências suficientes na base documental para responder a essa pergunta.",
      searched: (t: string) => `Termos buscados (após normalização): ${t}.`,
      closest: (ref: string, m: number, total: number, req: number) => `Candidato mais próximo: ${ref}, com ${m} de ${total} termos — abaixo do mínimo de ${req}. Foi descartado.`,
      nothingMatched: "Nenhum trecho contém esses termos.",
      lexicalLimit: "Busca lexical (BM25): sinônimos sem termos em comum não são encontrados.",
      corpusLimit: "A base contém apenas os 11 documentos fictícios do Projeto Atlas e do Projeto Órion.",
      extractive: "Resposta extrativa: as frases são citadas como estão nos documentos, sem síntese generativa.",
    },
  },
};

export type SamiDictionary = typeof samiPt;

export const samiEn: SamiDictionary = {
  meta: {
    title: "S.A.M.I. — Symbiotic Artificial Machine Intelligence",
    description:
      "AI Engineering case: an assistant that combines structured queries, document retrieval with citations and tool orchestration. Working demo with fictional data.",
  },
  nav: "S.A.M.I.",
  home: {
    eyebrow: "Featured case · AI Engineering",
    title: "S.A.M.I. — an AI assistant with verifiable sources",
    text: "Personal assistant project that brings together knowledge, project management and automation. The public demo answers questions about a fictional project using structured queries and document retrieval, always citing the source — and says so when there is no evidence.",
    points: ["Deterministic queries over tasks, risks and dependencies", "RAG with BM25 and passage-level citations", "Full architecture: Ollama, memory, Playwright and observability"],
    cta: "Open the S.A.M.I. case",
  },
  hero: {
    eyebrow: "case / 04 · AI engineering",
    expanded: "Symbiotic Artificial Machine Intelligence",
    problem:
      "Project knowledge is scattered across tasks, meeting minutes, decisions and incidents. Simple questions — what is holding up the release? where was this decision recorded? — require opening several systems, and generic assistants answer confidently even without a source.",
    value:
      "S.A.M.I. is a personal assistant that separates computation from language: deterministic rules answer over structured data, document retrieval finds and cites the passages, and the generative layer (in the full implementation) only synthesizes what was retrieved. When there is no evidence, it says so.",
    stackLabel: "Components",
    stack: ["Next.js", "TypeScript", "BM25", "Critical path analysis", "Ollama (full SAMI)", "Playwright (full SAMI)", "Vitest"],
    notice: "Demo with 100% fictional data: Project Atlas, its people and documents were created for this case.",
    ctaDemo: "Ask a question",
    ctaArch: "See the architecture",
    allCases: "All cases",
  },
  modes: {
    eyebrow: "What runs here",
    label: "mode",
    title: "Three capabilities, separated on purpose.",
    text: "The public page has no hosted generative model. Instead of faking one, it shows what a trustworthy assistant does without it — and makes clear what belongs to the full implementation.",
    items: [
      {
        key: "A",
        title: "Deterministic operational queries",
        text: "Delays, blockers, root causes, risks, decisions and delay simulation computed over the project records. Same question, same answer.",
      },
      {
        key: "B",
        title: "Demo RAG",
        text: "BM25 lexical search over 11 fictional documents split into passages. Answers are extractive: they show the sentences and references, with no generative synthesis.",
      },
      {
        key: "C",
        title: "Full SAMI architecture",
        text: "Orchestration, local models through Ollama, memory, Playwright automation and observability — documented in the diagram, not executed on this page.",
      },
    ],
  },
  states: {
    live: "Runs in this demo",
    partial: "Partially demonstrated",
    documented: "Full SAMI only",
  },
  chat: {
    eyebrow: "Demo",
    title: "Ask about Project Atlas.",
    text: "Each question is sent to this page's API, routed by rules and answered by querying the records and/or searching the documents. See the mechanism, the sources and the execution trace of every answer.",
    suggestionsLabel: "Suggestions",
    suggestions: [
      "Which tasks are blocking Project Atlas?",
      "Which architecture decisions were made and where are they documented?",
      "Which risks threaten the next delivery?",
      "What happens if the main integration is delayed by five days?",
      "What do we know about a subject that does not exist in the documentation?",
    ],
    more: "Other supported questions: overdue tasks · what to finish first · Bianca's tasks · details of T-08 · project status · free search (e.g. ERP rate limit).",
    placeholder: "E.g. which tasks are overdue?",
    inputLabel: "Question",
    send: "Ask",
    clear: "Clear conversation",
    counter: (n: number, max: number) => `${n}/${max}`,
    empty: "Pick a suggestion or type a question.",
    loading: "Querying records and documents…",
    you: "You",
    mechanism: {
      structured: "Structured query",
      retrieval: "Document retrieval",
      hybrid: "Combined sources",
      no_evidence: "Not enough evidence",
      unsupported: "Unsupported question",
    },
    intent: "intent",
    sections: {
      records: "Records consulted",
      passages: "Passages supporting the answer",
      limitations: "Limitations",
      trace: "Execution trace",
    },
    score: "BM25",
    coverage: "coverage",
    matched: "terms",
    serverTime: (ms: string) => `engine: ${ms} ms`,
    roundTrip: (ms: string) => `round trip: ${ms} ms`,
    errors: {
      network: "Could not reach the API. Check your connection and try again.",
      timeout: "The API did not respond in time. Try again.",
      rateLimit: (s: number) => `Too many questions in a row. Wait ${s} s and try again.`,
      invalid: "Invalid question: use between 2 and 300 characters.",
      server: "Internal error while processing the question. Nothing was made up: the answer simply was not produced.",
    },
    retry: "Try again",
  },
  panel: {
    eyebrow: "Project dashboard",
    title: "Project Atlas — Procurement Modernization",
    text: "The same records the chat queries. Every reference in the answers points to a row in this section.",
    reference: (d: string) => `project snapshot as of ${d}`,
    kpis: { tasks: "Tasks", overdue: "Overdue", blocked: "Blocked", criticalRisks: "Critical risks", pendingDecisions: "Pending decisions" },
    milestones: { title: "Milestones", due: "Due", projected: "Projected", reached: (d: string) => `reached on ${d}`, onTime: "on time", slack: (n: number) => `${daysEn(n)} of float`, late: (n: number) => `${daysEn(n)} late` },
    tasks: { title: "Tasks and dependencies", id: "ID", task: "Task", owner: "Owner", status: "Status", priority: "Priority", due: "Due", forecast: "Projected end", slack: "Float", deps: "Depends on", project: "Project" },
    risks: { title: "Risks", level: "Severity", score: "P × I", tasks: "Tasks", mitigation: "Mitigation", mitigated: "mitigated" },
    decisions: { title: "Decisions", doc: "Record" },
    documents: { title: "Document base", text: "Documents indexed by retrieval. Open a document to see its citable passages." },
    projects: "Projects",
    dependsOnOrion: "Atlas depends on Project Orion (O-02) for the materials catalog.",
    scrollHint: "Scroll the table to see every column.",
  },
  arch: {
    eyebrow: "Architecture",
    title: "From question to sourced answer.",
    text: "The full S.A.M.I. architecture, with what this page actually runs. Components marked “full SAMI only” are part of the product but do not run here: there is no Ollama, persistent memory or browser automation in this demo.",
    layers: [
      {
        name: "Interface",
        nodes: [{ name: "Chat and dashboard", state: "live", desc: "Next.js page: questions, mechanism used, clickable sources and execution trace." }],
      },
      {
        name: "API and orchestration",
        nodes: [
          { name: "Question API", state: "live", desc: "Route Handler with validation, size limit and per-IP rate limiting." },
          { name: "Intent router", state: "partial", desc: "Here: deterministic rules and entity extraction. In the full SAMI: tool orchestration by the model." },
        ],
      },
      {
        name: "Knowledge",
        nodes: [
          { name: "Project layer", state: "live", desc: "Tasks, milestones, risks and decisions; schedule projection, float, root causes and delay simulation." },
          { name: "Document retrieval (RAG)", state: "partial", desc: "Here: lexical BM25 over passages, with an evidence threshold. Semantic retrieval does not run in this demo." },
          { name: "Memory and context", state: "documented", desc: "Knowledge organized across projects and conversations in the full implementation." },
        ],
      },
      {
        name: "Generation and tools",
        nodes: [
          { name: "Local model via Ollama", state: "documented", desc: "Answer synthesis from retrieved passages, run locally. Optional: the demo works without it." },
          { name: "Playwright automation", state: "documented", desc: "Full SAMI tool to run browser flows in a controlled way. No browser is exposed on this page." },
        ],
      },
      {
        name: "Quality",
        nodes: [
          { name: "Observability and evaluation", state: "partial", desc: "Here: per-answer trace and an offline evaluation suite with recorded metrics. Continuous monitoring belongs to the full SAMI." },
        ],
      },
    ],
    flowTitle: "Flow on this page",
    flow: [
      "Question validated (2–300 characters, per-IP limit)",
      "Router identifies intent and entities (task, milestone, person, days)",
      "Structured query and/or BM25 over passages",
      "Evidence threshold: without minimum coverage there is no categorical answer",
      "Answer built from the records, with citations and trace",
    ],
    fullTitle: "In the full SAMI",
    full: [
      "Orchestrator picks tools: query, search, automation",
      "Retrieved passages go to a local model (Ollama)",
      "The model synthesizes only over the sources, which stay cited",
      "Memory keeps context across projects and sessions",
      "Runs are logged for evaluation and auditing",
    ],
  },
  evidence: {
    eyebrow: "Engineering evidence",
    title: "Measured numbers, not promises.",
    text: "Results of the evaluation suite run against this page's engine. Run it again with npm run sami:eval; an automated test fails if these numbers become stale.",
    metrics: {
      questions: "Questions evaluated",
      routing: "Correct mechanism",
      recordRecall: "Expected records found",
      recordPrecision: "Precision of cited records",
      docRecall: "Expected documents cited",
      docPrecision: "Precision of document references",
      refusals: "No-evidence questions refused",
      falseRefusals: "Wrong refusals",
      validRefs: "Citations pointing to existing records",
      latency: "Engine latency (p50 / p95)",
    },
    of: (a: number, b: number) => `${a} of ${b}`,
    runAt: (d: string, env: string) => `Run: ${d} · ${env}`,
    caveat:
      "Caveat: the evaluation set was written alongside the engine and measures regression on this corpus, not generalization. Latency is the engine's in Node.js, without network; each question's real time appears in its answer trace.",
  },
  limits: {
    title: "Known limitations",
    items: [
      "Lexical search: synonyms and paraphrases with no shared terms are not retrieved.",
      "The router recognizes a defined set of intents; anything else falls back to document search.",
      "The schedule uses calendar days and does not consider reassigning people.",
      "Extractive answers: there is no natural-language synthesis without a generative model.",
      "Rate limiting is per server instance (best effort), not global.",
    ],
  },
  docs: {
    back: "Back to the S.A.M.I. case",
    eyebrow: "Fictional document",
    author: "Author",
    date: "Date",
    related: "Related records",
    section: "Passage",
    types: {
      requirements: "Requirements",
      adr: "Architecture decision",
      meeting: "Meeting minutes",
      incident: "Incident",
      schedule: "Schedule",
      technical: "Technical documentation",
      changelog: "Change log",
      status: "Status report",
    },
  },
  engine: {
    status: { done: "done", in_progress: "in progress", blocked: "blocked", todo: "not started" },
    priority: { critical: "critical", high: "high", medium: "medium", low: "low" },
    level: { critical: "critical", high: "high", medium: "medium", low: "low" },
    decisionStatus: { decided: "decided", pending: "pending" },
    trace: {
      route: "Routing",
      routeDetail: (intent: string, rule: string, ents: string[]) => `intent ${intent} (rule ${rule})${ents.length ? ` · entities: ${ents.join(", ")}` : ""}`,
      structured: "Structured query",
      structuredDetail: (n: number) => `${n} ${plural(n, "record", "records")} selected`,
      retrieval: "BM25 retrieval",
      retrievalDetail: (t: string[], cand: number, acc: number, req: number) =>
        `terms [${t.join(", ")}] · ${cand} scored passages · ${acc} accepted (at least ${req} shared ${plural(req, "term", "terms")})`,
      evidenceDetail: (docs: string[], n: number) => `search restricted to ${docs.join(", ")} · ${n} ${plural(n, "passage", "passages")}`,
      compose: "Composition",
      composeDetail: (p: number, r: number, s: number) => `${p} items · ${r} records · ${s} passages`,
    },
    common: {
      due: "due",
      decideBy: "decide by",
      projected: "projected",
      projectAtlas: "Project Atlas",
      daysLate: (n: number) => `${daysEn(n)} late`,
      calendarDays: "Projection in calendar days from Oct 20, 2026, following the recorded dependencies.",
      noSupportingPassage: "No passage in the linked documents confirmed part of the answer; it relies only on the structured records.",
    },
    delay: {
      needTask: "I understood a question about a delay, but could not tell which task. Mention the task ID or name.",
      examples: (list: string[]) => `Examples: ${list.join("; ")}.`,
      alreadyDone: (id: string, title: string, d: string) => `${id} (${title}) was completed on ${d}; a delay there does not change the schedule.`,
      noDays: (id: string, title: string, slack: number, finish: string) =>
        slack > 0
          ? `${id} (${title}) is projected to finish on ${finish} and has ${daysEn(slack)} of float: delays of up to ${daysEn(slack)} do not move any milestone.`
          : slack === 0
            ? `${id} (${title}) is projected to finish on ${finish} and has no float: any delay there delays the milestone.`
            : `${id} (${title}) is projected to finish on ${finish} and is already ${daysEn(-slack)} past its latest allowed finish.`,
      successors: (ids: string[]) => (ids.length ? `Tasks that would be pushed: ${ids.join(", ")}.` : "No successor task would be pushed."),
      firstImpact: (id: string, title: string, d: number) => `From ${daysEn(d)} of delay, milestone ${id} (${title}) misses its due date.`,
      askDays: "Give a number of days (e.g. “if T-05 is delayed by 5 days”) to simulate the new dates.",
      lead: (id: string, title: string, days: number, others: number, ms: string[]) =>
        `If ${id} (${title}) slips ${daysEn(days)}, ${others ? `${others} successor ${plural(others, "task is", "tasks are")} pushed` : "no successor task is pushed"}${ms.length ? ` and ${plural(ms.length, "milestone", "milestones")} ${ms.join(", ")} ${plural(ms.length, "misses its", "miss their")} due date` : " and no milestone misses its due date"}.`,
      shift: (id: string, title: string, before: string, after: string, n: number) => `${id} ${title}: end ${before} → ${after} (+${daysEn(n)}).`,
      absorbed: (list: string) => `Absorb the delay through float (no date change): ${list}.`,
      milestone: (id: string, title: string, due: string, before: string, after: string, slip: number) =>
        `Milestone ${id} (${title}): projection ${before} → ${after}; due ${due}${slip > 0 ? ` — ${daysEn(slip)} late` : " — still on time"}.`,
      noMilestone: "No milestone has its projected date changed.",
      noReplan: "The simulation does not consider reassigning people or parallel work beyond what the dependencies allow.",
    },
    blockers: {
      lead: (n: number, scope: string) => `${n} ${plural(n, "task is", "tasks are")} blocked, affecting ${scope}.`,
      none: (scope: string) => `No blocked task affects ${scope} in the current records.`,
      item: (id: string, title: string, owner: string, waiting: string, reason: string) => `${id} ${title} (${owner}) is waiting on ${waiting}. ${reason}`,
      root: (id: string, title: string, owner: string, due: string, late: number, cross: boolean) =>
        `Root cause: ${id} ${title} (${owner}${cross ? ", another project" : ""}), due ${due}${late ? `, ${daysEn(late)} late` : ""}.`,
      impact: (n: number, list: string, ms: string) => (n ? `Holds up ${n} downstream ${plural(n, "task", "tasks")} (${list}) and milestones ${ms}.` : `Does not hold up other tasks; milestone ${ms}.`),
      definition: "Blocked = status recorded as blocked. Root cause = an open dependency, overdue or blocked, that does not depend on another problematic task.",
    },
    risks: {
      lead: (n: number, level: string, scope: string) => `${n} open ${plural(n, "risk", "risks")}${level ? ` (${level})` : ""} ${plural(n, "threatens", "threaten")} ${scope}, from most to least severe.`,
      none: (scope: string) => `No open risk matching this filter threatens ${scope}.`,
      item: (id: string, title: string, level: string, p: number, i: number, s: number, tasks: string, mit: string) =>
        `${id} ${title} — ${level} (P${p} × I${i} = ${s}); tasks ${tasks}. Mitigation: ${mit}`,
      scale: "Severity = probability × impact (1–5 each): critical ≥ 15, high ≥ 10, medium ≥ 5. A risk threatens a milestone when one of its tasks belongs to that milestone.",
      mitigatedHidden: (n: number) => `${n} mitigated ${plural(n, "risk is", "risks are")} not listed.`,
    },
    decisions: {
      architecture: "architecture",
      headingHint: "decision",
      lead: (n: number, f: string) => `${n} ${plural(n, "decision", "decisions")}${f ? ` (${f})` : ""} in the project records.`,
      none: (f: string) => `No decision${f ? ` (${f})` : ""} in the project records.`,
      decided: (id: string, title: string, d: string, owner: string, doc: string) => `${id} ${title} — decided on ${d} by ${owner}; recorded in ${doc}.`,
      pending: (id: string, title: string, d: string, left: number, owner: string, doc: string) =>
        `${id} ${title} — pending, decide by ${d} (${left >= 0 ? `in ${daysEn(left)}` : `${daysEn(-left)} overdue`}); owner ${owner}; discussed in ${doc}.`,
    },
    overdue: {
      lead: (n: number, ref: string) => `${n} open ${plural(n, "task is", "tasks are")} past due as of ${ref}.`,
      none: (ref: string) => `No open task is past due as of ${ref}.`,
      item: (id: string, title: string, owner: string, due: string, late: number, status: string, proj: string) =>
        `${id} ${title} (${owner}) — due ${due}, ${daysEn(late)} late, ${status}; projected end ${proj}.`,
      definition: "Overdue = not done and with a planned due date before the reference date.",
    },
    order: {
      lead: (n: number) => `Suggested order for the next ${n} open tasks:`,
      item: (i: number, id: string, title: string, slack: number, prio: string, m: string) =>
        `${i}. ${id} ${title} — ${slack < 0 ? `${daysEn(-slack)} past the allowed finish` : slack === 0 ? "no float" : `${daysEn(slack)} of float`}, ${prio} priority, milestone ${m}.`,
      criterion: "Criterion: dependencies are respected; among unblocked tasks, the one with the least float comes first, then the highest priority.",
    },
    owner: {
      lead: (name: string, role: string, open: number, total: number) => `${name} (${role}) has ${total} ${plural(total, "task", "tasks")} on record, ${open} open.`,
      item: (id: string, title: string, status: string, due: string) => `${id} ${title} — ${status}, due ${due}.`,
    },
    task: {
      lead: (id: string, title: string, m: string) => `${id} ${title} (milestone ${m}).`,
      owner: (name: string, prio: string, status: string) => `Owner: ${name} · ${prio} priority · ${status}.`,
      dates: (start: string, due: string, finish: string, done: boolean, slack: number) =>
        done
          ? `Planned from ${start} to ${due}; completed on ${finish}.`
          : `Planned from ${start} to ${due}; projected end ${finish} (${slack < 0 ? `${daysEn(-slack)} past the allowed finish` : slack === 0 ? "no float" : `${daysEn(slack)} of float`}).`,
      blocked: (r: string) => `Blocker: ${r}`,
      deps: (s: string) => `Depends on: ${s}.`,
      dependents: (s: string) => `Prerequisite for: ${s}.`,
      risks: (s: string) => `Linked risks: ${s}.`,
      docs: (s: string) => `Documents: ${s}.`,
    },
    milestone: {
      lead: (n: number) => `Status of ${plural(n, "the milestone", `the ${n} open milestones`)}:`,
      reached: (id: string, title: string, d: string) => `Milestone ${id} (${title}) was reached on ${d}.`,
      item: (id: string, title: string, due: string, proj: string, slip: number, open: number, critical: string) =>
        `${id} ${title}: due ${due}, projected ${proj} (${slip > 0 ? `${daysEn(slip)} late` : slip === 0 ? "no float" : `${daysEn(-slip)} of float`}); ${open} open ${plural(open, "task", "tasks")}${critical ? `; no float: ${critical}` : ""}.`,
    },
    summary: {
      lead: (total: number, done: number, prog: number, blocked: number, todo: number) =>
        `Project Atlas has ${total} tasks: ${done} done, ${prog} in progress, ${blocked} blocked and ${todo} not started.`,
      overdue: (n: number) => `${n} ${plural(n, "task is", "tasks are")} past due.`,
      next: (id: string, title: string, due: string, proj: string, slip: number) =>
        `Next delivery: ${id} ${title}, due ${due}, projected ${proj} (${slip > 0 ? `${daysEn(slip)} late` : slip === 0 ? "no float" : `${daysEn(-slip)} of float`}).`,
      risks: (n: number) => `${n} open critical ${plural(n, "risk", "risks")}.`,
      decisions: (n: number) => `${n} pending ${plural(n, "decision", "decisions")}.`,
    },
    search: {
      lead: (n: number, docs: number) => `I found ${n} relevant ${plural(n, "passage", "passages")} in ${docs} ${plural(docs, "document", "documents")}:`,
      quote: (s: string, ref: string) => `“${s}” — ${ref}`,
      noTerms: "The question does not name any specific subject to search for, so there is no evidence to show — and SAMI does not make up an answer.",
      tryExamples: "Ask about something concrete, for example: “ERP rate limit”, “SSO” or “CSV load”.",
      noEvidence: "I did not find enough evidence in the document base to answer this question.",
      searched: (t: string) => `Terms searched (after normalization): ${t}.`,
      closest: (ref: string, m: number, total: number, req: number) => `Closest candidate: ${ref}, with ${m} of ${total} terms — below the minimum of ${req}. It was discarded.`,
      nothingMatched: "No passage contains these terms.",
      lexicalLimit: "Lexical search (BM25): synonyms with no shared terms are not found.",
      corpusLimit: "The base contains only the 11 fictional documents of Project Atlas and Project Orion.",
      extractive: "Extractive answer: sentences are quoted as they appear in the documents, with no generative synthesis.",
    },
  },
};
