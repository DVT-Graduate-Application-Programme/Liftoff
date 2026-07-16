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

export function useApplicationLogs(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.applicationLogs(applicationId),
    queryFn: () => apiFetch<RecruiterActionLog[]>(`/api/applications/${applicationId}/logs`),
    enabled: Boolean(applicationId),
  });
}
