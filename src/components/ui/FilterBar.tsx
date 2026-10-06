"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Loader2, RotateCcw, Search } from "lucide-react";

export interface SelectFilter {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  /** Rótulo da opção vazia (ex.: "Todas"). */
  all?: string;
}

/**
 * Barra de filtros: um formulário GET comum (funciona sem JavaScript) que,
 * com JavaScript, atualiza a URL sem recarregar a página a cada alteração.
 */
export function FilterBar({
  segmented,
  selects,
  search,
}: {
  segmented?: SelectFilter;
  selects: SelectFilter[];
  search?: { name: string; value: string; placeholder: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const apply = () => {
    const form = formRef.current;
    if (!form) return;
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form).entries()) {
      if (typeof v === "string" && v.trim()) params.set(k, v.trim());
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const hasFilters = selects.some((s) => s.value) || !!search?.value;

  return (
    <form
      ref={formRef}
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-3"
      aria-busy={pending}
    >
      {segmented && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-[11px] font-medium text-muted">{segmented.label}</legend>
          <div className="flex rounded-md border border-line bg-page p-0.5">
            {segmented.options.map((o) => (
              <label key={o.value} className="cursor-pointer">
                <input
                  type="radio"
                  name={segmented.name}
                  value={o.value}
                  defaultChecked={segmented.value === o.value}
                  onChange={apply}
                  className="peer sr-only"
                />
                <span className="block rounded px-2.5 py-1 text-xs whitespace-nowrap text-ink-2 transition-colors peer-checked:bg-ink peer-checked:text-surface peer-focus-visible:outline-2 peer-focus-visible:outline-accent hover:text-ink peer-checked:hover:text-surface">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {selects.map((s) => (
        <label key={s.name} className="flex min-w-[140px] flex-1 flex-col gap-1 sm:flex-none">
          <span className="text-[11px] font-medium text-muted">{s.label}</span>
          <select
            name={s.name}
            defaultValue={s.value}
            onChange={apply}
            className="h-8 rounded-md border border-line bg-page px-2 text-sm hover:border-axis sm:max-w-[200px]"
          >
            <option value="">{s.all ?? "Todos"}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {search && (
        <label className="flex min-w-[180px] flex-1 flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Buscar</span>
          <span className="relative">
            <Search className="pointer-events-none absolute top-2 left-2 h-4 w-4 text-muted" />
            <input
              type="search"
              name={search.name}
              defaultValue={search.value}
              placeholder={search.placeholder}
              className="h-8 w-full rounded-md border border-line bg-page pr-2 pl-8 text-sm placeholder:text-muted hover:border-axis"
            />
          </span>
        </label>
      )}

      <div className="flex items-center gap-2">
        <button type="submit" className="h-8 rounded-md bg-ink px-3 text-xs font-medium text-surface hover:bg-accent-strong">
          Aplicar
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-ink-2 hover:bg-wash"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Limpar
          </button>
        )}
        {pending && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="Atualizando" />}
      </div>
    </form>
  );
}
