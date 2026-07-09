import type { CandidateApplication } from "@/types/candidate";

export const statusLabels: Record<CandidateApplication["currentStatus"], string> = {
  PROCESSING: "Pending",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
};

export const statusTones: Record<
  CandidateApplication["currentStatus"],
  "positive" | "warning" | "negative" | "neutral"
> = {
  PROCESSING: "warning",
  SHORTLISTED: "positive",
  REJECTED: "negative",
  HIRED: "positive",
};

export const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const toScorePercent = (score: number) => Math.round(score * 20);
