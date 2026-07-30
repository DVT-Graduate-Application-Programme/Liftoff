import type { CandidateApplication } from "@/types/candidate";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  evaluated: "Evaluated",
  forwarded: "Forwarded",
  rejected: "Rejected",
  shortlisted: "Shortlisted",
};

const statusTones: Record<string, "positive" | "warning" | "negative" | "neutral"> = {
  pending: "neutral",
  evaluated: "warning",
  forwarded: "warning",
  rejected: "negative",
  shortlisted: "positive",
};

export const getStatusLabel = (status: CandidateApplication["currentStatus"]) =>
  statusLabels[status.toLowerCase()];

export const getStatusTone = (status: CandidateApplication["currentStatus"]) =>
  statusTones[status.toLowerCase()];

export const getDisplayStatus = (application: CandidateApplication) =>
  application.currentStatus;

export const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const toScorePercent = (score: number) => Math.round(score * 10) / 10;

export const getRecruiterLabel = (application: CandidateApplication) =>
  application.claimedByRecruiterId ??
  application.shortlistedByRecruiterId ??
  application.ratedByRecruiterId ??
  "phindi@dvtsoftware.com";

export const isClaimedByActiveRecruiter = (
  application: CandidateApplication,
  recruiterIdentity: string,
) => application.claimedByRecruiterId === recruiterIdentity;

export function parseEducationEvidence(educationEvidence?: string | null) {
  const parts = (educationEvidence ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    degree: parts[0] ?? "",
    institution: parts[1] ?? "",
    average: parts[2] ?? "",
  };
}

export type DateBucket = "today" | "thisWeek" | "lastWeek" | "older";

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const daysSinceMonday = (day + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

export const getDateBucket = (createdAt: string): DateBucket => {
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return "older";

  const today = startOfToday();
  const startOfThisWeek = getStartOfWeek(today);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  if (createdDate >= today) return "today";
  if (createdDate >= startOfThisWeek) return "thisWeek";
  if (createdDate >= startOfLastWeek) return "lastWeek";
  return "older";
};

export const groupApplicationsByDate = <T extends { createdAt: string }>(
  applications: T[],
) =>
  applications.reduce(
    (groups, application) => {
      groups[getDateBucket(application.createdAt)].push(application);
      return groups;
    },
    {
      today: [] as T[],
      thisWeek: [] as T[],
      lastWeek: [] as T[],
      older: [] as T[],
    },
  );
