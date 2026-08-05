import { useMemo } from "react";
import { useApplications } from "@/hooks/use-applications";
import { getStatusLabel } from "@/app/landing/components/candidate-list-utils";
import type { CandidateApplication } from "@/types/candidate";

const MAX_RESULTS = 8;

export interface CandidateSearchGroup {
  status: CandidateApplication["currentStatus"];
  label: string;
  candidates: CandidateApplication[];
}

export function useCandidateSearch(query: string) {
  const { data, isLoading } = useApplications();

  const groups = useMemo<CandidateSearchGroup[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const applications = data?.applications ?? [];
    const matches = applications
      .filter((application) =>
        application.candidateName.toLowerCase().includes(trimmed),
      )
      .slice(0, MAX_RESULTS);

    const byStatus = new Map<CandidateApplication["currentStatus"], CandidateApplication[]>();
    for (const candidate of matches) {
      const bucket = byStatus.get(candidate.currentStatus);
      if (bucket) {
        bucket.push(candidate);
      } else {
        byStatus.set(candidate.currentStatus, [candidate]);
      }
    }

    return Array.from(byStatus.entries()).map(([status, candidates]) => ({
      status,
      label: getStatusLabel(status),
      candidates,
    }));
  }, [data, query]);

  return {
    groups,
    isLoading,
    hasQuery: query.trim().length > 0,
  };
}
