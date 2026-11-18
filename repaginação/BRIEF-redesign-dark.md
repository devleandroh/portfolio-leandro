# Brief de implementação — redesign dark do portfólio

> **Como usar:** copie os 3 arquivos (`BRIEF-redesign-dark.md`, `theme-tokens.css`, `tailwind-theme.ts`, `portfolio-dark-preview.html`) para a raiz do repo em `.design/` e abra o Claude Code na pasta do projeto com:
>
> ```
> claude
> > Leia @.design/BRIEF-redesign-dark.md e execute. O HTML de referência está em @.design/portfolio-dark-preview.html — ele é a fonte de verdade visual.
> ```

---

## 0. Contexto

Repositório: portfólio pessoal em Next.js + TypeScript + Tailwind CSS (deploy na Vercel).
Hoje o site é claro e minimalista. As publicações de Instagram/LinkedIn do autor usam outra identidade — navy profundo com neon azul→verde, cards com glow, padrões de pontos e ondas no rodapé. **A tarefa é trazer o site para essa identidade, sem reescrever o conteúdo.**

Arquivos de apoio nesta pasta:

| Arquivo | Papel |
|---|---|
| `portfolio-dark-preview.html` | **Fonte de verdade visual.** Página inteira já implementada em HTML/CSS puro. Abra no navegador e compare lado a lado ao final. |
| `theme-tokens.css` | Design tokens em CSS custom properties + classes utilitárias de marca. |
| `tailwind-theme.ts` | Os mesmos tokens como `theme.extend` do Tailwind, com receitas de classes por componente. |

---

## 1. Objetivo e critério de pronto

Migrar o site inteiro para o tema dark da identidade, mantendo **todo o conteúdo textual atual**, a estrutura de seções e os links existentes — e adicionando **uma** seção nova (Antes/Depois, especificada na §5.3).

Está pronto quando: a página renderizada em `localhost:3000` for visualmente equivalente ao `portfolio-dark-preview.html` em desktop (1440px) e mobile (390px), o build passar sem warnings novos, e o checklist da §10 estiver todo marcado.

---

## 2. Regras invioláveis

1. **A FOTO DO LEANDRO PERMANECE.** O hero tem hoje uma foto real em `/images/leandro-profile-photo.jpg` (alt: `"Foto de Leandro Santos"`). Ela **não pode** ser substituída por iniciais, avatar genérico, ilustração ou placeholder. O preview HTML usa um círculo com "LS" apenas porque não tinha acesso ao arquivo — **ignore isso e use a foto real**, com o tratamento visual descrito na §5.2.
2. **Não reescreva textos.** Títulos, parágrafos, nomes de case, tags e labels de botão permanecem palavra por palavra. A única exceção é a seção nova da §5.3.
3. **Não remova nem renomeie rotas, âncoras (`#cases`, `#competencias`, `#tecnologias`, `#contato`) ou links externos** (LinkedIn, GitHub, demos dos cases).
4. **Não instale dependências novas** sem necessidade real. Se `framer-motion` já estiver no `package.json`, use; senão, faça as animações com CSS + IntersectionObserver (há implementação pronta no final do preview HTML).
5. **Não use `localStorage`/`sessionStorage`.** O tema é dark fixo, sem toggle.
6. Trabalhe em uma branch: `feat/dark-brand-identity`. Não faça commit na `main` e não dê push sem eu pedir.

---

## 3. Descoberta (faça antes de escrever qualquer código)

Inspecione e me reporte em 5 linhas, antes de editar:

- App Router ou Pages Router? Onde ficam `layout.tsx`/`globals.css`?
- Versão do Tailwind (v3 usa `tailwind.config.ts`; v4 usa `@theme` no CSS) — isso decide como aplicar os tokens.
- Os componentes são um arquivo por seção ou tudo numa `page.tsx`?
- Como as fontes são carregadas hoje (`next/font` ou `<link>`)? O tema pede **Inter** (400–900) e **JetBrains Mono** (400/500).
- Existe algum tema claro hardcoded (`bg-white`, `text-slate-900`, `dark:` variants) espalhado? Liste os arquivos.

Se algo divergir deste brief, **pergunte antes de improvisar.**

---

## 4. Design tokens

Copie `theme-tokens.css` para `src/app/theme-tokens.css` e importe no topo do `globals.css`. Em Tailwind v3, estenda o config com `tailwind-theme.ts`. Em Tailwind v4, converta os tokens para o bloco `@theme`.

