import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ApplicationDetail } from "@/types/api";

export function useApplicationDetail(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.applicationDetail(applicationId),
    queryFn: () => apiFetch<ApplicationDetail>(`/api/applications/${applicationId}`),
    enabled: !!applicationId,
  });
}
