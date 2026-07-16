"use client";

import * as React from "react";
import AllCandidateCard from "@/components/applicant-card/all-candidate-card";
import { useRouter } from "next/navigation";
import { useApplications } from "@/hooks/use-applications";
import type { CandidateApplication } from "@/types/candidate";
import { ListFilter, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FilterField,
  FilterSelect,
  type ActiveFilter,
} from "@/app/landing/components/filter-bar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ApplicantDetailsSidebar } from "@/app/landing/components/applicant-details/applicant-details-sidebar";
import {
  ApplicantSelectionProvider,
  useApplicantSelection,
} from "@/components/providers/applicant-selection-provider";
import { useApplicant } from "@/hooks/use-applicant";
import { useEvaluation } from "@/hooks/use-evaluation";
import { getStatusLabel, parseEducationEvidence } from "@/app/landing/components/candidate-list-utils";

function SelectedApplicantDetailsSidebar() {
  const { selectedApplicationId, selectedTabKey } = useApplicantSelection();
  const applicantQuery = useApplicant(selectedApplicationId ?? "");
  const evaluationQuery = useEvaluation(selectedApplicationId ?? "");

  const evaluationMessage = !selectedApplicationId
    ? "Select a candidate's “Show AI Summary” to view their evaluation here."
    : evaluationQuery.isError
      ? "Couldn't load evaluation."
      : null;

  return (
    <ApplicantDetailsSidebar
      applicantId={selectedApplicationId}
      candidateName={applicantQuery.data?.candidateName ?? "Applicant"}
      evaluation={evaluationQuery.data ?? null}
      isLoadingEvaluation={Boolean(selectedApplicationId) && (applicantQuery.isLoading || evaluationQuery.isLoading)}
      evaluationMessage={evaluationMessage}
      tabKey={selectedTabKey}
    />
  );
}

// Filter bar — restyled to match the dashboard tabs' FilterBar shell
// (toggle button, collapsible field grid, active-filter chips), while
// keeping History's own client-side filtering and date-range control.
const HISTORY_STATUS_OPTIONS: [string, string][] = [
  ["All", "All statuses"],
  ["Pending", "Pending"],
  ["Rejected", "Rejected"],
  ["Shortlisted", "Shortlisted"],
];

const HISTORY_SCORE_OPTIONS: [string, string][] = [
  ["All", "All tiers"],
  ["STRONG", "Strong"],
  ["BORDERLINE", "Borderline"],
  ["WEAK", "Weak"],
];

