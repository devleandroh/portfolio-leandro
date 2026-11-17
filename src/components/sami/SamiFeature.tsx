import Link from "next/link";
import { IconArrow } from "@/components/brand/icons";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Destaque do case S.A.M.I. na seção de cases da homepage (identidade dark). */
export function SamiFeature({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).sami;
  return (
    <article className="card case featured rv">
      <p className="case-id">{t.home.eyebrow}</p>
      <h3>S.A.M.I.</h3>
      <p className="expanded">{t.hero.expanded}</p>
      <p className="sub">{t.home.title}</p>
      <div className="case-body two">
        <div>
          <p>{t.home.text}</p>
        </div>
        <ul>
          {t.home.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div className="case-foot">
        <span />
        <div className="acts">
          <Link href={localePath(lang, "/sami")} className="btn btn-primary btn-sm">
            {t.home.cta} <IconArrow />
          </Link>
        </div>
      </div>
    </article>
  );
}
