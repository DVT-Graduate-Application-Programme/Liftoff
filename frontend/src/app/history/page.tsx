"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Calendar,
  RotateCcw,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";


type Decision = "accept" | "reject";

interface Candidate {
  id: string;
  name: string;
  role: string;
  decision: Decision;
  systemScore: number;
  systemScoreLabel: string;
  academicAverage: number;
  academicAverageLabel: string;
  reviewedAt: string;
  avatarInitials: string;
}

const TODAY_CANDIDATES: Candidate[] = [
  {
    id: "1",
    name: "Alexander Sterling",
    role: "Software Engineer — Backend",
    decision: "accept",
    systemScore: 91,
    systemScoreLabel: "Strong",
    academicAverage: 87,
    academicAverageLabel: "High",
    reviewedAt: "Today, 08:42 AM",
    avatarInitials: "AS",
  },
  {
    id: "2",
    name: "Sophia Chen",
    role: "Data Analyst — Insights Team",
    decision: "accept",
    systemScore: 88,
    systemScoreLabel: "Strong",
    academicAverage: 82,
    academicAverageLabel: "High",
    reviewedAt: "Today., 09:15 AM",
    avatarInitials: "SC",
  },
  {
    id: "3",
    name: "Marcus Thorne",
    role: "UX Designer — Product Design",
    decision: "reject",
    systemScore: 54,
    systemScoreLabel: "Weaker",
    academicAverage: 61,
    academicAverageLabel: "Average",
    reviewedAt: "Today, 10:03 AM",
    avatarInitials: "MT",
  },
];

const YESTERDAY_CANDIDATES: Candidate[] = [
  {
    id: "4",
    name: "Priya Nair",
    role: "DevOps Engineer — Infrastructure",
    decision: "accept",
    systemScore: 79,
    systemScoreLabel: "Good",
    academicAverage: 74,
    academicAverageLabel: "Good",
    reviewedAt: "Yesterday, 03:30 PM",
    avatarInitials: "PN",
  },
  {
    id: "5",
    name: "Ethan Voss",
    role: "Product Manager — Growth",
    decision: "reject",
    systemScore: 47,
    systemScoreLabel: "Weaker",
    academicAverage: 55,
    academicAverageLabel: "Below Avg",
    reviewedAt: "Yesterday, 04:00 PM",
    avatarInitials: "EV",
  },
  {
    id: "6",
    name: "Lena Hoffmann",
    role: "Marketing Strategist",
    decision: "accept",
    systemScore: 83,
    systemScoreLabel: "Strong",
    academicAverage: 79,
    academicAverageLabel: "High",
    reviewedAt: "Yesterday, 05:22 PM",
    avatarInitials: "LH",
  },
];

const EARLIER_CANDIDATES: Candidate[] = [
  {
    id: "7",
    name: "James Okafor",
    role: "Cybersecurity Analyst",
    decision: "accept",
    systemScore: 95,
    systemScoreLabel: "Exceptional",
    academicAverage: 91,
    academicAverageLabel: "High",
    reviewedAt: "5 Jul, 11:10 AM",
    avatarInitials: "JO",
  },
  {
    id: "8",
    name: "Amara Diallo",
    role: "Financial Analyst — Risk",
    decision: "reject",
    systemScore: 38,
    systemScoreLabel: "Weaker",
    academicAverage: 48,
    academicAverageLabel: "Below Avg",
    reviewedAt: "5 Jul, 02:45 PM",
    avatarInitials: "AD",
  },
];

const GROUPS = [
  { label: "Processed Today", candidates: TODAY_CANDIDATES },
  { label: "Applied Yesterday", candidates: YESTERDAY_CANDIDATES },
  { label: "Earlier This Week", candidates: EARLIER_CANDIDATES },
];

function ScoreTag({ score }: { score: number }) {
  const colorClass =
    score >= 80
      ? "text-primary"
      : score >= 65
        ? "text-chart-4"
        : "text-destructive";

  return (
    <div className="flex min-w-12 justify-center">
      <span className={cn("text-xl font-black leading-none tabular-nums", colorClass)}>
        {score}%
      </span>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: Decision }) {
  const isAccepted = decision === "accept";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide select-none",
        isAccepted
          ? "bg-primary/12 text-primary border border-primary/20"
          : "bg-destructive/10 text-destructive border border-destructive/20"
      )}
    >
      {isAccepted ? (
        <CheckCircle2 className="size-3.5 shrink-0" />
      ) : (
        <XCircle className="size-3.5 shrink-0" />
      )}
      {isAccepted ? "Accepted" : "Rejected"}
    </span>
  );
}

