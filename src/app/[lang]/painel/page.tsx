import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Lock, LogOut } from "lucide-react";
import { BarList, EmptyState, Kpi, Panel } from "@/components/ui/dashboard";
import { hasLocale, localePath, type Locale } from "@/i18n/config";
import { fetchVisitStats, OWNER_COOKIE, visitsConfigured, type Ranking, type VisitStats } from "@/lib/visits";
import { entrar, sair } from "./actions";

/** Painel privado de visitas: não aparece em menus nem em buscadores. */
export const metadata: Metadata = {
  title: "Painel de visitas",
  robots: { index: false, follow: false },
};

const PERIODOS = [7, 30, 90] as const;
const num = (v: number) => v.toLocaleString("pt-BR");
const DISPOSITIVOS: Record<string, string> = { desktop: "Computador", mobile: "Celular", tablet: "Tablet" };

function paisNome(code: string): string {
  if (code === "??") return "Desconhecido";
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

const toBars = (items: Ranking[], label: (n: string) => string = (n) => n) =>
  items.map((i) => ({ name: label(i.nome), value: i.total }));

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
            {PERIODOS.map((p) => (
              <Link
                key={p}
                href={`${base}?dias=${p}`}
                aria-current={p === dias ? "page" : undefined}
                className={`px-3 py-1.5 ${p === dias ? "bg-wash font-medium" : "text-ink-2 hover:text-ink"}`}
              >
                {p} dias
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

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Hoje — visitantes" value={num(stats.hoje.visitantes)} hint={`${num(stats.hoje.visualizacoes)} páginas vistas`} />
        <Kpi label={`${dias} dias — visitantes`} value={num(stats.periodo.visitantes)} />
        <Kpi label={`${dias} dias — páginas vistas`} value={num(stats.periodo.visualizacoes)} />
        <Kpi label="Total de páginas vistas" value={num(stats.total)} />
      </div>

      <Panel title="Páginas vistas por dia" subtitle="Horário de Brasília" className="mt-4">
        <div className="flex h-40 items-end gap-[2px]">
          {stats.serie.map((d) => (
            <div
              key={d.dia}
              title={`${new Date(`${d.dia}T12:00:00`).toLocaleDateString("pt-BR")}: ${num(d.visualizacoes)} páginas · ${num(d.visitantes)} visitantes`}
              className="min-w-0 flex-1 rounded-t-[3px] bg-series-1"
              style={{ height: `${Math.max(d.visualizacoes ? 3 : 1, (d.visualizacoes / maxDia) * 100)}%`, opacity: d.visualizacoes ? 1 : 0.25 }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] text-muted">
          <span>{stats.serie[0] && new Date(`${stats.serie[0].dia}T12:00:00`).toLocaleDateString("pt-BR")}</span>
          <span>hoje</span>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <RankPanel title="Páginas mais vistas" items={toBars(stats.paginas)} />
        <RankPanel title="De onde vieram" subtitle="visitantes por site de origem" items={toBars(stats.origens)} />
        <RankPanel title="Países" subtitle="visitantes" items={toBars(stats.paises, paisNome)} />
        <RankPanel title="Dispositivos" subtitle="visitantes" items={toBars(stats.dispositivos, (n) => DISPOSITIVOS[n] ?? n)} />
      </div>
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
