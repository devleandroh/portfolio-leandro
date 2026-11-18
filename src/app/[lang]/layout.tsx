import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";
import { VisitTracker } from "@/components/site/VisitTracker";
import { getProfile } from "@/config/profile";
import { hasLocale, htmlLang, locales, ogLocale } from "@/i18n/config";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const viewport: Viewport = { themeColor: "#040A16" };

// Em produção na Vercel, cai para o domínio do projeto se NEXT_PUBLIC_SITE_URL não estiver definida,
// para que a imagem Open Graph nunca aponte para localhost.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

// Apenas os idiomas conhecidos; qualquer outro primeiro segmento vira 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const profile = getProfile(lang);
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${profile.name} — ${profile.role}`,
      template: `%s · ${profile.name}`,
    },
    description: profile.summary,
    openGraph: {
      title: `${profile.name} — ${profile.role}`,
      description: profile.summary,
      type: "website",
      locale: ogLocale[lang],
      alternateLocale: locales.filter((l) => l !== lang).map((l) => ogLocale[l]),
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <html lang={htmlLang[lang]} className={`${inter.variable} ${jetbrains.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <VisitTracker />
      </body>
    </html>
  );
}
