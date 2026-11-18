import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Lock, LogOut } from "lucide-react";
import { BarList, EmptyState, Kpi, Panel, Table, td, th } from "@/components/ui/dashboard";
import { hasLocale, localePath, type Locale } from "@/i18n/config";
import { fetchVisitStats, OWNER_COOKIE, visitsConfigured, type Ranking, type Sessao, type VisitStats } from "@/lib/visits";
import { entrar, sair } from "./actions";

/** Painel privado de visitas: não aparece em menus nem em buscadores. */
export const metadata: Metadata = {
  title: "Painel de visitas",
  robots: { index: false, follow: false },
};

const PERIODOS = [7, 30, 90] as const;
const num = (v: number) => v.toLocaleString("pt-BR");
const DISPOSITIVOS: Record<string, string> = { desktop: "Computador", mobile: "Celular", tablet: "Tablet" };

const ORIGENS: Record<string, string> = {
  direto: "Direto / sem origem",
  "linkedin.com": "LinkedIn",
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  "github.com": "GitHub",
  whatsapp: "WhatsApp",
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "x.com": "X (Twitter)",
  gmail: "Gmail",
  outlook: "Outlook",
  "e-mail": "E-mail",
  teams: "Microsoft Teams",
  chatgpt: "ChatGPT",
  "claude.ai": "Claude",
  perplexity: "Perplexity",
};
const origemNome = (o: string) => ORIGENS[o] ?? o;

const UF: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

