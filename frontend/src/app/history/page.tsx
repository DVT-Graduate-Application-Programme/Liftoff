"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useApplications } from "@/hooks/use-applications";
import { groupByRecency } from "@/lib/date-grouping";
import type { CandidateApplication } from "@/types/candidate";
import type { ApplicationFilters } from "@/types/api";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Valid", value: "VALID" },
  { label: "Invalid", value: "INVALID" },
  { label: "Manual Review", value: "MANUAL_REVIEW" },
  { label: "Shortlisted", value: "SHORTLISTED" },
  { label: "Error", value: "ERROR" },
] as const;

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: undefined },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
] as const;

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SHORTLISTED: "default",
  INVALID: "destructive",
  ERROR: "destructive",
  MANUAL_REVIEW: "outline",
  PENDING: "secondary",
  PROCESSING: "secondary",
  VALID: "secondary",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(iso)
  );
}

function ScoreTag({ score }: { score: number }) {
  const colorClass = score >= 3.5 ? "text-primary" : score >= 2 ? "text-chart-4" : "text-destructive";

  return (
    <div className="flex min-w-12 justify-center">
      <span className={cn("text-xl font-black leading-none tabular-nums", colorClass)}>{score.toFixed(1)}</span>
    </div>
  );
}

function FilterDropdown<T extends string>({
  label,
  icon,
  options,
  onSelect,
}: {
  label: string;
  icon?: React.ReactNode;
  options: readonly { label: string; value?: T }[];
  onSelect: (value: T | undefined) => void;
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
        {label}
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-20 min-w-40 rounded-xl border border-border bg-card p-1 shadow-lg ring-1 ring-foreground/5">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateHistoryCard({ candidate }: { candidate: CandidateApplication }) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/applicants/${candidate.applicationId}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View details for ${candidate.candidateName}`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleCardClick();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-4",
        "transition-all hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "border-border"
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary">
        {initials(candidate.candidateName)}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-foreground leading-tight">{candidate.candidateName}</h4>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={STATUS_BADGE_VARIANT[candidate.currentStatus] ?? "secondary"}>
            {candidate.currentStatus}
          </Badge>
          <Badge variant="outline">{candidate.tier}</Badge>
        </div>
      </div>

      <div className="hidden sm:flex w-20 flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">Score</span>
        <ScoreTag score={candidate.hiringAgentTotalScore} />
      </div>

      <div className="hidden md:flex w-36 shrink-0 flex-col items-end gap-0.5">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">Created</span>
        <span className="max-w-full truncate whitespace-nowrap text-right text-xs font-medium tabular-nums text-foreground">
          {formatDate(candidate.createdAt)}
        </span>
      </div>
    </div>
  );
}

function DateGroup({ label, applications }: { label: string; applications: CandidateApplication[] }) {
  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground tracking-wide">
          {label}
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="flex flex-col gap-2.5">
        {applications.map((c) => (
          <CandidateHistoryCard key={c.applicationId} candidate={c} />
        ))}
      </div>
    </section>
  );
}

export default function HistoryPage() {
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = React.useState<string | undefined>(undefined);

  const filters: ApplicationFilters = { status, dateFrom };
  const { data, isLoading, isError, refetch } = useApplications(filters);

  const groups = data ? groupByRecency(data.applications) : [];

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Review History</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              An audit trail of applications processed by the hiring pipeline.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/5">
          <FilterDropdown label="Status" options={STATUS_OPTIONS} onSelect={setStatus} />
          <FilterDropdown
            label="Date Range"
            icon={<Calendar className="size-3.5" />}
            options={DATE_RANGE_OPTIONS.map((opt) => ({ label: opt.label, value: opt.label }))}
            onSelect={(value) => {
              const opt = DATE_RANGE_OPTIONS.find((o) => o.label === value);
              if (!opt || !("days" in opt)) {
                setDateFrom(undefined);
                return;
              }
              const from = new Date();
              from.setDate(from.getDate() - opt.days);
              setDateFrom(from.toISOString());
            }}
          />
          {/* System Score filtering isn't supported by the mock API yet — left decorative for now. */}
          <FilterDropdown label="System Score" options={[{ label: "All Scores", value: undefined }]} onSelect={() => {}} />

          <div className="flex-1" />
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-18 rounded-xl" />
            ))}
          </div>
        )}

        {isError && <ErrorState message="Couldn't load review history." onRetry={() => { void refetch(); }} />}

        {!isLoading && !isError && groups.length === 0 && (
          <EmptyState title="No applications found" description="Try adjusting your filters." />
        )}

        {!isLoading && !isError && groups.length > 0 && (
          <div className="flex flex-col gap-8">
            {groups.map(({ label, applications }) => (
              <DateGroup key={label} label={label} applications={applications} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
