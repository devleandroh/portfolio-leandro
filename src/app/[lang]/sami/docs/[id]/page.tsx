import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RefText } from "@/components/sami/RefText";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatters } from "@/lib/format";
import { personName } from "@/lib/sami/atlas";
import { documents, getDocument } from "@/lib/sami/documents";

export const dynamicParams = false;

export function generateStaticParams() {
  return documents.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/sami/docs/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const doc = getDocument(id);
  return hasLocale(lang) && doc ? { title: `${doc.id} · ${doc.title[lang]}` } : {};
}

export default async function SamiDocumentPage({ params }: PageProps<"/[lang]/sami/docs/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const doc = getDocument(id);
  if (!doc) notFound();
  const t = getDictionary(lang).sami.docs;
  const { fmtDate } = formatters(lang);

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Link href={localePath(lang, "/sami#painel")} className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
          <p className="mt-8 font-mono text-xs text-muted">
            {t.eyebrow} · {doc.id} · {t.types[doc.type]}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{doc.title[lang]}</h1>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
            <div className="flex gap-1.5">
              <dt className="text-muted">{t.author}:</dt>
              <dd>{personName(doc.author)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted">{t.date}:</dt>
              <dd>{fmtDate(doc.date)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-ink-2">
            <span className="text-muted">{t.related}:</span> <RefText lang={lang} text={doc.related.join(", ")} />
          </p>

          <div className="mt-8 space-y-4">
            {doc.sections.map((s, i) => (
              <section key={i} id={`s-${i + 1}`} className="scroll-mt-20 rounded-lg border border-line bg-surface p-5 target:border-accent target:bg-accent-soft/25">
                <p className="font-mono text-[11px] text-muted">
                  {t.section} {doc.id}§{i + 1}
                </p>
                <h2 className="mt-1 font-semibold">{s.heading[lang]}</h2>
                <p className="mt-2 leading-relaxed text-ink-2">
                  <RefText lang={lang} text={s.body[lang]} />
                </p>
              </section>
            ))}
          </div>

          <div className="mt-8">
            <DemoNotice lang={lang} compact />
          </div>
        </article>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
