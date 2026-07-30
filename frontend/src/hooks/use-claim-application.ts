import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export const ACTIVE_RECRUITER_ID = "phindi@dvtsoftware.com";

interface ClaimResponse {
  claimedByRecruiterId: string | null;
  claimedAt: string | null;
}

export function useClaimApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) =>
      apiFetch<ClaimResponse>(`/api/applications/${applicationId}/ownership/claim`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
