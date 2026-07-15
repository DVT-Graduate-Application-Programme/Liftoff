import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Applicant } from "@/types/api";

export function useApplicant(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.applicant(applicationId),
    queryFn: () => apiFetch<Applicant>(`/api/applications/${applicationId}/applicant`),
    enabled: !!applicationId,
  });
}
