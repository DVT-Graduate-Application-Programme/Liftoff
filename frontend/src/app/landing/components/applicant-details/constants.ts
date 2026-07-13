import type { ApplicantDetailsEvaluation } from "./mock-applicant-details";

type ScoreCategoryKey = keyof ApplicantDetailsEvaluation["scores"];

export const SCORE_CATEGORIES: ReadonlyArray<{
  key: ScoreCategoryKey;
  label: string;
}> = [
  { key: "open_source", label: "Open Source" },
  { key: "self_projects", label: "Self Projects" },
  { key: "production", label: "Production Experience" },
  { key: "technical_skills", label: "Technical Skills" },
];