function HistoryFilterBar({
  filtersOpen,
  onToggleFilters,
  status,
  onStatusChange,
  score,
  onScoreChange,
  dateRange,
  onDateRangeChange,
  activeFilters,
  onClearAll,
}: {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  status: string;
  onStatusChange: (value: string) => void;
  score: string;
  onScoreChange: (value: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (value: { start: string; end: string }) => void;
  activeFilters: ActiveFilter[];
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="history-filters"
          onClick={onToggleFilters}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-foreground transition-colors hover:bg-muted"
        >
          <ListFilter size={16} />
          Advanced Filters
        </button>
      </div>
      {filtersOpen && (
        <div
          id="history-filters"
          className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FilterField label="Status">
            <FilterSelect value={status} onChange={onStatusChange} options={HISTORY_STATUS_OPTIONS} />
          </FilterField>
          <FilterField label="System Score">
            <FilterSelect value={score} onChange={onScoreChange} options={HISTORY_SCORE_OPTIONS} />
          </FilterField>
          <FilterField label="Received from">
            <input
              aria-label="Received from"
              type="date"
              value={dateRange.start}
              onChange={(event) => {
                onDateRangeChange({ ...dateRange, start: event.target.value });
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            />
          </FilterField>
          <FilterField label="Received to">
            <input
              aria-label="Received to"
              type="date"
              value={dateRange.end}
              onChange={(event) => {
                onDateRangeChange({ ...dateRange, end: event.target.value });
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            />
          </FilterField>
        </div>
      )}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <Badge key={filter.label} variant="outline" className="gap-1.5 px-3 py-1">
              {filter.label}
              <button type="button" onClick={filter.onClear} aria-label={`Clear ${filter.label}`}>
                ×
              </button>
            </Badge>
          ))}
          <Button type="button" variant="ghost" size="sm" className="h-5 px-2 text-xs" onClick={onClearAll}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

function CandidateHistoryCard({
  candidate,
}: {
  candidate: CandidateApplication;
}) {
  const router = useRouter();
  const { selectApplication } = useApplicantSelection();
  const { setOpen } = useSidebar();
  const evaluationQuery = useEvaluation(candidate.applicationId);

  const handleCardClick = () => {
    router.push(`/applicants/${candidate.applicationId}?from=history`);
  };

  const getStatusTone = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SHORTLISTED") return "positive";
    if (s === "REJECTED") return "negative";
    return "neutral";
  };

  const getTierTone = (tier: string) => {
    const t = tier.toUpperCase();
    if (t === "STRONG") return "positive";
    if (t === "BORDERLINE") return "warning";
    if (t === "WEAK") return "negative";
    return "neutral";
  };

  const education = parseEducationEvidence(
    evaluationQuery.data?.evidenceJson?.education.trim() || candidate.cvSummary,
  );
  const institutionName = evaluationQuery.data?.institutionJson?.name ?? education.institution;
  const degreeName = evaluationQuery.data?.institutionJson?.degreeName ?? education.degree;
  const subtitle =
    degreeName && institutionName
      ? `${degreeName} · ${institutionName}`
      : degreeName || institutionName || "Applicant";

  const academicAverage =
    evaluationQuery.data?.institutionJson?.academic_average ??
    evaluationQuery.data?.categoryScoresJson.education.score;

  return (
      <AllCandidateCard
      key={candidate.applicationId}
      name={candidate.candidateName}
      subtitle={subtitle}
      academicAverage={academicAverage}
      systemScore={candidate.hiringAgentTotalScore}
      scoreLabel="Sys Score"
      scoreClassName="font-semibold"
      layout="history"
      statusLabel={getStatusLabel(candidate.currentStatus)}
      statusTone={getStatusTone(candidate.currentStatus)}
      tierLabel={candidate.tier}
      tierTone={getTierTone(candidate.tier)}
      reviewedAt={new Date(candidate.createdAt).toLocaleDateString()}
      showReviewedAt={true}
      createdAt={candidate.createdAt}
      onClick={handleCardClick}
      onActionClick={() => {
        selectApplication(candidate.applicationId, "history");
        setOpen(true);
      }}
      secondaryActionLabel="View Applicant"
      onSecondaryActionClick={() => {
        handleCardClick();
      }}
    />
  );
}

function DateGroup({
  label,
  candidates,
}: {
  label: string;
  candidates: CandidateApplication[];
}) {
  if (candidates.length === 0) return null;

  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground tracking-wide">
          {label}
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="flex flex-col gap-2.5">
        {candidates.map((c) => (
          <CandidateHistoryCard
            key={c.applicationId}
            candidate={c}
          />
        ))}
      </div>
    </section>
  );
}

export default function HistoryPage() {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filterDecision, setFilterDecision] = React.useState("All");
  const [filterDateRange, setFilterDateRange] = React.useState({ start: "", end: "" });
  const [filterScore, setFilterScore] = React.useState("All");

  const clearFilters = () => {
    setFilterDecision("All");
    setFilterDateRange({ start: "", end: "" });
    setFilterScore("All");
  };

  const activeFilters: ActiveFilter[] = [
    filterDecision !== "All" && {
      label: `Status: ${filterDecision}`,
      onClear: () => { setFilterDecision("All"); },
    },
    filterScore !== "All" && {
      label: `Tier: ${filterScore}`,
      onClear: () => { setFilterScore("All"); },
    },
    (filterDateRange.start || filterDateRange.end) && {
      label: `Received: ${filterDateRange.start || "Any"} to ${filterDateRange.end || "Any"}`,
      onClear: () => { setFilterDateRange({ start: "", end: "" }); },
    },
  ].filter(Boolean) as ActiveFilter[];

  const { data, isLoading, error } = useApplications();
  const applications = data?.applications || [];

  let filteredCandidates = applications;
  
  if (filterDecision !== "All") {
    filteredCandidates = filteredCandidates.filter(
      (c: CandidateApplication) =>
        c.currentStatus.toLowerCase() === filterDecision.toLowerCase(),
    );
  }
  if (filterScore !== "All") {
    filteredCandidates = filteredCandidates.filter(
      (c: CandidateApplication) =>
        c.tier.toLowerCase() === filterScore.toLowerCase(),
    );
  }

  if (filterDateRange.start) {
    const [year, month, day] = filterDateRange.start.split("-").map(Number);
    const startObj = new Date(year, month - 1, day, 0, 0, 0, 0);
    filteredCandidates = filteredCandidates.filter((c: CandidateApplication) => new Date(c.createdAt) >= startObj);
  }
  if (filterDateRange.end) {
    const [year, month, day] = filterDateRange.end.split("-").map(Number);
    const endObj = new Date(year, month - 1, day, 23, 59, 59, 999);
    filteredCandidates = filteredCandidates.filter((c: CandidateApplication) => new Date(c.createdAt) <= endObj);
  }

  let groups: { label: string; candidates: CandidateApplication[] }[] = [];
  
  if (filteredCandidates.length > 0) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    const todayCandidates = filteredCandidates.filter((c: CandidateApplication) => new Date(c.createdAt) >= todayStart);
    const yesterdayCandidates = filteredCandidates.filter(
      (c: CandidateApplication) => new Date(c.createdAt) >= yesterdayStart && new Date(c.createdAt) < todayStart
    );
    const earlierCandidates = filteredCandidates.filter((c: CandidateApplication) => new Date(c.createdAt) < yesterdayStart);

    groups = [
      { label: "Processed Today", candidates: todayCandidates },
      { label: "Processed Yesterday", candidates: yesterdayCandidates },
      { label: "Earlier", candidates: earlierCandidates },
    ];
  }

  groups = groups.filter((g) => g.candidates.length > 0);

  return (
    <ApplicantSelectionProvider>
      <div className="w-full overflow-hidden">
        <SidebarProvider defaultOpen={false} className="min-h-0 w-full">
          <div className="flex h-full min-h-0 w-full overflow-hidden">
            <SidebarInset className="flex-1 overflow-y-auto">
              <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-6">

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        Review History
                      </h1>
                      <p className="mt-1 text-sm text-muted-foreground max-w-md">
                        An audit trail of all candidate applications.
                      </p>
                    </div>
                  </div>

                  <HistoryFilterBar
                    filtersOpen={filtersOpen}
                    onToggleFilters={() => { setFiltersOpen((open) => !open); }}
                    status={filterDecision}
                    onStatusChange={setFilterDecision}
                    score={filterScore}
                    onScoreChange={setFilterScore}
                    dateRange={filterDateRange}
                    onDateRangeChange={setFilterDateRange}
                    activeFilters={activeFilters}
                    onClearAll={clearFilters}
                  />

                  {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                      <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : error ? (
                    <div className="flex h-64 items-center justify-center text-destructive">
                      <p>Error loading history.</p>
                    </div>
                  ) : filteredCandidates.length === 0 ? (
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
                      <p className="text-sm text-muted-foreground">No candidate history matches your filters.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-8">
                      {groups.map(({ label, candidates }) => (
                        <DateGroup
                          key={label}
                          label={label}
                          candidates={candidates}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </main>
            </SidebarInset>
            <SelectedApplicantDetailsSidebar />
          </div>
        </SidebarProvider>
      </div>
    </ApplicantSelectionProvider>
  );
}
