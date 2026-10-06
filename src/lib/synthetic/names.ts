import type { Random } from "./random";

/**
 * Vocabulário para nomes 100% fictícios.
 * Pessoas: combinação aleatória de prenomes e sobrenomes comuns.
 * Empresas: radicais inventados + atividade + sufixo societário.
 * Qualquer semelhança com pessoas ou empresas reais é mera coincidência.
 */
const FIRST_NAMES = [
  "Ana", "Bruno", "Camila", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João",
  "Larissa", "Lucas", "Mariana", "Mateus", "Natália", "Otávio", "Patrícia", "Rafael", "Renata", "Rodrigo",
  "Sabrina", "Thiago", "Vanessa", "Vinícius", "Beatriz", "Caio", "Débora", "Fábio", "Helena", "Igor",
  "Juliana", "Leonardo", "Letícia", "Marcelo", "Paula", "Ricardo", "Sofia", "Tatiane", "Victor", "Yasmin",
] as const;

const LAST_NAMES = [
  "Alves", "Barbosa", "Cardoso", "Carvalho", "Castro", "Correia", "Costa", "Dias", "Duarte", "Fernandes",
  "Freitas", "Gomes", "Lima", "Lopes", "Machado", "Martins", "Melo", "Mendes", "Monteiro", "Moreira",
  "Nascimento", "Nunes", "Oliveira", "Pinto", "Ramos", "Ribeiro", "Rocha", "Rodrigues", "Santos", "Silva",
  "Soares", "Souza", "Teixeira", "Vieira", "Azevedo", "Campos", "Farias", "Moura", "Prado", "Queiroz",
] as const;

const COMPANY_ROOTS = [
  "Velmar", "Norvix", "Tarlen", "Quintor", "Brisal", "Lumeq", "Corvane", "Serdal", "Altrino", "Mirassu",
  "Delvon", "Ostrel", "Pravex", "Ruvian", "Solteq", "Trivant", "Ubrex", "Vantor", "Zelmar", "Arquion",
  "Bentrix", "Calmor", "Dravel", "Esquilar", "Fontrel", "Gravant", "Horvel", "Ilmarq", "Jarvex", "Kordal",
  "Lirasul", "Montrel", "Navesul", "Orlenz", "Pertano", "Quarvel", "Rontel", "Sulvane", "Tervix", "Valtrix",
] as const;

const COMPANY_SUFFIXES = ["Ltda.", "S.A.", "Ltda.", "Ltda.", "EIRELI"] as const;

/** Prenome + dois sobrenomes distintos: reduz a chance de coincidir com pessoas reais. */
export function personName(rng: Random): string {
  const first = rng.pick(FIRST_NAMES);
  const a = rng.pick(LAST_NAMES);
  let b = rng.pick(LAST_NAMES);
  while (b === a) b = rng.pick(LAST_NAMES);
  return `${first} ${a} ${b}`;
}

/** Gera `count` nomes de pessoa sem repetição. */
export function uniquePeople(rng: Random, count: number): string[] {
  const used = new Set<string>();
  while (used.size < count) used.add(personName(rng));
  return [...used];
}

/** Gera `count` razões sociais fictícias e únicas para a atividade informada. */
export function uniqueCompanies(rng: Random, count: number, activities: readonly string[]): string[] {
  const used = new Set<string>();
  let guard = 0;
  while (used.size < count && guard++ < count * 50) {
    used.add(`${rng.pick(COMPANY_ROOTS)} ${rng.pick(activities)} ${rng.pick(COMPANY_SUFFIXES)}`);
  }
  return [...used];
}

export const UF_REGIAO: Record<string, string> = {
  SP: "Sudeste", RJ: "Sudeste", MG: "Sudeste", ES: "Sudeste",
  PR: "Sul", SC: "Sul", RS: "Sul",
  GO: "Centro-Oeste", MT: "Centro-Oeste", MS: "Centro-Oeste", DF: "Centro-Oeste",
  BA: "Nordeste", PE: "Nordeste", CE: "Nordeste", RN: "Nordeste", MA: "Nordeste",
  PA: "Norte", AM: "Norte", TO: "Norte",
};

export const UFS = Object.keys(UF_REGIAO);
export const UF_WEIGHTS = UFS.map((uf) =>
  ({ SP: 30, MG: 12, RJ: 10, PR: 9, SC: 7, RS: 8, GO: 5, BA: 6, PE: 4 } as Record<string, number>)[uf] ?? 2,
);
