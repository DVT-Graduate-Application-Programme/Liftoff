import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface RecruiterActionLog {
  id: string;
  applicationRecordId: string;
  recruiterIdentity: string;
  actionType: string;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  ratingValue: number | null;
  actionedAt: string;
}

export function useRecruiterLogs() {
  return useQuery({
    queryKey: queryKeys.logs(),
    queryFn: () => apiFetch<RecruiterActionLog[]>("/api/applications/logs"),
  });
}
