# Portfólio — Engenharia de Dados, BI e Automação

Portfólio técnico pessoal com **três demonstrações funcionais** de aplicações orientadas a dados:

| Case | Demo | O que mostra |
|---|---|---|
| **Compras 360** | `/demo/compras` | Ciclo Solicitação → Pedido → Nota fiscal, tempos entre etapas, funil, atrasos e detalhe do processo |
| **Dashboard de Faturamento** | `/demo/faturamento` | Faturamento líquido, ticket médio, devoluções, comparação ano contra ano, rankings |
| **Legal BI** | `/demo/juridico` | Carteira de processos, risco, valores, tribunais, aging, agenda de prazos e ficha do processo |

> **Todos os dados são 100% sintéticos**, gerados por um algoritmo determinístico deste repositório.
> Nomes de pessoas e empresas são combinações aleatórias; qualquer semelhança com a realidade é coincidência.

---

## Arquitetura

```
GitHub ──► Vercel ──► Next.js (App Router, servidor) ──► Supabase (API REST) ──► PostgreSQL
                              │
                              └── sem Supabase configurado: gerador sintético em memória
```

- **Banco**: um schema por domínio (`compras`, `faturamento`, `legal`) com PKs, FKs, `check constraints`,
  índices e timestamps. **RLS ativo em todas as tabelas**, apenas com política de leitura.
- **API**: a aplicação lê somente **views públicas** (`public.compras_v_*`, `public.faturamento_v_*`,
  `public.legal_v_*`), criadas com `security_invoker` — respeitam o RLS das tabelas de origem.
- **Aplicação**: Server Components buscam as views (paginando de 1000 em 1000), mantêm o conjunto em
  cache por 10 minutos e calculam os indicadores no servidor conforme os filtros da URL.
  Os gráficos são componentes cliente (Recharts).
- **Fonte única dos dados**: `src/lib/synthetic/` gera as tabelas. O mesmo código produz os arquivos
  de seed SQL **e** alimenta o modo local. O script `db:verify` prova que as views SQL retornam
  exatamente o mesmo que o gerador.
- **Resiliência**: se o Supabase estiver fora do ar, a demo continua funcionando com os dados locais
  e exibe um aviso.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Recharts · Supabase (PostgreSQL 15+) ·
Vitest · PGlite (PostgreSQL embarcado para testes) · GitHub Actions · Vercel

## Estrutura do projeto

```
.
├── .github/workflows/ci.yml       # lint, tipos, testes, verificação do banco e build
├── scripts/
│   ├── generate-seeds.ts          # gera supabase/seed/*.sql a partir do gerador
│   └── verify-db.ts               # aplica migrations+seeds em Postgres embarcado e valida
├── supabase/
│   ├── config.toml                # configuração da CLI do Supabase (seeds incluídos)
│   ├── migrations/
│   │   ├── 20261006000100_schema.sql   # schemas, tabelas, constraints, índices, RLS
│   │   └── 20261006000200_views.sql    # views públicas + permissões de leitura
│   └── seed/
│       ├── seed_compras.sql
│       ├── seed_faturamento.sql
│       └── seed_legal.sql
├── src/
│   ├── app/
│   │   ├── page.tsx               # homepage do portfólio
│   │   ├── cases/[slug]/          # página de cada case
│   │   └── demo/                  # as três demonstrações (+ telas de detalhe)
│   ├── components/                # UI, gráficos, cabeçalhos
│   ├── config/profile.ts          # nome, título, links de contato (via env)
│   ├── content/cases.ts           # textos dos cases
│   └── lib/
│       ├── analytics/             # cálculo dos indicadores (funções puras, testadas)
│       ├── data/                  # contrato das views + acesso ao Supabase/fallback
│       └── synthetic/             # gerador determinístico de dados fictícios
└── tests/                         # testes unitários (Vitest)
```

## Executar localmente

Requisitos: **Node.js 20.9+** e npm.

```bash
npm install
npm run dev            # http://localhost:3000
```

Sem nenhuma configuração as demos já funcionam (selo **“dados locais”** no topo das demos).
Para ler do banco, configure o Supabase (abaixo) e crie o `.env.local`.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | gera os tipos de rota do Next e roda `tsc` |
| `npm test` | testes unitários (gerador e indicadores) |
| `npm run db:seeds` | regenera `supabase/seed/*.sql` |
| `npm run db:verify` | aplica migrations + seeds em um Postgres embarcado e compara com o gerador |
| `npm run db:verify-remote` | valida o Supabase remoto com a chave pública (lê `.env.local`): views, volumes, conteúdo, ausência de dados pessoais, bloqueio de escrita e consultas do frontend |
| `npm run check` | tudo acima em sequência |

