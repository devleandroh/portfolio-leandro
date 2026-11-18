"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasLocale, localePath, type Locale } from "@/i18n/config";
import { fetchVisitStats, OWNER_COOKIE } from "@/lib/visits";

const ONE_YEAR = 60 * 60 * 24 * 365;

function painelPath(lang: FormDataEntryValue | null, query = ""): string {
  const l: Locale = typeof lang === "string" && hasLocale(lang) ? lang : "pt";
  return localePath(l, "/painel") + query;
}

export async function entrar(form: FormData) {
  const key = String(form.get("chave") ?? "").slice(0, 200);
  const ok = key ? (await fetchVisitStats(key, 1)) !== null : false;
  if (!ok) redirect(painelPath(form.get("lang"), "?erro=1"));

  (await cookies()).set(OWNER_COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ONE_YEAR,
  });
  redirect(painelPath(form.get("lang")));
}

export async function sair(form: FormData) {
  (await cookies()).delete(OWNER_COOKIE);
  redirect(painelPath(form.get("lang")));
}