Paleta resumida (valores completos nos arquivos):

```
superfícies   #040A16 · #06101F · #0A1B33 · #0E2A4E
azul          #0B74E5 · #1E9BFF · #38BDF8 · #8AD4FF
verde         #00C85A · #22E27A · #7BF2B0
texto         #EAF2FF (principal) · #B9CCE8 (apoio) · #8AA3C6 (muted)
bordas        rgba(94,169,255,.16) / .34   |   verde rgba(34,226,122,.38)
gradiente     linear-gradient(90deg,#1E9BFF,#00C85A)
glow azul     0 18px 50px -20px rgba(30,155,255,.65)
raios         10 / 14 / 20 / 28 px
```

**Regra de uso:** azul é a cor estrutural (bordas, ícones, eyebrows); verde é reservado a *sinal* — status "executando", checks, a coluna "Depois", labels de funcionalidade. Não espalhe verde como decoração.

No `body`: `--grad-page` como fundo fixo (`::before`, `z-index:-2`) + malha quadriculada (`::after`, `z-index:-1`) com `mask-image` radial para sumir na parte de baixo. Ambos `position:fixed` e `pointer-events:none`.

Atualize também `<meta name="theme-color" content="#040A16">` e, se existir, o `background_color` do manifest.

---

## 5. Especificação por seção

### 5.1 Header / nav

Sticky, `backdrop-filter: blur(14px)`, fundo `rgba(4,10,22,.72)`, borda inferior `--line`, altura 70px. Logo: quadrado 38px, raio 11px, fundo `--grad-brand`, letra "L" em `#03121F` bold, com `--glow-blue`. Links em `--text-2`, hover `--blue-300`. "Ver demos" vira botão primário pill. Abaixo de 980px, esconda os links de texto e mantenha só logo + botão; abaixo de 620px esconda também o `/ dados & software`.

### 5.2 Hero — **inclui a foto**

Grid `1.05fr .95fr`, colapsa para 1 coluna abaixo de 980px.

**Bloco de identificação (topo da coluna esquerda) — a foto vai aqui:**

```tsx
<Image
  src="/images/leandro-profile-photo.jpg"
  alt="Foto de Leandro Santos"
  width={128}
  height={128}
  priority
  className="h-16 w-16 rounded-full object-cover"
/>
```

Tratamento visual obrigatório, para a foto conversar com o tema:

- `border: 2px solid var(--blue-400)`
- `box-shadow: 0 0 0 5px rgba(56,189,248,.10), var(--glow-blue)` — anel duplo: halo suave + glow
- `object-fit: cover` e `border-radius: 50%` (a foto é retangular; não deforme)
- Renderize em **2×** (`width/height = 128` para exibir a 64px) para não ficar borrada em tela retina
- `priority` — é LCP candidate, não deixe fazer lazy
- Ao lado: nome `Leandro Santos` (17px/700) e, abaixo, `Engenharia de Dados · BI · Automação` em mono 12px, `letter-spacing:.16em`, uppercase, cor `--blue-300`

> Se o arquivo `/images/leandro-profile-photo.jpg` não existir mais no `public/`, **pare e me avise** — não substitua por iniciais.

**H1:** texto atual, `clamp(34px,5.2vw,58px)`, peso 800, `letter-spacing:-.03em`, `line-height:1.06`. A palavra **"decisões"** recebe a caixa neon da identidade (classe `.mark`): borda 2px `--blue-400`, raio 12px, fundo `rgba(56,189,248,.10)`, glow externo e interno — é o equivalente ao "resultados" destacado nos banners.

**Lead + 2 botões** (primário gradiente com seta, secundário ghost) + `Brasil · remoto` em mono.

**Coluna direita — card do pipeline:** mantém o conteúdo atual (`pipeline.yml`, 4 etapas, linha `$ dado bruto → modelo confiável → decisão`). Visual: fundo quase preto, raio 28px, **borda em gradiente** via pseudo-elemento com `mask-composite` (receita em `theme-tokens.css`, classe `.border-grad`), glow azul forte. Status "executando" com dot verde pulsando (1.8s). Entre as 4 etapas, setinhas em `::after` (quadrado rotacionado 45°) — esconda abaixo de 620px, onde as etapas viram 2×2.