## Configurar o Supabase

Resumo (passo a passo completo em **[DEPLOY.md](./DEPLOY.md)**):

1. Crie um **projeto novo e vazio** no Supabase.
2. **Crie o banco** executando as migrations, na ordem:
   `20261006000100_schema.sql` → `20261006000200_views.sql`.
3. **Carregue os dados** executando os seeds: `seed_compras.sql`, `seed_faturamento.sql`, `seed_legal.sql`.
4. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. `npm run dev` — o selo no topo das demos muda para **“PostgreSQL · Supabase”**.

Com a CLI do Supabase, os passos 2 e 3 viram um comando:

```bash
npx supabase login
npx supabase link --project-ref <ref-do-seu-projeto>
npx supabase db push --include-seed
```

### Sobre os seeds

- São **idempotentes**: cada arquivo faz `truncate ... restart identity` antes de inserir.
- As datas são gravadas **relativas ao dia da execução** (`current_date - 42`), então o banco sempre
  parece atualizado. Para "renovar" as datas, basta rodar os seeds de novo.
- Volumes: ~1.240 solicitações, ~1.040 pedidos, ~1.140 notas de entrada; ~2.700 notas
  (~5.400 itens, 272 produtos, 140 clientes); 680 processos, ~4.400 movimentações, ~900 prazos.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | para usar o banco | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | para usar o banco | chave **pública** (`anon` ou `publishable`) — nunca a `service_role` |
| `DATA_SOURCE` | não | `synthetic` força o modo local |
| `NEXT_PUBLIC_SITE_URL` | recomendada | URL pública (metadados/Open Graph) |
| `NEXT_PUBLIC_PROFILE_NAME` | não | nome exibido (padrão: “Leandro”) |
| `NEXT_PUBLIC_PROFILE_LOCATION` | não | localização exibida |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_LINKEDIN_URL`, `NEXT_PUBLIC_GITHUB_URL`, `NEXT_PUBLIC_FREELAS_URL`, `NEXT_PUBLIC_WHATSAPP_URL` | não | links de contato; os vazios são ocultados |

> Variáveis `NEXT_PUBLIC_*` são embutidas no build. Depois de alterá-las na Vercel, faça um **Redeploy**.

## Deploy

Veja **[DEPLOY.md](./DEPLOY.md)** — criação do Supabase, migrations, seeds, Vercel, variáveis,
GitHub → Vercel, primeiro deploy e domínio.

## Como adicionar novos cases

1. **Dados** — crie `src/lib/synthetic/<dominio>.ts` com uma função `generate<Dominio>Tables(anchor)`
   usando `Random` (seed fixa) e os helpers de `names.ts`.
2. **Banco** — crie uma migration nova em `supabase/migrations/` (`<timestamp>_<dominio>.sql`) com o
   schema, as tabelas, o RLS de leitura e as views `public.<dominio>_v_*` com `security_invoker = on`
   e `grant select ... to anon, authenticated`.
3. **Contrato** — declare as linhas das views em `src/lib/data/types.ts` e a montagem equivalente em
   `src/lib/synthetic/views.ts`.
4. **Seeds** — inclua o domínio em `scripts/generate-seeds.ts`, adicione o arquivo em
   `supabase/config.toml` (`[db.seed] sql_paths`) e rode `npm run db:seeds`.
5. **Verificação** — inclua as comparações em `scripts/verify-db.ts` e rode `npm run db:verify`.
6. **Acesso** — adicione `get<Dominio>Dataset()` em `src/lib/data/repository.ts`.
7. **Indicadores** — funções puras em `src/lib/analytics/<dominio>.ts` + testes em `tests/`.
8. **Tela** — `src/app/demo/<slug>/page.tsx`, reaproveitando `Kpi`, `Panel`, `BarList`, `FilterBar`,
   `TrendChart` e `ColumnChart`; inclua o link em `src/components/demo/DemoNav.tsx`.
9. **Portfólio** — adicione o case em `src/content/cases.ts` (aparece na home e em `/cases/<slug>`).

## Segurança e privacidade

- Nenhum dado real: tudo é gerado por `src/lib/synthetic/` com seeds fixas.
- A aplicação usa apenas a chave pública do Supabase e só tem permissão de **leitura** (RLS + grants).
- `.env*`, chaves, certificados, credenciais e dumps estão no `.gitignore`; apenas `.env.example`
  (sem valores) é versionado.
