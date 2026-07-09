import type { CandidateApplication } from "@/types/candidate";

export const statusLabels: Record<CandidateApplication["currentStatus"], string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  VALID: "Valid",
  INVALID: "Invalid",
  MANUAL_REVIEW: "Manual Review",
  SHORTLISTED: "Shortlisted",
  ERROR: "Error",
};

export const statusTones: Record<
  CandidateApplication["currentStatus"],
  "positive" | "warning" | "negative" | "neutral"
> = {
  PENDING: "neutral",
  PROCESSING: "warning",
  VALID: "positive",
  INVALID: "negative",
  MANUAL_REVIEW: "warning",
  SHORTLISTED: "positive",
  ERROR: "negative",
};

export const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const toScorePercent = (score: number) => Math.round(score * 20);

export const getRecruiterLabel = (application: CandidateApplication) =>
  application.shortlistedByRecruiterId ??
  application.claimedByRecruiterId ??
  "Unassigned";
