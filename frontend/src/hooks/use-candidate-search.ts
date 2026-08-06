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

export function useCandidateSearch(query: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { data, isLoading } = useApplications(undefined, { enabled });

  const groups = useMemo<CandidateSearchGroup[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const applications = data?.applications ?? [];
    const matches = applications
      .filter((application) =>
        application.candidateName.toLowerCase().includes(trimmed),
      )
      .slice(0, MAX_RESULTS);

    const byStatus = new Map<string, { status: CandidateApplication["currentStatus"]; candidates: CandidateApplication[] }>();
    for (const candidate of matches) {
      const key = candidate.currentStatus.toLowerCase();
      const bucket = byStatus.get(key);
      if (bucket) {
        bucket.candidates.push(candidate);
      } else {
        byStatus.set(key, { status: candidate.currentStatus, candidates: [candidate] });
      }
    }

    return Array.from(byStatus.values()).map(({ status, candidates }) => ({
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
