import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useReevaluateApplication(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/api/applications/${applicationId}/re-evaluate`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationDetail(applicationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicant(applicationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.evaluation(applicationId) });
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.logs() });
    },
  });
}
