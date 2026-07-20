"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { ApplicationFilters } from "@/types/api";
import { ApplicantList } from "./applicant-list";
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
  ["evaluated", "Evaluated"],
  ["forwarded", "Forwarded"],
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
  const evaluationQuery = useEvaluation(application.applicationId);
  const education = parseEducationEvidence(
    evaluationQuery.data?.evidenceJson?.education.trim() ||
      application.cvSummary,
  );

  const academicAverage =
    evaluationQuery.data?.institutionJson?.academic_average ??
    evaluationQuery.data?.categoryScoresJson.education.score;
  const displayStatus = getDisplayStatus(application);

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
        recruiterName={getRecruiterLabel(application)}
        secondaryActionLabel={
          isClaimedByActiveRecruiter ? "Claimed" : "Claim for review"
        }
        isSecondaryActionDisabled={isClaimedByActiveRecruiter || isClaiming}
        isSecondaryActionLoading={isClaiming}
        onSecondaryActionClick={
          isClaimedByActiveRecruiter ? undefined : onClaim
        }
        onActionClick={onOpen}
      />
    );
  }
}

function AllCandidates() {
  const { data: session } = useSession();
  const recruiterIdentity = session?.user?.email ?? ACTIVE_RECRUITER_ID;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [minScore, setMinScore] = useState("");
  const [hardGate, setHardGate] = useState("all");
  const [claimed, setClaimed] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sort, setSort] = useState<SortOption>("date_desc");

  const filters = useMemo(() => {
    const next: Filters = { sort };
    if (status) next.status = status;
    if (minScore) next.minScore = Number(minScore);
    if (hardGate !== "all") next.hardGatePassed = hardGate === "passed";
    if (claimed !== "all") next.claimed = claimed === "claimed";
    if (dateRange !== "all") {
      const from = new Date();
      from.setDate(from.getDate() - Number(dateRange));
      next.dateFrom = from.toISOString();
    }
    return next;
  }, [claimed, dateRange, hardGate, minScore, sort, status]);

  const clearFilters = () => {
    setStatus("");
    setMinScore("");
    setHardGate("all");
    setClaimed("all");
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
      key: "hardGate",
      label: "Screening",
      value: hardGate,
      onChange: setHardGate,
      options: [
        ["all", "All results"],
        ["passed", "Passed"],
        ["failed", "Failed"],
      ],
    },
    {
      key: "claimed",
      label: "Ownership",
      value: claimed,
      onChange: setClaimed,
      options: [
        ["all", "All candidates"],
        ["rose@dvtsoftware.com", "Rose"],
        [recruiterIdentity, "Current recruiter"],
        ["recruiter-123", "Recruiter 123"],
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
    hardGate !== "all" && {
      label: hardGate === "passed" ? "Screening: passed" : "Screening: failed",
      onClear: () => {
        setHardGate("all");
      },
    },
    claimed !== "all" && {
      label: claimed === "claimed" ? "Claimed" : "Unclaimed",
      onClear: () => {
        setClaimed("all");
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
        <h2 className="text-2xl font-bold text-foreground">All Applicants</h2>
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
