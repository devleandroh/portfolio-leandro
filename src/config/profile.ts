import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Dados pessoais exibidos no portfólio.
 * Os links de contato vêm de variáveis de ambiente (ver .env.example) para que
 * nada pessoal precise ficar fixo no código. Links não configurados são ocultados.
 * Os textos de apresentação (cargo, título, resumo) ficam no dicionário de cada idioma.
 */
export function getProfile(lang: Locale) {
  const t = getDictionary(lang).profile;
  return {
    name: process.env.NEXT_PUBLIC_PROFILE_NAME?.trim() || "Leandro",
    role: t.role,
    headline: t.headline,
    summary: t.summary,
    location:
      (lang === "pt" ? process.env.NEXT_PUBLIC_PROFILE_LOCATION : process.env.NEXT_PUBLIC_PROFILE_LOCATION_EN)?.trim() ||
      t.location,
  };
}

export interface ContactLink {
  label: string;
  href: string;
  display: string;
}

export function contactLinks(lang: Locale): ContactLink[] {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const links: (ContactLink | null)[] = [
    email ? { label: getDictionary(lang).home.contact.email, href: `mailto:${email}`, display: email } : null,
    link("LinkedIn", process.env.NEXT_PUBLIC_LINKEDIN_URL),
    link("GitHub", process.env.NEXT_PUBLIC_GITHUB_URL),
    link("99Freelas", process.env.NEXT_PUBLIC_FREELAS_URL),
    link("WhatsApp", process.env.NEXT_PUBLIC_WHATSAPP_URL),
  ];
  return links.filter((l): l is ContactLink => l !== null);
}

function link(label: string, url: string | undefined): ContactLink | null {
  const href = url?.trim();
  if (!href) return null;
  return { label, href, display: href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") };
}
