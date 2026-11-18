import { describe, expect, it } from "vitest";
import { cleanUtm, normalizeOrigin, referrerHost, visitorId } from "@/lib/visits";

describe("origem das visitas", () => {
  it("agrupa site, app e links curtos do LinkedIn", () => {
    expect(referrerHost("https://www.linkedin.com/feed/", "meusite.dev")).toBe("linkedin.com");
    expect(referrerHost("android-app://com.linkedin.android/", "meusite.dev")).toBe("linkedin.com");
    expect(referrerHost("https://lnkd.in/abc", "meusite.dev")).toBe("linkedin.com");
    expect(normalizeOrigin("linkedin")).toBe("linkedin.com");
  });

  it("reconhece buscadores e mensageiros", () => {
    expect(referrerHost("https://www.google.com.br/", null)).toBe("google");
    expect(referrerHost("android-app://com.google.android.gm/", null)).toBe("gmail");
    expect(referrerHost("https://t.co/xyz", null)).toBe("x.com");
    expect(normalizeOrigin("wa")).toBe("whatsapp");
  });

  it("ignora o próprio site, previews e referências inválidas", () => {
    expect(referrerHost("https://www.meusite.dev/cases", "meusite.dev")).toBeNull();
    expect(referrerHost("https://portfolio-abc.vercel.app/", "meusite.dev")).toBeNull();
    expect(referrerHost("", null)).toBeNull();
    expect(referrerHost("não é url", null)).toBeNull();
  });

  it("mantém domínios desconhecidos sem www", () => {
    expect(referrerHost("https://www.exemplo.com.br/x", null)).toBe("exemplo.com.br");
  });
});

describe("dados anônimos", () => {
  it("limpa UTMs", () => {
    expect(cleanUtm(" LinkedIn ")).toBe("linkedin");
    expect(cleanUtm("<script>")).toBe("script");
    expect(cleanUtm(42)).toBeNull();
    expect(cleanUtm("")).toBeNull();
  });

  it("gera um hash estável no mês e diferente no mês seguinte, sem expor o IP", () => {
    const a = visitorId("1.2.3.4", "UA", new Date("2026-11-01T10:00:00Z"));
    const b = visitorId("1.2.3.4", "UA", new Date("2026-11-30T10:00:00Z"));
    const c = visitorId("1.2.3.4", "UA", new Date("2026-12-01T10:00:00Z"));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toContain("1.2.3.4");
  });
});
