import type { Evaluation } from "@/types/api";

type ScoreCategoryKey = keyof Evaluation["categoryScoresJson"];

export const SCORE_CATEGORIES: ReadonlyArray<{
  key: ScoreCategoryKey;
  label: string;
}> = [
  { key: "education", label: "Education" },
  { key: "open_source", label: "Open Source" },
  { key: "self_projects", label: "Self Projects" },
  { key: "production", label: "Production Experience" },
  { key: "technical_skills", label: "Technical Skills" },
];
