import { BrandFooter, BrandHeader } from "@/components/brand/BrandChrome";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Logo compacto da marca: "L" sobre o gradiente azul→verde (usado no topo das demos). */
export function Monogram({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-[7px] bg-[image:var(--grad-brand)] text-[13px] leading-none font-black text-[#03121f] shadow-[var(--glow-blue)] ${className}`}
    >
      L
    </span>
  );
}

/**
 * Cabeçalho das páginas internas (cases, S.A.M.I.). Mesmo cabeçalho da homepage;
 * a página precisa estar dentro de um elemento com a classe `brand-chrome`.
 */
export function SiteHeader({ lang }: { lang: Locale }) {
  return <BrandHeader lang={lang} />;
}

/** Rodapé com ondas + aviso de dados fictícios das páginas internas. */
export function SiteFooter({ lang }: { lang: Locale }) {
  return (
    <>
      <p className="mx-auto mt-16 max-w-3xl px-4 text-center text-xs text-muted">{getDictionary(lang).footer.disclaimer}</p>
      <BrandFooter lang={lang} />
    </>
  );
}