**Abaixo do card:** os 3 checks verdes dos banners — `Mais eficiência na operação` / `Dados confiáveis para decisões` / `Processos mais simples e automáticos`.

**Faixa de 4 pills** (full width, abaixo do grid): Engenharia de Dados · Business Intelligence · Automação de Processos · Integração de Sistemas, cada um com ícone outline 26px (banco de dados, barras, engrenagem, chevrons). Ícones 1 e 4 em azul, 2 e 3 em verde. 4 colunas → 2 em tablet e mobile.

### 5.3 Antes / Depois (seção nova)

Vem logo após o hero. Eyebrow `o que muda na prática`, título `Do trabalho manual ao <span>processo automático</span>.` (as duas últimas palavras em gradiente de texto).

Grid `1fr auto 1fr` (vira 1 coluna no mobile, com a seta rotacionada 90°):

- **Antes** — chip cinza; `Horas por semana montando relatórios e enviando arquivos à mão`; parágrafo: `Planilhas espalhadas, números que mudam conforme quem fecha o mês e retrabalho a cada ciclo.`
- **Seta** central azul
- **Depois** — chip verde sólido, card com `--glow-green` e fundo esverdeado; `Um clique: arquivos gerados, enviados e registrados`; parágrafo: `Rotina agendada, regras versionadas e log de execução — o mesmo número para todo mundo.`; abaixo, fluxo em chips mono: `dados → pdf / xlsx → e-mail · chat → registro`

### 5.4 Sobre · 5.5 Competências · 5.6 Cases · 5.7 Tecnologias

Mesmo conteúdo de hoje, re-skinado:

- **Padrão de cabeçalho de seção:** eyebrow em mono uppercase `--blue-300` precedido de um traço de 28px com `--grad-brand`; título 800 com a última expressão em gradiente de texto.
- **Card padrão:** `--grad-card`, borda `--line`, raio 20px, `--glow-soft`; no hover `translateY(-4px)` + borda `--line-2` + `--glow-blue`, transição 250ms.
- **Sobre:** 4 passos (Entender/Modelar/Automatizar/Entregar) com numeração `01–04` em mono azul.
- **Competências:** 2×2, cada card com `icon-tile` 50px (banco de dados azul, barras verde, engrenagem verde, chevrons azul) + tags mono em pill.
- **Cases:** um card por case, largura total. `case / 01` em mono azul; título 800; sub em `--text-2`. Corpo em 3 colunas (Problema / Solução / Principais funcionalidades) separado por borda superior; os `h4` em mono uppercase **verde** 11px. Bullets com quadradinho 6px em gradiente. Rodapé do card: tags à esquerda, `Ver demonstração` (primário) + `Detalhes do case` (ghost) à direita. No mobile vira 1 coluna.
- **Tecnologias:** 3 cards (Dados / Aplicações / Plataforma) com título mono uppercase azul claro e os itens como tags.

### 5.8 CTA + aviso

Card grande, raio 28px, fundo radial azul no topo sobre navy, borda `--line-2`, `--glow-blue`. Título com `vive em planilhas` em gradiente. Botão primário largo com ícone de calendário + seta (`Vamos conversar sobre o seu projeto?` → LinkedIn) e botão ghost com ícone do GitHub.

Abaixo, caixa de aviso centrada (máx. 720px) com ícone de info azul: **Dados fictícios** — texto atual sobre as demonstrações.

### 5.9 Rodapé com ondas

SVG `viewBox="0 0 1440 170"` com `preserveAspectRatio="none"`, 3 paths sobrepostos usando dois `linearGradient` (azul→verde), opacidades `.25 / .45 / .9`. Logo abaixo, a barra com `© 2026 Leandro Santos. Projeto pessoal de portfólio.` à esquerda e LinkedIn · GitHub à direita. Copie os paths do preview — não tente redesenhar.

### 5.10 Detalhes decorativos

Blocos `.dots` (pontos azuis 13px, 150×110, opacidade .5) posicionados de forma absoluta em hero, antes/depois, competências e tecnologias — sempre `aria-hidden` e `pointer-events:none`.

---

## 6. Acessibilidade (não negociável)

