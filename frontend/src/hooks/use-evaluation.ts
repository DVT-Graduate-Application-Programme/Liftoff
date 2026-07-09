import { useQuery } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Evaluation } from "@/types/api";

export function useEvaluation(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.evaluation(applicationId),
    queryFn: async () => {
      try {
        return await apiFetch<Evaluation>(`/api/applications/${applicationId}/evaluation`);
      } catch (err) {
        // A 404 here means "not yet evaluated" — an expected empty state, not a real error.
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: !!applicationId,
  });
}
