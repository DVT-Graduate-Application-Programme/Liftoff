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
