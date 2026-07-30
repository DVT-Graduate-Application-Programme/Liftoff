"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationFilters } from "@/types/api";
import { useApplicationDetail } from "@/hooks/use-application-detail";
import { useEvaluation } from "@/hooks/use-evaluation";
import { useOwnership } from "@/hooks/use-ownership";
import { useRecruiters } from "@/hooks/use-recruiters";
import { useApplicantSelection } from "@/components/providers/applicant-selection-provider";
import { useSidebar } from "@/components/ui/sidebar";
import ApplicantCard from "@/components/applicant-card/applicant-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicantList } from "./applicant-list";
import { FilterBar, type ActiveFilter, type FilterFieldConfig, type SortOption } from "./filter-bar";
import type { CandidateApplication } from "@/types/candidate";
import { getRecruiterLabel } from "./candidate-list-utils";
type Filters = Omit<ApplicationFilters, "status" | "search" | "limit" | "cursor">;

function AcceptedCandidateCard({ application }: { application: CandidateApplication }) {
  const router = useRouter();
  const { selectApplication } = useApplicantSelection();
  const { setOpen, setOpenMobile } = useSidebar();
  const detailQuery = useApplicationDetail(application.applicationId);
  const evaluationQuery = useEvaluation(application.applicationId);
  const ownershipQuery = useOwnership(application.applicationId);
  const recruitersQuery = useRecruiters();

  const applicationDetail = detailQuery.data;
  const evaluation = evaluationQuery.data;

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
  const recruiterName = getRecruiterLabel(application, recruitersQuery.data);

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
      createdAt={application.createdAt}
      wrapInstitute
      recruiterLabel="Recruiter"
      recruiterName={recruiterName ?? undefined}
      actionLabel="View AI Summary"
      actionVariant="default"
      onActionClick={() => {
        selectApplication(application.applicationId, "accepted");
        setOpen(true);
        setOpenMobile(true);
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
  const [ownership, setOwnership] = useState("all");
  const [sort, setSort] = useState<SortOption>("score_desc");

  const recruitersQuery = useRecruiters();

  const filters = useMemo(() => {
    const next: Filters = { sort, shortlisted: true };
    if (minScore) next.minScore = Number(minScore);
    if (ownership === "unclaimed") next.claimed = false;
    else if (ownership !== "all") next.recruiterIdentity = ownership;
    return next;
  }, [minScore, ownership, sort]);

  const clearFilters = () => {
    setMinScore("");
    setOwnership("all");
  };

  const fields: FilterFieldConfig[] = [
    { key: "minScore", label: "Minimum score", type: "number", value: minScore, onChange: setMinScore, options: [], placeholder: "Any score" },
    {
      key: "ownership",
      label: "Ownership",
      value: ownership,
      onChange: setOwnership,
      options: [
        ["all", "All candidates"],
        ["unclaimed", "Unclaimed"],
        ...(recruitersQuery.data ?? [])
          .filter((recruiter) => recruiter.isActive)
          .map((recruiter): [string, string] => [recruiter.email, recruiter.fullName]),
      ],
    },
  ];

  const activeFilters: ActiveFilter[] = [
    minScore && { label: `Score: ${minScore}+`, onClear: () => { setMinScore(""); } },
    ownership !== "all" && {
      label:
        ownership === "unclaimed"
          ? "Unclaimed"
          : `Owner: ${recruitersQuery.data?.find((recruiter) => recruiter.email === ownership)?.fullName ?? ownership}`,
      onClear: () => { setOwnership("all"); },
    },
  ].filter(Boolean) as ActiveFilter[];

  return (
    <>
      <section className="mb-8 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Shortlist</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every shortlisted candidate, across the team — narrow it down and reorder by what matters most
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
