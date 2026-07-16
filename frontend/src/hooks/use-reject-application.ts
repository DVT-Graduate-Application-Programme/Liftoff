import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { ACTIVE_RECRUITER_ID } from "@/hooks/use-claim-application";

interface StatusResponse {
  actionedByRecruiterId: string;
  actionedAt: string;
  updatedStatus: string;
}

export function useRejectApplication(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) =>
      apiFetch<StatusResponse>(`/api/applications/${applicationId}/ownership/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterIdentity: ACTIVE_RECRUITER_ID, reason }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ownership(applicationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationDetail(applicationId) });
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.logs() });
    },
  });
}
