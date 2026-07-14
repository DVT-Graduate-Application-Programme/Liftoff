"use client";

import { useMemo, useState } from "react";
import type { ApplicationFilters } from "@/types/api";
import { ApplicantList } from "./applicant-list";
import { FilterBar, type ActiveFilter, type FilterFieldConfig, type SortOption } from "./filter-bar";

type Filters = Omit<ApplicationFilters, "status" | "search" | "limit" | "cursor">;

function AcceptedCandidates() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minScore, setMinScore] = useState("");
  const [claimed, setClaimed] = useState("all");
  const [sort, setSort] = useState<SortOption>("score_desc");

  const filters = useMemo(() => {
    const next: Filters = { sort };
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
        status="shortlisted"
        filters={filters}
        emptyTitle="No accepted applicants yet"
      />
    </>
  );
}

export default AcceptedCandidates;
