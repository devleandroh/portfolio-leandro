"use client";

import { useEffect } from "react";

/**
 * Fade-up dos blocos .rv ao entrar na tela (IntersectionObserver, sem dependências).
 * Sem JS, ou com prefers-reduced-motion, tudo fica visível desde o início.
 * O que já está na tela ao montar é marcado como visível antes de ativar o efeito,
 * para não piscar o conteúdo acima da dobra.
 */
export function Reveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".brand-page");
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".rv"));
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const vh = window.innerHeight;
    for (const el of els) {
      if (el.getBoundingClientRect().top < vh) el.classList.add("in");
    }
    root.classList.add("rv-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    els.filter((el) => !el.classList.contains("in")).forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
