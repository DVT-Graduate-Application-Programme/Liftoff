import type { CandidateApplication } from "@/types/candidate";

export interface RecencyGroup {
  label: string;
  applications: CandidateApplication[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function groupByRecency(applications: CandidateApplication[], now: Date = new Date()): RecencyGroup[] {
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const buckets: Record<"today" | "yesterday" | "earlier", CandidateApplication[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  for (const application of applications) {
    const createdAt = startOfDay(new Date(application.createdAt));
    if (createdAt.getTime() === today.getTime()) {
      buckets.today.push(application);
    } else if (createdAt.getTime() === yesterday.getTime()) {
      buckets.yesterday.push(application);
    } else {
      buckets.earlier.push(application);
    }
  }

  const groups: RecencyGroup[] = [
    { label: "Processed Today", applications: buckets.today },
    { label: "Applied Yesterday", applications: buckets.yesterday },
    { label: "Earlier", applications: buckets.earlier },
  ];

  return groups.filter((group) => group.applications.length > 0);
}
