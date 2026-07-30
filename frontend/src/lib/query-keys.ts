import type { ApplicationFilters } from "@/types/api";

export const queryKeys = {
  applications: (filters?: ApplicationFilters) => ["applications", filters ?? {}] as const,
  infiniteApplications: (filters?: ApplicationFilters) => ["applications", "infinite", filters ?? {}] as const,
  applicationDetail: (id: string) => ["applications", id, "detail"] as const,
  applicant: (id: string) => ["applications", id, "applicant"] as const,
  evaluation: (id: string) => ["applications", id, "evaluation"] as const,
  ownership: (id: string) => ["applications", id, "ownership"] as const,
  logs: () => ["logs"] as const,
  infiniteLogs: () => ["logs", "infinite"] as const,
  applicationLogs: (id: string) => ["applications", id, "logs"] as const,
  recruiters: () => ["recruiters"] as const,
};
