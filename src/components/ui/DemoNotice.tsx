import { FlaskConical } from "lucide-react";

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-ink-2">
        <FlaskConical className="h-3.5 w-3.5 text-accent" />
        Ambiente demonstrativo — todos os dados são fictícios.
      </p>
    );
  }
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-accent-soft bg-accent-soft/35 px-3.5 py-2.5 text-sm text-ink">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
      <p>
        <strong className="font-semibold">Ambiente demonstrativo</strong> — todos os dados apresentados são fictícios,
        gerados por um algoritmo. Nomes de pessoas e empresas não correspondem a ninguém real.
      </p>
    </div>
  );
}
