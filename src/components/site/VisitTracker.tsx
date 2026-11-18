"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Lê ?utm_source/medium/campaign (ou ?ref=) do link pelo qual o visitante chegou. */
function readUtm(): Record<string, string> {
  const q = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  const source = q.get("utm_source") ?? q.get("ref") ?? q.get("src");
  if (source) utm.source = source;
  if (q.get("utm_medium")) utm.medium = q.get("utm_medium")!;
  if (q.get("utm_campaign")) utm.campaign = q.get("utm_campaign")!;
  return utm;
}

/** Avisa o /api/visit a cada página vista. Não usa cookies nem guarda nada no navegador. */
export function VisitTracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    // Origem externa e campanha só fazem sentido na página de entrada; depois, a navegação é interna.
    const isFirst = first.current;
    first.current = false;
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: isFirst ? document.referrer : "",
        utm: isFirst ? readUtm() : {},
        language: navigator.language,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
