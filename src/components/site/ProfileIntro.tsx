import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { profile } from "@/config/profile";

const PHOTO = "/images/leandro-profile-photo.png";

/**
 * Apresentação pessoal do hero: foto circular discreta + nome e área de atuação.
 * A foto só é exibida se o arquivo existir em public/ (verificado no build),
 * evitando imagem quebrada.
 */
export function ProfileIntro() {
  const hasPhoto = existsSync(join(process.cwd(), "public", PHOTO));

  if (!hasPhoto) {
    return <p className="font-mono text-xs tracking-wide text-accent-strong uppercase">{profile.role}</p>;
  }

  return (
    <div className="mb-2 flex items-center gap-4">
      <Image
        src={PHOTO}
        alt={`Foto de ${profile.name}`}
        width={128}
        height={128}
        priority
        className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-line ring-offset-2 ring-offset-page sm:h-[72px] sm:w-[72px]"
      />
      <div>
        <p className="font-semibold tracking-tight">{profile.name}</p>
        <p className="mt-0.5 font-mono text-xs tracking-wide text-accent-strong uppercase">{profile.role}</p>
      </div>
    </div>
  );
}
