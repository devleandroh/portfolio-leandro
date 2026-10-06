import Link from "next/link";

export default function NotFound() {
  return (
    <main className="blueprint flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="mt-2 text-sm text-ink-2">O endereço acessado não existe ou o registro não faz parte desta demonstração.</p>
      <Link href="/" className="mt-6 rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface hover:bg-accent-strong">
        Voltar ao início
      </Link>
    </main>
  );
}
