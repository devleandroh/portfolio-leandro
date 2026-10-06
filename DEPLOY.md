# Deploy — passo a passo

Fluxo final: **GitHub → Vercel → Next.js → Supabase → PostgreSQL**.
Tempo estimado: 20–30 minutos. Nenhuma credencial fica no repositório.

> Dica: o site funciona mesmo antes do passo 1 — sem Supabase, as demos usam dados sintéticos locais.
> Você pode publicar primeiro na Vercel e conectar o banco depois.

---

## 1. Criar o projeto no Supabase

1. Acesse <https://supabase.com> e crie uma conta (pode entrar com o GitHub).
2. **New project**:
   - *Name*: `portfolio` (ou outro de sua escolha)
   - *Database password*: gere uma senha forte e **guarde em um gerenciador de senhas**
     (só é necessária para a CLI/psql; a aplicação não usa).
   - *Region*: `South America (São Paulo)`.
   - Plano **Free** é suficiente.
3. Aguarde o projeto ficar pronto (1–2 min).

## 2. Executar as migrations (criar o banco)

**Opção A — SQL Editor (sem instalar nada)**

1. No painel: **SQL Editor → New query**.
2. Abra `supabase/migrations/20261006000100_schema.sql`, copie todo o conteúdo, cole e clique **Run**.
3. Repita com `supabase/migrations/20261006000200_views.sql`.
4. Confira em **Table Editor**: devem existir os schemas `compras`, `faturamento` e `legal`.

**Opção B — Supabase CLI (migrations + seeds de uma vez)**

```bash
npx supabase login
npx supabase link --project-ref <ref>      # ref = trecho da URL: https://<ref>.supabase.co
npx supabase db push --include-seed        # aplica migrations e os 3 seeds
```

Se usar a opção B, pule o passo 3.

## 3. Executar os seeds (carregar os dados fictícios)

No **SQL Editor**, execute, um de cada vez, o conteúdo de:

1. `supabase/seed/seed_compras.sql`
2. `supabase/seed/seed_faturamento.sql`
3. `supabase/seed/seed_legal.sql`

Cada arquivo tem ~0,5 MB. Se o editor recusar pelo tamanho, use a opção B do passo 2 ou o `psql`:

```bash
# Connection string em: botão "Connect" no topo do painel → "Session pooler"
psql "<connection-string>" -f supabase/seed/seed_compras.sql
psql "<connection-string>" -f supabase/seed/seed_faturamento.sql
psql "<connection-string>" -f supabase/seed/seed_legal.sql
```

Verificação rápida (SQL Editor):

```sql
select
  (select count(*) from public.compras_v_processos)  as compras,
  (select count(*) from public.faturamento_v_itens)  as faturamento_itens,
  (select count(*) from public.legal_v_processos)    as processos;
-- esperado ≈ 1240 | 5400 | 680
```

Os seeds podem ser executados de novo a qualquer momento (são idempotentes e “renovam” as datas).

## 4. Variáveis de ambiente

No Supabase: botão **Connect** (topo) ou **Project Settings → API Keys / Data API**:

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* — `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave **anon** (legacy) ou **publishable** (`sb_publishable_...`) |

⚠️ **Nunca** use a chave `service_role` / `secret` neste projeto.

Para rodar localmente:

```bash
cp .env.example .env.local
# edite .env.local e preencha as duas variáveis acima
npm run dev
```

O selo no topo das demos deve mostrar **“PostgreSQL · Supabase”**.

## 5. Publicar o código no GitHub

```bash
# no diretório do projeto (o repositório git já está inicializado)
git add -A
git commit -m "Portfólio: versão inicial"
gh repo create portfolio-leandro --public --source=. --push
# ou crie o repositório pelo site do GitHub e:
# git remote add origin https://github.com/<seu-usuario>/portfolio-leandro.git
# git push -u origin main
```

O workflow `.github/workflows/ci.yml` roda lint, tipos, testes, verificação do banco e build em cada push.

## 6. Criar o projeto na Vercel (GitHub → Vercel)

1. Acesse <https://vercel.com> e entre com o **GitHub**.
2. **Add New… → Project → Import** o repositório `portfolio-leandro`
   (na primeira vez, autorize o app da Vercel a acessar o repositório).
3. *Framework Preset*: **Next.js** (detectado automaticamente). Não altere build/output.

## 7. Variáveis na Vercel

Ainda na tela de import (ou depois em **Settings → Environment Variables**), adicione para
*Production* e *Preview*:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon/publishable |
| `NEXT_PUBLIC_SITE_URL` | `https://<seu-projeto>.vercel.app` (ou o domínio próprio) |
| `NEXT_PUBLIC_PROFILE_NAME` | seu nome completo |
| `NEXT_PUBLIC_CONTACT_EMAIL` | e-mail **pessoal** de contato |
| `NEXT_PUBLIC_LINKEDIN_URL` | URL do LinkedIn |
| `NEXT_PUBLIC_GITHUB_URL` | URL do GitHub |
| `NEXT_PUBLIC_FREELAS_URL` | URL do perfil no 99Freelas |
| `NEXT_PUBLIC_WHATSAPP_URL` | opcional (`https://wa.me/55...`) |

Variáveis vazias são simplesmente ocultadas no site.

## 8. Primeiro deploy

1. Clique **Deploy** e aguarde (~1–2 min).
2. Abra a URL `*.vercel.app` e confira:
   - Home → **Ver demonstração** em cada case;
   - selo **“PostgreSQL · Supabase”** no topo das demos;
   - filtros, paginação e telas de detalhe.
3. A cada `git push` na branch `main`, a Vercel publica automaticamente; pull requests geram
   *Preview Deployments*.

> Alterou alguma variável `NEXT_PUBLIC_*`? Elas são embutidas no build: vá em
> **Deployments → ⋯ → Redeploy** para aplicar.

## 9. Configurar domínio próprio (depois)

1. Compre o domínio (Registro.br, Cloudflare, etc.) ou use a própria Vercel.
2. Vercel → projeto → **Settings → Domains → Add** e informe o domínio (ex.: `seunome.dev`).
3. A Vercel mostra os registros DNS necessários (normalmente um registro **A** para o domínio raiz e
   um **CNAME** para `www`). Cadastre **exatamente** os valores exibidos no painel do seu registrador.
4. Aguarde a propagação (minutos a algumas horas). O HTTPS é emitido automaticamente.
5. Atualize `NEXT_PUBLIC_SITE_URL` para o novo domínio e faça **Redeploy**.

---

### Solução de problemas

| Sintoma | Causa provável |
|---|---|
| Selo mostra “dados locais” em produção | variáveis do Supabase ausentes na Vercel ou deploy feito antes de cadastrá-las → Redeploy |
| Aviso “Banco de dados indisponível” | URL/chave incorretas, projeto Supabase pausado (plano Free pausa após inatividade) ou views não criadas |
| Erro `permission denied` nas views | migration `..._views.sql` não executada (ela concede o `select` para `anon`) |
| Contagens zeradas | seeds não executados |
