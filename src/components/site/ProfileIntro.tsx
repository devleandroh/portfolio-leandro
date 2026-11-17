import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { getProfile } from "@/config/profile";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const PHOTO = "/images/leandro-profile-photo.jpg";

/**
 * Apresentação pessoal do hero: foto circular com anel azul + glow, nome e área de atuação.
 * A foto é renderizada em 2× (128px exibida a 64px) e com priority, pois é candidata a LCP.
 * Só é exibida se o arquivo existir em public/ (verificado no build), evitando imagem quebrada.
 */
export function ProfileIntro({ lang }: { lang: Locale }) {
  const profile = getProfile(lang);
  const hasPhoto = existsSync(join(process.cwd(), "public", PHOTO));

  return (
    <div className="who">
      {hasPhoto && (
        <Image
          src={PHOTO}
          alt={getDictionary(lang).profile.photoAlt(profile.name)}
          width={128}
          height={128}
          priority
          className="avatar"
        />
      )}
      <div>
        <b>{profile.name}</b>
        <span className="role">{profile.role}</span>
      </div>
    </div>
  );
}
