/**
 * Dados pessoais exibidos no portfólio.
 * Os links de contato vêm de variáveis de ambiente (ver .env.example) para que
 * nada pessoal precise ficar fixo no código. Links não configurados são ocultados.
 */
export const profile = {
  name: process.env.NEXT_PUBLIC_PROFILE_NAME?.trim() || "Leandro",
  role: "Engenharia de Dados · BI · Automação",
  headline: "Transformo dados operacionais em decisões — e em software que as pessoas realmente usam.",
  summary:
    "Construo pipelines, modelos de dados, dashboards e aplicações web que tiram informação de planilhas e sistemas legados e a colocam, confiável e atualizada, na frente de quem decide.",
  location: process.env.NEXT_PUBLIC_PROFILE_LOCATION?.trim() || "Brasil · remoto",
};

export interface ContactLink {
  label: string;
  href: string;
  display: string;
}

export function contactLinks(): ContactLink[] {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const links: (ContactLink | null)[] = [
    email ? { label: "E-mail", href: `mailto:${email}`, display: email } : null,
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
