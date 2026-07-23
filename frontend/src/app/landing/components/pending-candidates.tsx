"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { ApplicationFilters } from "@/types/api";
import { ApplicantList } from "./applicant-list";
import { FilterBar, type ActiveFilter, type FilterFieldConfig, type SortOption } from "./filter-bar";
import { ACTIVE_RECRUITER_ID } from "@/hooks/use-claim-application";

const PendingCandidates = () => {
  const { data: session } = useSession();
  const recruiterIdentity = session?.user?.email ?? ACTIVE_RECRUITER_ID;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tier, setTier] = useState("");
  const [minScore, setMinScore] = useState("");
  const [hardGate, setHardGate] = useState("all");
  const [claimed, setClaimed] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sort, setSort] = useState<SortOption>("score_desc");

  const filters = useMemo(() => {
    const next: Omit<ApplicationFilters, "status" | "search" | "limit" | "cursor"> = { sort };
    next.recruiterIdentity = recruiterIdentity;
    if (tier) next.tier = tier;
    if (minScore) next.minScore = Number(minScore);
    if (hardGate !== "all") next.hardGatePassed = hardGate === "passed";
    if (claimed !== "all") next.claimed = claimed === "claimed";
    if (dateRange !== "all") {
      const from = new Date();
      from.setDate(from.getDate() - Number(dateRange));
      next.dateFrom = from.toISOString();
    }
    return next;
  }, [claimed, dateRange, hardGate, minScore, recruiterIdentity, sort, tier]);

  const clearFilters = () => {
    setTier("");
    setMinScore("");
    setHardGate("all");
    setClaimed("all");
    setDateRange("all");
  };

  const fields: FilterFieldConfig[] = [
    { key: "minScore", label: "Minimum score", type: "number", value: minScore, onChange: setMinScore, options: [], placeholder: "Any score" },
    { key: "tier", label: "Candidate tier", value: tier, onChange: setTier, options: [["", "All tiers"], ["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]] },
    { key: "hardGate", label: "Screening", value: hardGate, onChange: setHardGate, options: [["all", "All results"], ["passed", "Passed"], ["failed", "Failed"]] },
    { key: "claimed", label: "Ownership", value: claimed, onChange: setClaimed, options: [["all", "All candidates"], ["unclaimed", "Unclaimed"], ["claimed", "Claimed"]] },
    { key: "dateRange", label: "Received", value: dateRange, onChange: setDateRange, options: [["all", "Any time"], ["7", "Last 7 days"], ["30", "Last 30 days"]] },
  ];

  const activeFilters: ActiveFilter[] = [
    minScore && { label: `Score: ${minScore}+`, onClear: () => { setMinScore(""); } },
    tier && { label: `Tier: ${tier.toLowerCase()}`, onClear: () => { setTier(""); } },
    hardGate !== "all" && { label: hardGate === "passed" ? "Screening: passed" : "Screening: failed", onClear: () => { setHardGate("all"); } },
    claimed !== "all" && { label: claimed === "claimed" ? "Claimed" : "Unclaimed", onClear: () => { setClaimed("all"); } },
    dateRange !== "all" && { label: `Last ${dateRange} days`, onClear: () => { setDateRange("all"); } },
  ].filter(Boolean) as ActiveFilter[];

  return (
    <>
      <section className="flex flex-col gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Applicant Pipeline
          </h2>
          <p className="text-muted-foreground">
            Manage and screen incoming talent for the Engineering Team
          </p>
        </div>
        <FilterBar
          id="pending-candidate-filters"
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
        status="PENDING,PROCESSING"
        tabKey="pending"
        filters={filters}
        emptyTitle="No pending applicants"
        showReviewedAt={false}
        groupByDate
      />
    </>
  );
};

export default PendingCandidates;