function paisNome(code: string | null): string {
  if (!code || code === "??") return "Desconhecido";
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** "BR|RS" → "Rio Grande do Sul (RS)"; fora do Brasil, "CA · Estados Unidos". */
function estadoNome(chave: string): string {
  const [pais, estado] = chave.includes("|") ? chave.split("|") : ["", chave];
  if (!pais || pais === "BR") return UF[estado] ? `${UF[estado]} (${estado})` : estado;
  return `${estado} · ${paisNome(pais)}`;
}

/** "Porto Alegre|RS|BR" → "Porto Alegre · RS"; fora do Brasil, "Lisboa · Portugal". */
function cidadeNome(chave: string): string {
  const [cidade, estado, pais] = chave.split("|");
  if (!pais || pais === "BR") return estado ? `${cidade} · ${estado}` : cidade;
  return `${cidade} · ${paisNome(pais)}`;
}

function local(s: Pick<Sessao, "cidade" | "estado" | "pais">): string {
  if (s.cidade) return cidadeNome([s.cidade, s.estado ?? "", s.pais ?? ""].join("|"));
  if (s.estado) return estadoNome(`${s.pais ?? ""}|${s.estado}`);
  return paisNome(s.pais);
}

function duracao(seg: number | null | undefined): string {
  if (!seg) return "—";
  if (seg < 60) return `${Math.round(seg)} s`;
  const m = Math.floor(seg / 60);
  return m < 60 ? `${m} min ${Math.round(seg % 60)} s` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const toBars = (items: Ranking[] | undefined, label: (n: string) => string = (n) => n) =>
  (items ?? []).map((i) => ({ name: label(i.nome), value: i.total }));

export default async function PainelPage({ params, searchParams }: PageProps<"/[lang]/painel">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const sp = await searchParams;
  const dias = PERIODOS.find((p) => String(p) === sp.dias) ?? 30;

  const key = (await cookies()).get(OWNER_COOKIE)?.value ?? "";
  const stats = key ? await fetchVisitStats(key, dias) : null;

  return (
    <main className="brand-chrome flex-1">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {stats ? (
          <Dashboard stats={stats} lang={lang} dias={dias} />
        ) : (
          <Login lang={lang} erro={sp.erro === "1"} configured={visitsConfigured()} />
        )}
      </div>
    </main>
  );
}

function Login({ lang, erro, configured }: { lang: Locale; erro: boolean; configured: boolean }) {
  return (
    <form action={entrar} className="mx-auto mt-16 max-w-sm rounded-lg border border-line bg-surface p-6">
      <input type="hidden" name="lang" value={lang} />
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Lock className="h-4 w-4" /> Painel de visitas
      </p>
      {!configured && (
        <p className="mt-3 text-xs text-muted">Supabase não configurado neste ambiente — o painel não tem dados.</p>
      )}
      <label htmlFor="chave" className="mt-4 block text-xs text-ink-2">
        Senha
      </label>
      <input
        id="chave"
        name="chave"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
      />
      {erro && <p className="mt-2 text-xs text-critical">Senha incorreta.</p>}
      <button type="submit" className="mt-4 w-full rounded-md btn-grad px-4 py-2 text-sm">
        Entrar
      </button>
    </form>
  );
}

function Dashboard({ stats, lang, dias }: { stats: VisitStats; lang: Locale; dias: number }) {
  const base = localePath(lang, "/painel");
  const maxDia = Math.max(1, ...stats.serie.map((d) => d.visualizacoes));
  const desde = stats.primeiraVisita
    ? new Date(stats.primeiraVisita).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : null;
  const p = stats.periodo;
  const detalhado = stats.ultimas !== undefined;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted">privado · só você vê</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Visitas do portfólio</h1>
          <p className="mt-1 text-sm text-ink-2">
            {desde ? `Contando desde ${desde}. ` : "Nenhuma visita registrada ainda. "}
            Suas próprias visitas neste navegador não entram na conta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex rounded-md border border-line text-sm" aria-label="Período">
            {PERIODOS.map((d) => (
              <Link
                key={d}
                href={`${base}?dias=${d}`}
                aria-current={d === dias ? "page" : undefined}
                className={`px-3 py-1.5 ${d === dias ? "bg-wash font-medium" : "text-ink-2 hover:text-ink"}`}
              >
                {d} dias
              </Link>
            ))}
          </nav>
          <form action={sair}>
            <input type="hidden" name="lang" value={lang} />
            <button type="submit" title="Sair" className="rounded-md border border-line p-2 text-ink-2 hover:text-ink">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {!detalhado && (
        <p className="mt-4 rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs">
          Rode <code className="font-mono">supabase/migrations/20261118000200_visitas_detalhes.sql</code> no Supabase
          para ver estado, cidade, campanhas e as últimas visitas.
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Hoje — visitantes" value={num(stats.hoje.visitantes)} hint={`${num(stats.hoje.visualizacoes)} páginas vistas`} />
        <Kpi
          label={`${dias} dias — visitantes`}
          value={num(p.visitantes)}
          hint={p.visitas != null ? `${num(p.visitas)} visitas (visitante por dia)` : undefined}
        />
        <Kpi
          label={`${dias} dias — páginas vistas`}
          value={num(p.visualizacoes)}
          hint={p.paginasPorVisita != null ? `${String(p.paginasPorVisita).replace(".", ",")} páginas por visita` : undefined}
        />
        <Kpi
          label="Tempo médio por visita"
          value={duracao(p.duracaoMediaSeg)}
          hint={`Visitas com 2+ páginas · total geral: ${num(stats.total)} páginas`}
        />
      </div>

      <Panel title="Páginas vistas por dia" subtitle="Horário de Brasília" className="mt-4">
        <div className="flex h-40 items-end gap-[2px]">
          {stats.serie.map((d) => (
            <div
              key={d.dia}
              title={`${new Date(`${d.dia}T12:00:00`).toLocaleDateString("pt-BR")}: ${num(d.visualizacoes)} páginas · ${num(d.visitantes)} visitantes`}
              className="min-w-0 flex-1 rounded-t-[3px] bg-series-1"
              style={{
                height: `${Math.max(d.visualizacoes ? 3 : 1, (d.visualizacoes / maxDia) * 100)}%`,
                opacity: d.visualizacoes ? 1 : 0.25,
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] text-muted">
          <span>{stats.serie[0] && new Date(`${stats.serie[0].dia}T12:00:00`).toLocaleDateString("pt-BR")}</span>
          <span>hoje</span>
        </div>
      </Panel>

      <h2 className="mt-10 text-lg font-semibold">De onde vêm</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <RankPanel title="Origem" subtitle="visitas por site, app ou campanha de onde vieram" items={toBars(stats.origens, origemNome)} />
        <Panel title="Campanhas (UTM)" subtitle="visitantes que chegaram por um link marcado">
          {stats.campanhas?.length ? (
            <BarList items={toBars(stats.campanhas)} format={num} />
          ) : (
            <EmptyState>Nenhum link marcado ainda.</EmptyState>
          )}
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
            O app do LinkedIn costuma esconder a origem, e essas visitas caem em “Direto”. Ao postar, use o link com{" "}
            <code className="font-mono text-ink-2">?utm_source=linkedin</code> (ou{" "}
            <code className="font-mono text-ink-2">?ref=linkedin</code>). Para separar posts:{" "}
            <code className="font-mono text-ink-2">?utm_source=linkedin&amp;utm_campaign=post-banco360</code>.
          </p>
        </Panel>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Onde estão</h2>
      <p className="mt-1 text-xs text-muted">
        Localização aproximada pela rede: pode indicar a cidade do provedor de internet, não a exata do visitante.
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <RankPanel title="Cidades" subtitle="visitantes" items={toBars(stats.cidades, cidadeNome)} />
        <RankPanel title="Estados" subtitle="visitantes" items={toBars(stats.estados, estadoNome)} />
        <RankPanel title="Países" subtitle="visitantes" items={toBars(stats.paises, paisNome)} />
      </div>

      <h2 className="mt-10 text-lg font-semibold">O que viram</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <RankPanel title="Páginas mais vistas" items={toBars(stats.paginas)} />
        <RankPanel title="Páginas de entrada" subtitle="por onde a visita começou" items={toBars(stats.entradas)} />
      </div>

      <h2 className="mt-10 text-lg font-semibold">Como acessaram</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RankPanel title="Dispositivos" subtitle="visitantes" items={toBars(stats.dispositivos, (n) => DISPOSITIVOS[n] ?? n)} />
        <RankPanel title="Sistemas" subtitle="visitantes" items={toBars(stats.sistemas)} />
        <RankPanel title="Navegadores" subtitle="visitantes" items={toBars(stats.navegadores)} />
        <RankPanel title="Idiomas" subtitle="do navegador" items={toBars(stats.idiomas)} />
      </div>

      <Panel title="Últimas visitas" subtitle="Cada linha é um visitante em um dia, sem identificar quem é" className="mt-10">
        {stats.ultimas?.length ? (
          <Table
            minWidth={820}
            head={
              <>
                <th className={th}>Quando</th>
                <th className={th}>Local</th>
                <th className={th}>Origem</th>
                <th className={th}>Aparelho</th>
                <th className={`${th} text-right`}>Páginas</th>
                <th className={`${th} text-right`}>Tempo</th>
                <th className={th}>Caminho</th>
              </>
            }
          >
            {stats.ultimas.map((s, i) => (
              <tr key={i} className="align-top hover:bg-page">
                <td className={`${td} font-mono text-xs`}>{quando(s.inicio)}</td>
                <td className={td}>{local(s)}</td>
                <td className={td}>{origemNome(s.fonte)}</td>
                <td className={td}>{DISPOSITIVOS[s.dispositivo] ?? s.dispositivo}</td>
                <td className={`${td} text-right tabular`}>{num(s.paginas)}</td>
                <td className={`${td} text-right tabular`}>{duracao(s.duracaoSeg)}</td>
                <td className={`${td} max-w-[320px] truncate font-mono text-xs text-ink-2`} title={s.caminhos.join(" → ")}>
                  {s.caminhos.join(" → ")}
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState>Sem visitas no período.</EmptyState>
        )}
      </Panel>
    </>
  );
}

function RankPanel({ title, subtitle, items }: { title: string; subtitle?: string; items: { name: string; value: number }[] }) {
  return (
    <Panel title={title} subtitle={subtitle}>
      {items.length ? <BarList items={items} format={num} /> : <EmptyState>Sem dados no período.</EmptyState>}
    </Panel>
  );
}
