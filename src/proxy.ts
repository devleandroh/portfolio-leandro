import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LOCALE_COOKIE, localePath, stripLocale } from "@/i18n/config";

/**
 * Roteamento por idioma:
 * - /en/...           → servido como está;
 * - /pt/...           → redireciona para a URL sem prefixo (endereço canônico do português);
 * - sem prefixo       → reescrito internamente para /pt/..., ou redirecionado para o
 *                       idioma salvo no cookie quando o visitante já escolheu outro.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (hasLocale(first)) {
    // A imagem OG do português é referenciada pelo próprio Next em /pt/opengraph-image.
    if (first !== defaultLocale || pathname.includes("/opengraph-image")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = stripLocale(pathname);
    return NextResponse.redirect(url);
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value ?? "";
  if (hasLocale(saved) && saved !== defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = localePath(saved, pathname);
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // Ignora arquivos internos, a pasta public/ e os arquivos de metadados (ícone, imagem OG).
  matcher: ["/((?!_next/|images/|icon\\.svg|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)"],
};
