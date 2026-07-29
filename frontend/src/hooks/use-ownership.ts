import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Ownership } from "@/types/api";

export function useOwnership(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.ownership(applicationId),
    queryFn: () => apiFetch<Ownership>(`/api/applications/${applicationId}/ownership`),
    enabled: !!applicationId,
  });
}
