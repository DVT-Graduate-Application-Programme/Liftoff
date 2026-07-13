import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ApplicationFilters } from "@/types/api";
import type { CandidateApplication } from "@/types/candidate";

function toQueryString(filters?: ApplicationFilters) {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.hardGatePassed !== undefined) params.set("hardGatePassed", String(filters.hardGatePassed));
  if (filters.claimed !== undefined) params.set("claimed", String(filters.claimed));
  if (filters.shortlisted !== undefined) params.set("shortlisted", String(filters.shortlisted));
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useApplications(filters?: ApplicationFilters) {
  return useQuery({
    queryKey: queryKeys.applications(filters),
    queryFn: () =>
      apiFetch<{ applications: CandidateApplication[] }>(`/api/applications${toQueryString(filters)}`),
  });
}
