import type { Locale } from "@/i18n/config";

/** Texto nos dois idiomas do site. */
export type L10n = Record<Locale, string>;

export type TaskStatus = "done" | "in_progress" | "blocked" | "todo";
export type Priority = "critical" | "high" | "medium" | "low";
export type RiskLevel = "critical" | "high" | "medium" | "low";
export type DecisionStatus = "decided" | "pending";
export type DecisionCategory = "architecture" | "scope" | "release";
export type DocType = "requirements" | "adr" | "meeting" | "incident" | "schedule" | "technical" | "changelog" | "status";

export interface Person {
  id: string;
  name: string;
  role: L10n;
}

export interface Project {
  id: string;
  name: L10n;
  owner: string;
  start: string;
  end: string;
  summary: L10n;
}

export interface Milestone {
  id: string;
  project: string;
  name: L10n;
  due: string;
  /** Data em que o marco foi atingido (somente marcos concluídos). */
  reached?: string;
}

export interface Task {
  id: string;
  project: string;
  title: L10n;
  /** Expressões que identificam a tarefa em perguntas ("integração principal"…). Normalizadas na busca. */
  aliases: L10n[];
  owner: string;
  status: TaskStatus;
  priority: Priority;
  /** Início e fim planejados (ISO, dias corridos, inclusivos). */
  start: string;
  due: string;
  /** Data real de conclusão (status "done"). */
  finished?: string;
  /** Dias de trabalho restantes (status "in_progress" ou "blocked"). */
  remaining?: number;
  dependsOn: string[];
  milestone: string;
  docs: string[];
  /** Motivo registrado do bloqueio (status "blocked"). */
  blockedReason?: L10n;
}

export interface Risk {
  id: string;
  project: string;
  title: L10n;
  /** Probabilidade e impacto de 1 a 5; a severidade é calculada (ver projects.ts). */
  probability: number;
  impact: number;
  status: "open" | "mitigated";
  owner: string;
  tasks: string[];
  mitigation: L10n;
  docs: string[];
}

export interface Decision {
  id: string;
  project: string;
  title: L10n;
  status: DecisionStatus;
  category: DecisionCategory;
  owner: string;
  /** Data da decisão (decididas) ou prazo para decidir (pendentes). */
  date: string;
  doc: string;
  summary: L10n;
}

export interface DocSection {
  heading: L10n;
  body: L10n;
}

export interface SamiDocument {
  id: string;
  type: DocType;
  project: string;
  title: L10n;
  date: string;
  author: string;
  /** Registros citados pelo documento (tarefas, riscos, decisões, outros documentos). */
  related: string[];
  sections: DocSection[];
}
