"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Link para uma âncora (ex.: "/#cases", "/en#cases"). Quando a âncora está na página
 * atual, rola até ela mesmo que a URL já termine nesse hash — o <Link> do Next.js
 * ignora o clique nesse caso. Em outra página, navega normalmente.
 * Compara com location.pathname (endereço real), pois o proxy reescreve as URLs.
 */
export function HashLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        const [path, hash] = href.split("#");
        if (e.defaultPrevented || !hash || (path || "/") !== window.location.pathname) return;
        const el = document.getElementById(hash);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        history.replaceState(history.state, "", `${path || "/"}#${hash}`);
      }}
      {...rest}
    />
  );
}
