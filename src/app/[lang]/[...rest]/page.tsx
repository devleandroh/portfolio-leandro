import { notFound } from "next/navigation";

/** URLs inexistentes dentro de um idioma exibem o 404 traduzido (app/[lang]/not-found.tsx). */
export default function CatchAll() {
  notFound();
}
