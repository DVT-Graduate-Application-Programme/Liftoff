"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { ApplicationFilters } from "@/types/api";
import { ApplicantList } from "./applicant-list";
import { useUrlFilterState } from "@/hooks/use-url-filter-state";
import {
  FilterBar,
  type ActiveFilter,
  type FilterFieldConfig,
  type SortOption,
} from "./filter-bar";
import { useApplicantSelection } from "@/components/providers/applicant-selection-provider";
import { useSidebar } from "@/components/ui/sidebar";
import {
  ACTIVE_RECRUITER_ID,
  useClaimApplication,
} from "@/hooks/use-claim-application";
import { useRecruiters } from "@/hooks/use-recruiters";
import { CandidateApplication } from "@/types/candidate";
import AllCandidateCard from "@/components/applicant-card/all-candidate-card";
import { useEvaluation } from "@/hooks/use-evaluation";
import {
  toScorePercent,
  getStatusLabel,
  getStatusTone,
  formatDate,
  getRecruiterLabel,
  parseEducationEvidence,
  getDisplayStatus,
} from "./candidate-list-utils";

type Filters = Omit<ApplicationFilters, "search" | "limit" | "cursor">;

const STATUS_OPTIONS: [string, string][] = [
  ["", "All statuses"],
  ["PENDING", "Pending"],
  ["shortlisted", "Shortlisted"],
  ["rejected", "Rejected"],
];

function AllCandidateListCard({
  application,
  isClaimedByActiveRecruiter,
  isClaiming,
  onClaim,
  onOpen,
}: {
  application: CandidateApplication;
  isClaimedByActiveRecruiter: boolean;
  isClaiming: boolean;
  onClaim: () => void;
  onOpen: () => void;
}) {
  const recruitersQuery = useRecruiters();
  const evaluationQuery = useEvaluation(application.applicationId);
  const education = parseEducationEvidence(
    evaluationQuery.data?.evidenceJson?.education.trim() ||
      application.cvSummary,
  );

  const academicAverage =
    evaluationQuery.data?.institutionJson?.academic_average ??
    evaluationQuery.data?.categoryScoresJson.education.score;
  const displayStatus = getDisplayStatus(application);
  const isClaimed = isClaimedByActiveRecruiter;

  if (application.currentStatus !== "shortlisted") {
    return (
      <AllCandidateCard
        key={application.applicationId}
        name={application.candidateName}
        institute={education.degree || application.cvSummary}
        subtitle={education.institution || undefined}
        systemScore={toScorePercent(application.hiringAgentTotalScore)}
        academicAverage={academicAverage}
        statusLabel={getStatusLabel(displayStatus)}
        statusTone={getStatusTone(displayStatus)}
        reviewedAt={formatDate(application.createdAt)}
        showReviewedAt={false}
        createdAt={application.createdAt}
        recruiterName={getRecruiterLabel(application, recruitersQuery.data)}
        secondaryActionLabel={isClaimed ? "Claimed" : "Claim for review"}
        isSecondaryActionDisabled={isClaimed || isClaiming}
        isSecondaryActionLoading={isClaiming}
        onSecondaryActionClick={isClaimed ? undefined : onClaim}
        onActionClick={onOpen}
      />
    );
  }
}

