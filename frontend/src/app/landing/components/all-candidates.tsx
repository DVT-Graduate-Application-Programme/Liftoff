"use client";

import { useMemo, useState } from "react";
import type { ApplicationFilters } from "@/types/api";
import { ApplicantList } from "./applicant-list";
import {
  FilterBar,
  type ActiveFilter,
  type FilterFieldConfig,
  type SortOption,
} from "./filter-bar";
import { useRouter } from "next/navigation";
import { useApplicantSelection } from "@/components/providers/applicant-selection-provider";
import { useSidebar } from "@/components/ui/sidebar";
import {
  ACTIVE_RECRUITER_ID,
  useClaimApplication,
} from "@/hooks/use-claim-application";
import { CandidateApplication } from "@/types/candidate";
import AllCandidateCard from "@/components/applicant-card/all-candidate-card";
import {
  toScorePercent,
  statusLabels,
  statusTones,
  formatDate,
  getRecruiterLabel,
} from "./candidate-list-utils";

type Filters = Omit<ApplicationFilters, "search" | "limit" | "cursor">;

const STATUS_OPTIONS: [string, string][] = [
  ["", "All statuses"],
  ["PENDING", "Pending"],
  ["evaluated", "Evaluated"],
  ["forwarded", "Forwarded"],
  ["rejected", "Rejected"],
  ["shortlisted", "Shortlisted"],
];

function AllCandidates() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [tier, setTier] = useState("");
  const [minScore, setMinScore] = useState("");
  const [hardGate, setHardGate] = useState("all");
  const [claimed, setClaimed] = useState("all");
  const [shortlisted, setShortlisted] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sort, setSort] = useState<SortOption>("date_desc");

  const filters = useMemo(() => {
    const next: Filters = { sort };
    if (status) next.status = status;
    if (tier) next.tier = tier;
    if (minScore) next.minScore = Number(minScore);
    if (hardGate !== "all") next.hardGatePassed = hardGate === "passed";
    if (claimed !== "all") next.claimed = claimed === "claimed";
    if (shortlisted !== "all") next.shortlisted = shortlisted === "shortlisted";
    if (dateRange !== "all") {
      const from = new Date();
      from.setDate(from.getDate() - Number(dateRange));
      next.dateFrom = from.toISOString();
    }
    return next;
  }, [claimed, dateRange, hardGate, minScore, shortlisted, sort, status, tier]);

  const clearFilters = () => {
    setStatus("");
    setTier("");
    setMinScore("");
    setHardGate("all");
    setClaimed("all");
    setShortlisted("all");
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
      key: "tier",
      label: "Candidate tier",
      value: tier,
      onChange: setTier,
      options: [
        ["", "All tiers"],
        ["A", "A"],
        ["B", "B"],
        ["C", "C"],
        ["D", "D"],
      ],
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
        ["unclaimed", "Unclaimed"],
        ["claimed", "Claimed"],
      ],
    },
    {
      key: "shortlisted",
      label: "Shortlist",
      value: shortlisted,
      onChange: setShortlisted,
      options: [
        ["all", "All candidates"],
        ["shortlisted", "Shortlisted"],
        ["not-shortlisted", "Not shortlisted"],
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
    tier && {
      label: `Tier: ${tier.toLowerCase()}`,
      onClear: () => {
        setTier("");
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
    shortlisted !== "all" && {
      label: shortlisted === "shortlisted" ? "Shortlisted" : "Not shortlisted",
      onClear: () => {
        setShortlisted("all");
      },
    },
    dateRange !== "all" && {
      label: `Last ${dateRange} days`,
      onClear: () => {
        setDateRange("all");
      },
    },
  ].filter(Boolean) as ActiveFilter[];

  const router = useRouter();
  const { selectApplication } = useApplicantSelection();
  const { setOpen } = useSidebar();
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
        filters={filters}
        emptyTitle="No applicants yet"
        enableClaim
        renderCard={(application: CandidateApplication) => {
          const isClaimedByActiveRecruiter =
            application.claimedByRecruiterId === ACTIVE_RECRUITER_ID;
          const isClaiming =
            claimMutation.isPending &&
            claimMutation.variables === application.applicationId;

          return (
            <AllCandidateCard
              key={application.applicationId}
              name={application.candidateName}
              institute={application.cvSummary}
              systemScore={toScorePercent(application.hiringAgentTotalScore)}
              statusLabel={statusLabels[application.currentStatus]}
              statusTone={statusTones[application.currentStatus]}
              reviewedAt={formatDate(application.createdAt)}
              showReviewedAt
              createdAt={application.createdAt}
              recruiterName={getRecruiterLabel(application)}
              secondaryActionLabel={
                isClaimedByActiveRecruiter ? "Claimed" : "Claim for review"
              }
              isSecondaryActionDisabled={
                isClaimedByActiveRecruiter || isClaiming
              }
              isSecondaryActionLoading={isClaiming}
              onSecondaryActionClick={
                isClaimedByActiveRecruiter
                  ? undefined
                  : () => {
                      claimMutation.mutate(application.applicationId);
                    }
              }
              onClick={() => {
                router.push(`/applicants/${application.applicationId}`);
              }}
              onActionClick={() => {
                selectApplication(application.applicationId);
                setOpen(true);
              }}
            />
          );
        }}
      />
    </>
  );
}

export default AllCandidates;
