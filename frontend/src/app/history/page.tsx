"use client";

import * as React from "react";
import AllCandidateCard from "@/components/applicant-card/all-candidate-card";
import { useRouter } from "next/navigation";
import { useApplications } from "@/hooks/use-applications";
import type { CandidateApplication } from "@/types/candidate";
import {
  ChevronDown,
  Calendar,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ApplicantDetailsSidebar } from "@/app/landing/components/applicant-details/applicant-details-sidebar";
import {
  ApplicantSelectionProvider,
  useApplicantSelection,
} from "@/components/providers/applicant-selection-provider";
import { useApplicant } from "@/hooks/use-applicant";
import { useEvaluation } from "@/hooks/use-evaluation";

function SelectedApplicantDetailsSidebar() {
  const { selectedApplicationId } = useApplicantSelection();
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
    />
  );
}

// Filter Components
function FilterDateRangePicker({
  value,
  onChange,
}: {
  value: { start: string; end: string };
  onChange: (val: { start: string; end: string }) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const hasFilter = value.start || value.end;
  const label = hasFilter 
    ? `${value.start || "Any"} to ${value.end || "Any"}`
    : "Date Range";

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground",
          "transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          open && "bg-muted border-ring/30",
          hasFilter && "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
        )}
      >
        <Calendar className="size-3.5 text-muted-foreground" />
        {label}
        {hasFilter ? (
          <XCircle 
            className="size-3.5 text-muted-foreground hover:text-foreground ml-1" 
            onClick={(e) => {
              e.stopPropagation();
              onChange({ start: "", end: "" });
            }}
          />
        ) : (
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-20 min-w-64 rounded-xl border border-border bg-card p-3 shadow-lg ring-1 ring-foreground/5">
          <p className="mb-2 text-xs text-muted-foreground font-medium">Select Date Range</p>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">From</label>
              <input
                type="date"
                value={value.start}
                onChange={(e) => {
                  onChange({ ...value, start: e.target.value });
                }}
                className="w-full h-8 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">To</label>
              <input
                type="date"
                value={value.end}
                onChange={(e) => {
                  onChange({ ...value, end: e.target.value });
                }}
                className="w-full h-8 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                setOpen(false);
              }}
            >
              Apply Range
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterDropdown({
  label,
  icon,
  options = [],
  value = "All",
  onChange = () => {},
}: {
  label: string;
  icon?: React.ReactNode;
  options?: string[];
  value?: string;
  onChange?: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground",
          "transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          open && "bg-muted border-ring/30"
        )}
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {value === "All" ? label : value}
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-20 min-w-40 rounded-xl border border-border bg-card p-1 shadow-lg ring-1 ring-foreground/5">
          <p className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
            Options
          </p>
        {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
            >
              {opt}
            </button>
          ))}
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
    router.push(`/applicants/${candidate.applicationId}`);
  };

  const getStatusTone = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SHORTLISTED" || s === "HIRED" || s === "VALID") return "positive";
    if (s === "INVALID" || s === "REJECTED") return "negative";
    return "warning";
  };

  const getTierTone = (tier: string) => {
    const t = tier.toUpperCase();
    if (t === "STRONG") return "positive";
    if (t === "BORDERLINE") return "warning";
    if (t === "WEAK") return "negative";
    return "neutral";
  };

  const academicAverage =
    evaluationQuery.data?.institutionJson?.academic_average ??
    evaluationQuery.data?.categoryScoresJson.education.score;
  const institutionName = evaluationQuery.data?.institutionJson?.name ?? "";
  const degreeName = evaluationQuery.data?.institutionJson?.degreeName ?? "";
  const subtitle =
    degreeName && institutionName
      ? `${degreeName} · ${institutionName}`
      : degreeName || institutionName || candidate.cvSummary || "Applicant";

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
      statusLabel={candidate.currentStatus}
      statusTone={getStatusTone(candidate.currentStatus)}
      tierLabel={candidate.tier}
      tierTone={getTierTone(candidate.tier)}
      reviewedAt={new Date(candidate.createdAt).toLocaleDateString()}
      showReviewedAt={true}
      onClick={handleCardClick}
      onActionClick={() => {
        selectApplication(candidate.applicationId);
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
  const [filterDecision, setFilterDecision] = React.useState("All");
  const [filterDateRange, setFilterDateRange] = React.useState({ start: "", end: "" });
  const [filterScore, setFilterScore] = React.useState("All");

  const { data, isLoading, error } = useApplications();
  const applications = data?.applications || [];

  let filteredCandidates = applications;
  
  if (filterDecision !== "All") {
    filteredCandidates = filteredCandidates.filter((c: CandidateApplication) => c.currentStatus === filterDecision);
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

                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/5">
                    <FilterDropdown 
                      label="All Statuses" 
                      options={["All", "PENDING", "VALID", "INVALID", "SHORTLISTED", "MANUAL_REVIEW"]}
                      value={filterDecision}
                      onChange={setFilterDecision}
                    />
                    <FilterDateRangePicker
                      value={filterDateRange}
                      onChange={setFilterDateRange}
                    />
                    <FilterDropdown 
                      label="System Score" 
                      options={["All", "STRONG", "BORDERLINE", "WEAK"]}
                      value={filterScore}
                      onChange={setFilterScore}
                    />
                  </div>

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
