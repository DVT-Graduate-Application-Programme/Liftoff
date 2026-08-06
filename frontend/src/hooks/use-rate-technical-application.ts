import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Ownership } from "@/types/api";

interface RateTechnicalResponse {
  technicalRating: number | null;
  ratedByRecruiterId: string | null;
  ratedAt: string | null;
}

export function useRateTechnicalApplication(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rating }: { rating: number }) =>
      apiFetch<RateTechnicalResponse>(`/api/applications/${applicationId}/technical-rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<Ownership | undefined>(queryKeys.ownership(applicationId), (prev) =>
        prev ? { ...prev, ...data } : prev,
      );
    },
  });
}