function AllCandidates() {
  const { data: session } = useSession();
  const recruiterIdentity = session?.user.email ?? ACTIVE_RECRUITER_ID;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useUrlFilterState("allStatus", "");
  const [minScore, setMinScore] = useUrlFilterState("allMinScore", "");
  const [ownership, setOwnership] = useUrlFilterState("allOwnership", "all");
  const [dateRange, setDateRange] = useUrlFilterState("allDateRange", "all");
  const [sort, setSort] = useUrlFilterState<SortOption>(
    "allSort",
    "date_desc",
  );

  const recruitersQuery = useRecruiters();

  const filters = useMemo(() => {
    const next: Filters = { sort, excludeRecruiterIdentity: recruiterIdentity };
    if (status) next.status = status;
    if (minScore) next.minScore = Number(minScore);
    if (ownership !== "all") next.recruiterIdentity = ownership;
    if (dateRange !== "all") {
      const from = new Date();
      from.setDate(from.getDate() - Number(dateRange));
      next.dateFrom = from.toISOString();
    }
    return next;
  }, [dateRange, minScore, ownership, recruiterIdentity, sort, status]);

  const clearFilters = () => {
    setStatus("");
    setMinScore("");
    setOwnership("all");
    setDateRange("all");
  };

  const fields: FilterFieldConfig[] = [
    {
      key: "status",
      label: "Application status",
      value: status,
      onChange: setStatus,
      options: STATUS_OPTIONS,
    },
    {
      key: "minScore",
      label: "Minimum score",
      type: "number",
      value: minScore,
      onChange: setMinScore,
      options: [],
      placeholder: "Any score",
    },
    {
      key: "ownership",
      label: "Ownership",
      value: ownership,
      onChange: setOwnership,
      options: [
        ["all", "All candidates"],
        ...(recruitersQuery.data ?? [])
          .filter(
            (recruiter) =>
              recruiter.isActive && recruiter.email !== recruiterIdentity,
          )
          .map((recruiter): [string, string] => [
            recruiter.email,
            recruiter.fullName,
          ]),
      ],
    },
    {
      key: "dateRange",
      label: "Received",
      value: dateRange,
      onChange: setDateRange,
      options: [
        ["all", "Any time"],
        ["7", "Last 7 days"],
        ["30", "Last 30 days"],
      ],
    },
  ];

  const activeFilters: ActiveFilter[] = [
    status && {
      label: `Status: ${status.toLowerCase().replaceAll("_", " ")}`,
      onClear: () => {
        setStatus("");
      },
    },
    minScore && {
      label: `Score: ${minScore}+`,
      onClear: () => {
        setMinScore("");
      },
    },
    ownership !== "all" && {
      label: `Owner: ${recruitersQuery.data?.find((recruiter) => recruiter.email === ownership)?.fullName ?? ownership}`,
      onClear: () => {
        setOwnership("all");
      },
    },
    dateRange !== "all" && {
      label: `Last ${dateRange} days`,
      onClear: () => {
        setDateRange("all");
      },
    },
  ].filter(Boolean) as ActiveFilter[];

  const { selectApplication } = useApplicantSelection();
  const { setOpen, setOpenMobile } = useSidebar();
  const claimMutation = useClaimApplication();

  return (
    <>
      <section className="mb-8 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Pipeline</h2>
          <p className="text-muted-foreground">
            Applicants assigned to other recruiters — claim one to add it to your queue
          </p>
        </div>
        <FilterBar
          id="all-candidate-filters"
          filtersOpen={filtersOpen}
          onToggleFilters={() => {
            setFiltersOpen((open) => !open);
          }}
          fields={fields}
          sort={sort}
          onSortChange={setSort}
          activeFilters={activeFilters}
          onClearAll={clearFilters}
        />
      </section>
      <ApplicantList
        tabKey="all"
        filters={filters}
        emptyTitle="No applicants yet"
        enableClaim
        groupByMarks
        renderCard={(application: CandidateApplication) => {
          const isClaimedByActiveRecruiter =
            application.claimedByRecruiterId === recruiterIdentity;
          const isClaiming =
            claimMutation.isPending &&
            claimMutation.variables === application.applicationId;

          return (
            <AllCandidateListCard
              key={application.applicationId}
              application={application}
              isClaimedByActiveRecruiter={isClaimedByActiveRecruiter}
              isClaiming={isClaiming}
              onClaim={() => {
                claimMutation.mutate(application.applicationId);
              }}
              onOpen={() => {
                selectApplication(application.applicationId, "all");
                setOpen(true);
                setOpenMobile(true);
              }}
            />
          );
        }}
      />
    </>
  );
}

export default AllCandidates;
