"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ListFilter, ListOrdered, X } from "lucide-react";
import type { ApplicationFilters } from "@/types/api";
import { cn } from "@/lib/utils";
import { ApplicantList } from "./applicant-list";

const PendingCandidates = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tier, setTier] = useState("");
  const [minScore, setMinScore] = useState("");
  const [hardGate, setHardGate] = useState("all");
  const [claimed, setClaimed] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sort, setSort] = useState<"score_desc" | "score_asc">("score_desc");

  const filters = useMemo(() => {
    const next: Omit<ApplicationFilters, "status" | "search" | "limit" | "cursor"> = { sort };
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
  }, [claimed, dateRange, hardGate, minScore, sort, tier]);

  const clearFilters = () => {
    setTier("");
    setMinScore("");
    setHardGate("all");
    setClaimed("all");
    setDateRange("all");
  };

  const activeFilters = [
    minScore && { label: `Score: ${minScore}+`, clear: () => { setMinScore(""); } },
    tier && { label: `Tier: ${tier.toLowerCase()}`, clear: () => { setTier(""); } },
    hardGate !== "all" && { label: hardGate === "passed" ? "Screening: passed" : "Screening: failed", clear: () => { setHardGate("all"); } },
    claimed !== "all" && { label: claimed === "claimed" ? "Claimed" : "Unclaimed", clear: () => { setClaimed("all"); } },
    dateRange !== "all" && { label: `Last ${dateRange} days`, clear: () => { setDateRange("all"); } },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <>
      <section className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Applicant Pipeline
            </h2>
            <p className="text-muted-foreground">
              Manage and screen incoming talent for the Engineering Team
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="pending-candidate-filters"
              onClick={() => { setFiltersOpen((open) => !open); }}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              <ListFilter size={16} />
              Advanced Filters
            </button>
            <button
              type="button"
              onClick={() => { setSort((value) => (value === "score_desc" ? "score_asc" : "score_desc")); }}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              <ListOrdered size={16} />
              Sort: {sort === "score_desc" ? "Higher" : "Lower"} System Score
            </button>
          </div>
        </div>
        {filtersOpen && (
          <div id="pending-candidate-filters" className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
            <FilterField label="Minimum score">
              <input aria-label="Minimum score" type="number" min="0" step="0.1" value={minScore} onChange={(event) => { setMinScore(event.target.value); }} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" placeholder="Any score" />
            </FilterField>
            <FilterField label="Candidate tier"><FilterSelect value={tier} onChange={setTier} options={[["", "All tiers"], ["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]} /></FilterField>
            <FilterField label="Screening"><FilterSelect value={hardGate} onChange={setHardGate} options={[["all", "All results"], ["passed", "Passed"], ["failed", "Failed"]]} /></FilterField>
            <FilterField label="Ownership"><FilterSelect value={claimed} onChange={setClaimed} options={[["all", "All candidates"], ["unclaimed", "Unclaimed"], ["claimed", "Claimed"]]} /></FilterField>
            <FilterField label="Received"><FilterSelect value={dateRange} onChange={setDateRange} options={[["all", "Any time"], ["7", "Last 7 days"], ["30", "Last 30 days"]]} /></FilterField>
          </div>
        )}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {activeFilters.map(({ label, clear }) => (
              <button key={label} type="button" onClick={() => { clear(); }} className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">
                {label}<X size={14} aria-hidden="true" />
              </button>
            ))}
            <button type="button" onClick={clearFilters} className="ml-2 text-[12px] font-bold text-primary">Clear all</button>
          </div>
        )}
      </section>

      <ApplicantList
        status="PENDING"
        filters={filters}
        emptyTitle="No pending applicants"
        showReviewedAt={false}
        groupByDate
      />
    </>
  );
};

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium text-foreground"><span>{label}</span>{children}</label>;
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <div className="relative"><select value={value} onChange={(event) => { onChange(event.target.value); }} className={cn("h-9 w-full appearance-none rounded-md border border-input bg-background px-2 pr-8 text-sm text-foreground")}>
    {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
  </select><ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-muted-foreground" /></div>;
}

export default PendingCandidates;
