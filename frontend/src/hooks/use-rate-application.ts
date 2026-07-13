import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { ACTIVE_RECRUITER_ID } from "@/hooks/use-claim-application";
import type { Ownership } from "@/types/api";

interface RateResponse {
  recruiterRating: number | null;
  recruiterRatingNote: string | null;
  ratedByRecruiterId: string | null;
  ratedAt: string | null;
}

export function useRateApplication(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rating, notes }: { rating: number; notes?: string }) =>
      apiFetch<RateResponse>(`/api/applications/${applicationId}/ownership/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterIdentity: ACTIVE_RECRUITER_ID, rating, notes }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<Ownership | undefined>(queryKeys.ownership(applicationId), (prev) =>
        prev ? { ...prev, ...data } : prev,
      );
    },
  });
}
