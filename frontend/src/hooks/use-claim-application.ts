import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export const ACTIVE_RECRUITER_ID = "rose@dvtsoftware.com";

interface ClaimResponse {
  claimedByRecruiterId: string | null;
  claimedAt: string | null;
}

export function useClaimApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) =>
      apiFetch<ClaimResponse>(
        `/api/applications/${applicationId}/ownership/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recruiterIdentity: ACTIVE_RECRUITER_ID }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
