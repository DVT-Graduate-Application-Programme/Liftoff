"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ListFilter, ListOrdered, X } from "lucide-react";
import type { ApplicationFilters } from "@/types/api";
import { cn } from "@/lib/utils";
import { ApplicantList } from "./applicant-list";

type Filters = Omit<ApplicationFilters, "search" | "limit" | "cursor">;

const STATUS_OPTIONS = [
  ["", "All statuses"],
  ["PENDING", "Pending"],
  ["evaluated", "Evaluated"],
  ["forwarded", "Forwarded"],
  ["rejected", "Rejected"],
  ["shortlisted", "Shortlisted"],
] as [string, string][];

function AllCandidates() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [tier, setTier] = useState("");
  const [minScore, setMinScore] = useState("");
  const [hardGate, setHardGate] = useState("all");
  const [claimed, setClaimed] = useState("all");
  const [shortlisted, setShortlisted] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sort, setSort] =
    useState<NonNullable<ApplicationFilters["sort"]>>("date_desc");

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

  const activeFilters = [
    status && {
      label: `Status: ${status.toLowerCase().replaceAll("_", " ")}`,
      clear: () => {
        setStatus("");
      },
    },
    tier && {
      label: `Tier: ${tier.toLowerCase()}`,
      clear: () => {
        setTier("");
      },
    },
    minScore && {
      label: `Score: ${minScore}+`,
      clear: () => {
        setMinScore("");
      },
    },
    hardGate !== "all" && {
      label: hardGate === "passed" ? "Screening: passed" : "Screening: failed",
      clear: () => {
        setHardGate("all");
      },
    },
    claimed !== "all" && {
      label: claimed === "claimed" ? "Claimed" : "Unclaimed",
      clear: () => {
        setClaimed("all");
      },
    },
    shortlisted !== "all" && {
      label: shortlisted === "shortlisted" ? "Shortlisted" : "Not shortlisted",
      clear: () => {
        setShortlisted("all");
      },
    },
    dateRange !== "all" && {
      label: `Last ${dateRange} days`,
      clear: () => {
        setDateRange("all");
      },
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <>
      <section className="mb-8 flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">All Applicants</h2>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="all-candidate-filters"
              onClick={() => {
                setFiltersOpen((open) => !open);
              }}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-foreground transition-colors hover:bg-muted"
            >
              <ListFilter size={16} /> Advanced Filters
            </button>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-foreground">
              <ListOrdered size={16} aria-hidden="true" />
              <span className="sr-only">Sort applicants</span>
              <select
                aria-label="Sort applicants"
                value={sort}
                onChange={(event) => {
                  setSort(
                    event.target.value as NonNullable<
                      ApplicationFilters["sort"]
                    >,
                  );
                }}
                className="appearance-none bg-transparent pr-1 text-sm outline-none"
              >
                <option value="date_desc">Newest application</option>
                <option value="date_asc">Oldest application</option>
                <option value="score_desc">Highest score</option>
                <option value="score_asc">Lowest score</option>
              </select>
              <ChevronDown
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </label>
          </div>
        </div>
        {filtersOpen && (
          <div
            id="all-candidate-filters"
            className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <FilterField label="Application status">
              <FilterSelect
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
              />
            </FilterField>
            <FilterField label="Minimum score">
              <input
                aria-label="Minimum score"
                type="number"
                min="0"
                step="0.1"
                value={minScore}
                onChange={(event) => {
                  setMinScore(event.target.value);
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                placeholder="Any score"
              />
            </FilterField>
            <FilterField label="Candidate tier">
              <FilterSelect
                value={tier}
                onChange={setTier}
                options={[
                  ["", "All tiers"],
                  ["A", "A"],
                  ["B", "B"],
                  ["C", "C"],
                  ["D", "D"],
                ]}
              />
            </FilterField>
            <FilterField label="Screening">
              <FilterSelect
                value={hardGate}
                onChange={setHardGate}
                options={[
                  ["all", "All results"],
                  ["passed", "Passed"],
                  ["failed", "Failed"],
                ]}
              />
            </FilterField>
            <FilterField label="Ownership">
              <FilterSelect
                value={claimed}
                onChange={setClaimed}
                options={[
                  ["all", "All candidates"],
                  ["unclaimed", "Unclaimed"],
                  ["claimed", "Claimed"],
                ]}
              />
            </FilterField>
            <FilterField label="Shortlist">
              <FilterSelect
                value={shortlisted}
                onChange={setShortlisted}
                options={[
                  ["all", "All candidates"],
                  ["shortlisted", "Shortlisted"],
                  ["not-shortlisted", "Not shortlisted"],
                ]}
              />
            </FilterField>
            <FilterField label="Received">
              <FilterSelect
                value={dateRange}
                onChange={setDateRange}
                options={[
                  ["all", "Any time"],
                  ["7", "Last 7 days"],
                  ["30", "Last 30 days"],
                ]}
              />
            </FilterField>
          </div>
        )}
        {activeFilters.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="Active filters"
          >
            {activeFilters.map(({ label, clear }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  clear();
                }}
                className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary"
              >
                {label}
                <X size={14} aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-2 text-[12px] font-bold text-primary"
            >
              Clear all
            </button>
          </div>
        )}
      </section>
      <ApplicantList
        filters={filters}
        emptyTitle="No applicants yet"
        enableClaim
      />
    </>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-input bg-background px-2 pr-8 text-sm text-foreground",
        )}
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-muted-foreground" />
    </div>
  );
}

export default AllCandidates;
