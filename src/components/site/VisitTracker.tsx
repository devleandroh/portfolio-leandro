"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Avisa o /api/visit a cada página vista. Não usa cookies nem guarda nada no navegador. */
export function VisitTracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    // A origem externa só faz sentido na primeira página; depois, a navegação é interna.
    const referrer = first.current ? document.referrer : "";
    first.current = false;
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