function FilterDropdown({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
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
          {["All", "Yes", "No","Maybe"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
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

function ChangeDecisionModal({
  candidate,
  onClose,
}: {
  candidate: Candidate;
  onClose: () => void;
}) {
  const newDecision = candidate.decision === "accept" ? "Reject" : "Accept";
  const isFlipToAccept = candidate.decision === "reject";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl ring-1 ring-foreground/5"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              isFlipToAccept ? "bg-primary/12" : "bg-destructive/10"
            )}
          >
            <RefreshCw
              className={cn(
                "size-5",
                isFlipToAccept ? "text-primary" : "text-destructive"
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Change Decision</h3>
            <p className="text-xs text-muted-foreground">
              {candidate.name} · {candidate.role}
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
          You are about to change the decision for{" "}
          <strong className="text-foreground">{candidate.name}</strong> from{" "}
          <DecisionBadge decision={candidate.decision} /> to{" "}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isFlipToAccept
                ? "bg-primary/12 text-primary"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isFlipToAccept ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <XCircle className="size-3.5" />
            )}
            {newDecision}ed
          </span>
          . This action will be logged in the audit trail.
        </p>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isFlipToAccept ? "default" : "destructive"}
            size="sm"
            onClick={onClose}
          >
            Confirm {newDecision}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CandidateHistoryCard({ candidate }: { candidate: Candidate }) {
  const router = useRouter();
  const [showModal, setShowModal] = React.useState(false);
  const isAccepted = candidate.decision === "accept";

  const handleCardClick = () => {
    router.push(`/applicants/${candidate.id}`);
  };

  const handleChangeDecision = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      {showModal && (
        <ChangeDecisionModal
          candidate={candidate}
          onClose={() => {
            setShowModal(false);
          }}
        />
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label={`View details for ${candidate.name}`}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleCardClick();
          }
        }}
        className={cn(
          "group relative flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-4",
          "border-l-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-px",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          isAccepted ? "border-l-primary" : "border-l-destructive",
          "border-border"
        )}
      >
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary"
          )}
        >
          {candidate.avatarInitials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground leading-tight">
              {candidate.name}
            </h4>
            <DecisionBadge decision={candidate.decision} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {candidate.role}
          </p>
        </div>

        <div className="hidden sm:flex w-[13rem] shrink-0 items-center justify-center gap-3">
          <div className="flex w-20 flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">
              Sys Score
            </span>
            <ScoreTag score={candidate.systemScore} />
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex w-20 flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">
              Acad. Avg
            </span>
            <ScoreTag score={candidate.academicAverage} />
          </div>
        </div>

        <div className="hidden md:flex w-36 shrink-0 flex-col items-end gap-0.5">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">
            Reviewed
          </span>
          <span className="max-w-full truncate whitespace-nowrap text-right text-xs font-medium tabular-nums text-foreground">
            {candidate.reviewedAt}
          </span>
        </div>

        <div className="shrink-0 pl-2">
          <Button
            variant="outline"
            size="sm"
            aria-label={`Change decision for ${candidate.name}`}
            onClick={handleChangeDecision}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Change Decision</span>
            <span className="sm:hidden">Change</span>
          </Button>
        </div>
      </div>
    </>
  );
}

function DateGroup({
  label,
  candidates,
}: {
  label: string;
  candidates: Candidate[];
}) {
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
          <CandidateHistoryCard key={c.id} candidate={c} />
        ))}
      </div>
    </section>
  );
}


export default function HistoryPage() {
  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Review History
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              An audit trail of all finalized candidate decisions — accepted and
              rejected applicants across every hiring round.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/5">
          <FilterDropdown label="All Decisions" />
          <FilterDropdown
            label="Date Range"
            icon={<Calendar className="size-3.5" />}
          />
          <FilterDropdown label="System Score" />

          <div className="flex-1" />

          <Button variant="default" size="default" className="gap-1.5">
            Apply
          </Button>
        </div>

        <div className="flex flex-col gap-8">
          {GROUPS.map(({ label, candidates }) => (
            <DateGroup key={label} label={label} candidates={candidates} />
          ))}
        </div>
      </div>
    </main>
  );
}
