import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Documents } from "@/types/api";

export function useDocuments(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.documents(applicationId),
    queryFn: () => apiFetch<Documents>(`/api/applications/${applicationId}/documents`),
    enabled: !!applicationId,
  });
}
