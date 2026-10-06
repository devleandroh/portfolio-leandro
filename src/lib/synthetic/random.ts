/**
 * Gerador pseudoaleatório determinístico (mulberry32).
 * A mesma seed sempre produz o mesmo conjunto de dados — isso garante que
 * os arquivos de seed SQL e o modo local (sem banco) apresentem números idênticos.
 */
export class Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Distribuição aproximadamente normal (Box-Muller). */
  normal(mean: number, sd: number): number {
    const u = 1 - this.next();
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Distribuição log-normal — útil para valores monetários e tempos de espera. */
  logNormal(median: number, spread: number): number {
    return median * Math.exp(this.normal(0, spread));
  }

  shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

const DAY_MS = 86_400_000;

/** Data âncora (UTC, meia-noite). Todas as datas sintéticas são relativas a ela. */
export function anchorDate(reference = new Date()): Date {
  return new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
}

/** Converte um deslocamento em dias (negativo = passado) para ISO yyyy-mm-dd. */
export function isoFromOffset(anchor: Date, offsetDays: number): string {
  return new Date(anchor.getTime() + Math.round(offsetDays) * DAY_MS).toISOString().slice(0, 10);
}

export function offsetFromIso(anchor: Date, iso: string): number {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - anchor.getTime()) / DAY_MS);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
