"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationFilters } from "@/types/api";
import { useApplicationDetail } from "@/hooks/use-application-detail";
import { useEvaluation } from "@/hooks/use-evaluation";
import { useOwnership } from "@/hooks/use-ownership";
import { useApplicantSelection } from "@/components/providers/applicant-selection-provider";
import { useSidebar } from "@/components/ui/sidebar";
import ApplicantCard from "@/components/applicant-card/applicant-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicantList } from "./applicant-list";
import { FilterBar, type ActiveFilter, type FilterFieldConfig, type SortOption } from "./filter-bar";
import type { CandidateApplication } from "@/types/candidate";
import { formatDate } from "./candidate-list-utils";

type Filters = Omit<ApplicationFilters, "status" | "search" | "limit" | "cursor">;

function AcceptedCandidateCard({ application }: { application: CandidateApplication }) {
  const router = useRouter();
  const { selectApplication } = useApplicantSelection();
  const { setOpen } = useSidebar();
  const detailQuery = useApplicationDetail(application.applicationId);
  const evaluationQuery = useEvaluation(application.applicationId);
  const ownershipQuery = useOwnership(application.applicationId);

  const applicationDetail = detailQuery.data;
  const evaluation = evaluationQuery.data;
  const ownership = ownershipQuery.data;

  const isLoading =
    detailQuery.isLoading ||
    evaluationQuery.isLoading ||
    ownershipQuery.isLoading;

  if (isLoading) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  if (!applicationDetail) {
    return null;
  }

  const institution = evaluation?.institutionJson;
  const academicAverage =
    institution?.academic_average ?? evaluation?.categoryScoresJson.education.score;
  const reviewedAt = ownership?.shortlistedAt ?? applicationDetail.updatedAt;

  return (
    <ApplicantCard
      name={application.candidateName}
      institute={institution?.degreeName ?? "Applicant"}
      secondaryInstitute={institution?.name}
      academicAverage={academicAverage}
      systemScore={Math.round(application.hiringAgentTotalScore)}
      scoreLabel="System Score"
      secondaryScoreLabel="Academic Avg"
      showStatus={false}
      statusTone="neutral"
      showReviewedAt
      reviewedAt={formatDate(reviewedAt)}
      createdAt={application.createdAt}
      wrapInstitute
      wrapReviewedAt
      actionLabel="View AI Summary"
      actionVariant="default"
      onActionClick={() => {
        selectApplication(application.applicationId, "accepted");
        setOpen(true);
      }}
      secondaryActionLabel="View details"
      onSecondaryActionClick={() => {
        router.push(`/applicants/${application.applicationId}?from=accepted`);
      }}
      stackActions
      onClick={() => {
        router.push(`/applicants/${application.applicationId}?from=accepted`);
      }}
      showInstitute
    />
  );
}

function AcceptedCandidates() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minScore, setMinScore] = useState("");
  const [claimed, setClaimed] = useState("all");
  const [sort, setSort] = useState<SortOption>("score_desc");

  const filters = useMemo(() => {
    const next: Filters = { sort, shortlisted: true };
    if (minScore) next.minScore = Number(minScore);
    if (claimed !== "all") next.claimed = claimed === "claimed";
    return next;
  }, [claimed, minScore, sort]);

  const clearFilters = () => {
    setMinScore("");
    setClaimed("all");
  };

  const fields: FilterFieldConfig[] = [
    { key: "minScore", label: "Minimum score", type: "number", value: minScore, onChange: setMinScore, options: [], placeholder: "Any score" },
    { key: "claimed", label: "Ownership", value: claimed, onChange: setClaimed, options: [["all", "All candidates"], ["unclaimed", "Unclaimed"], ["claimed", "Claimed"]] },
  ];

  const activeFilters: ActiveFilter[] = [
    minScore && { label: `Score: ${minScore}+`, onClear: () => { setMinScore(""); } },
    claimed !== "all" && { label: claimed === "claimed" ? "Claimed" : "Unclaimed", onClear: () => { setClaimed("all"); } },
  ].filter(Boolean) as ActiveFilter[];

  return (
    <>
      <section className="mb-8 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Accepted Applicants</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Narrow the shortlist and reorder it by the signal that matters most.
          </p>
        </div>
        <FilterBar
          id="accepted-candidate-filters"
          filtersOpen={filtersOpen}
          onToggleFilters={() => { setFiltersOpen((open) => !open); }}
          fields={fields}
          sort={sort}
          onSortChange={setSort}
          activeFilters={activeFilters}
          onClearAll={clearFilters}
        />
      </section>
      <ApplicantList
        tabKey="accepted"
        filters={filters}
        emptyTitle="No accepted applicants yet"
        renderItem={(candidate) => <AcceptedCandidateCard application={candidate} />}
      />
    </>
  );
}

export default AcceptedCandidates;
