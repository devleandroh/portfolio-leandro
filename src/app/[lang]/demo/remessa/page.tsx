import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { RemessaSimulator } from "@/components/demo/RemessaSimulator";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { remessaTexts } from "@/i18n/remessa";

/** Data de referência do lote simulado (semana 2026-S47). */
const REFERENCIA = "2026-11-17";

export async function generateMetadata({ params }: PageProps<"/[lang]/demo/remessa">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${remessaTexts[lang].metaTitle} — ${getDictionary(lang).meta.demoSuffix}` };
}

export default async function RemessaPage({ params }: PageProps<"/[lang]/demo/remessa">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = remessaTexts[lang];
  return (
    <>
      <DemoHeader lang={lang} title={t.title} description={t.description} today={REFERENCIA} />
      <RemessaSimulator lang={lang} />
    </>
  );
}
