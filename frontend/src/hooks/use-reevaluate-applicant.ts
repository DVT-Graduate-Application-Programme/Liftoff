import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useReevaluateApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) =>
      apiFetch(`/api/applications/${applicationId}/re-evaluate`, {
        method: "POST",
      }),
    onSuccess: (_, applicationId) => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: queryKeys.applications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluation(applicationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.screening(applicationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant(applicationId) });
    },
  });
}