- Contraste mínimo 4.5:1 para texto de corpo. `--muted` (#8AA3C6) sobre #040A16 dá ~5.6:1 — **não use abaixo de 13px**. Se precisar de texto menor, suba para `#A3B8D6`.
- `prefers-reduced-motion: reduce` desliga o fade-up, o pulse do dot e os `translateY` de hover.
- Todo SVG decorativo com `aria-hidden="true"`; ícones dentro de botão não substituem o label de texto.
- Foco visível: `:focus-visible` com outline 2px `--blue-400` e `outline-offset: 3px` em todos os links e botões. O tema dark não pode comer o foco.
- A foto mantém o `alt` atual.

## 7. Performance

- `backdrop-filter` **só** no header. Em nenhum card.
- Sombras grandes só em: header, card do pipeline, CTA, botões primários e hover de card. Não empilhe glow em elemento repetido em lista.
- A borda em gradiente com `mask-composite` fica **só** no card do pipeline.
- Fundos (`--grad-page` e malha) em pseudo-elementos `fixed`, nunca repetidos por seção.
- Rode `npm run build` e confira que o LCP continua sendo a foto/H1. Se o Lighthouse mobile cair abaixo de 90, o primeiro corte é o `.border-grad`.

## 8. Responsividade

| Breakpoint | Mudanças |
|---|---|
| ≤ 980px | hero em 1 coluna; competências/tecnologias/passos/pills em 2 colunas; corpo dos cases em 1 coluna; antes/depois empilhado com seta rotacionada; links de nav escondidos |
| ≤ 620px | etapas do pipeline em 2×2 sem setas; passos/competências/tecnologias em 1 coluna; pills continuam em **2** colunas; `/ dados & software` escondido |

Teste real em 390px, 768px, 1024px, 1440px.

---

## 9. Ordem de execução

1. Branch `feat/dark-brand-identity`.
2. Tokens: `theme-tokens.css` + import no `globals.css` + extensão do Tailwind + fontes via `next/font`.
3. Fundo global e `theme-color` no `layout.tsx`.
4. Header.
5. Hero — **começando pela foto e pelo bloco de identificação**.
6. Card do pipeline + checks + pills.
7. Seção Antes/Depois (nova).
8. Sobre → Competências → Cases → Tecnologias.
9. CTA + aviso + rodapé com ondas.
10. Varredura: elimine qualquer `bg-white`/`text-slate-900`/`dark:` remanescente.
11. `npm run build` + screenshots em 1440px e 390px, comparados ao preview.

Commit por etapa, mensagens em português, imperativo, escopo curto.

---

## 10. Checklist de aceite

- [ ] **A foto real do Leandro está no hero**, circular, com anel azul + glow, nítida em retina, com `priority` e o alt original
- [ ] Nenhum texto do site foi reescrito
- [ ] "decisões" no H1 está dentro da caixa neon
- [ ] Dot "executando" pulsa em verde; setas entre as etapas aparecem em desktop
- [ ] Seção Antes/Depois presente, com o card "Depois" em verde
- [ ] Os 3 cases mantêm tags, links de demo e a estrutura Problema/Solução/Funcionalidades
- [ ] Ondas no rodapé em gradiente azul→verde
- [ ] Zero resíduo do tema claro
- [ ] Contraste ≥ 4.5:1 no corpo; foco visível em todos os interativos
- [ ] `prefers-reduced-motion` respeitado
- [ ] `npm run build` limpo; Lighthouse mobile ≥ 90 em Performance e Acessibilidade
- [ ] Comparação visual com `portfolio-dark-preview.html` em 1440px e 390px

---

## 11. O que NÃO fazer

- Não trocar a foto por iniciais, avatar gerado ou ilustração.
- Não inventar números, métricas, depoimentos, logos de clientes ou "casos de sucesso".
- Não adicionar toggle de tema, cookie banner, newsletter, contador de visitas ou chat.
- Não trocar Recharts, Tailwind ou qualquer peça da stack.
- Não "melhorar" os textos, nem traduzir, nem adicionar emojis.
- Não mexer nas páginas de demo dos cases nesta branch (ver pendência abaixo).

---

## 12. Pendência em aberto (decidir depois, não implementar agora)

As três demos (Compras 360, Faturamento, Legal BI) provavelmente continuam no tema claro. Um portfólio dark que abre uma demo clara quebra a continuidade. Opções, em ordem de custo: (a) reskinar as demos com os mesmos tokens; (b) abrir as demos em nova aba com uma tela de transição; (c) assumir a quebra — o que é defensável, já que são *produtos* distintos do portfólio. Ao terminar esta branch, me diga quantos arquivos seriam tocados na opção (a).
