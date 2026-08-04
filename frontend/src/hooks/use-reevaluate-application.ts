import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { CandidateApplication } from "@/types/candidate";
import type { ApplicationDetail, PaginatedApplications } from "@/types/api";

function withProcessingStatus(applications: CandidateApplication[], applicationId: string) {
  return applications.map((application) =>
    application.applicationId === applicationId
      ? { ...application, currentStatus: "PROCESSING" as const }
      : application,
  );
}

export function useReevaluateApplication(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<unknown>(`/api/applications/${applicationId}/re-evaluate`, {
        method: "POST",
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ["applications"] });

      queryClient.setQueriesData<{ applications: CandidateApplication[] }>(
        { queryKey: queryKeys.applications() },
        (data) =>
          data
            ? { ...data, applications: withProcessingStatus(data.applications, applicationId) }
            : data,
      );

      queryClient.setQueriesData<{ pages: PaginatedApplications[] }>(
        { queryKey: ["applications", "infinite"] },
        (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  applications: withProcessingStatus(page.applications, applicationId),
                })),
              }
            : data,
      );

      queryClient.setQueryData<ApplicationDetail>(
        queryKeys.applicationDetail(applicationId),
        (data) => (data ? { ...data, currentStatus: "PROCESSING" } : data),
      );

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error("Couldn't re-evaluate application");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationDetail(applicationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicant(applicationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.evaluation(applicationId) });
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.logs() });
      toast.success("Application re-evaluation started");
    },
  });
}
