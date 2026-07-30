import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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

export interface PaginatedLogs {
  logs: RecruiterActionLog[];
  nextCursor: number | null;
}

export function useInfiniteLogs() {
  return useInfiniteQuery({
    queryKey: queryKeys.infiniteLogs(),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      apiFetch<PaginatedLogs>(`/api/applications/logs?limit=10&cursor=${String(pageParam)}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useApplicationLogs(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.applicationLogs(applicationId),
    queryFn: () => apiFetch<RecruiterActionLog[]>(`/api/applications/${applicationId}/logs`),
    enabled: Boolean(applicationId),
  });
}
