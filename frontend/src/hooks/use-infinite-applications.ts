import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ApplicationFilters, PaginatedApplications } from "@/types/api";

function toQueryString(filters: ApplicationFilters, cursor: number) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.hardGatePassed !== undefined) params.set("hardGatePassed", String(filters.hardGatePassed));
  if (filters.claimed !== undefined) params.set("claimed", String(filters.claimed));
  if (filters.shortlisted !== undefined) params.set("shortlisted", String(filters.shortlisted));
  if (filters.recruiterIdentity) params.set("recruiterIdentity", filters.recruiterIdentity);
  if (filters.excludeRecruiterIdentity) params.set("excludeRecruiterIdentity", filters.excludeRecruiterIdentity);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.search) params.set("search", filters.search);
  if (filters.minScore !== undefined) params.set("minScore", String(filters.minScore));
  if (filters.sort) params.set("sort", filters.sort);
  params.set("limit", String(filters.limit ?? 6));
  params.set("cursor", String(cursor));
  return params.toString();
}

export function useInfiniteApplications(filters: ApplicationFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.infiniteApplications(filters),
    queryFn: ({ pageParam }) =>
      apiFetch<PaginatedApplications>(`/api/applications?${toQueryString(filters, pageParam)}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
