import { Check, GitBranch, Link2, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusTone = "positive" | "warning" | "negative" | "neutral";

type ApplicantCardProps = {
  name: string;
  institute: string;
  academicAverage?: number;
  systemScore: number;
  scoreLabel?: string;
  statusLabel?: string;
  statusTone?: StatusTone;
  reviewedAt?: string;
  recruiterLabel?: string;
  recruiterName?: string;
  candidateGitHubUrl?: string | null;
  actionLabel?: string;
  onClick?: () => void;
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-primary";
  if (score >= 65) return "text-chart-4";
  return "text-destructive";
}

const statusStyles = {
  positive: {
    border: "border-l-primary",
    text: "text-primary",
  },
  warning: {
    border: "border-l-chart-4",
    text: "text-chart-4",
  },
  negative: {
    border: "border-l-destructive",
    text: "text-destructive",
  },
  neutral: {
    border: "border-l-border",
    text: "text-muted-foreground",
  },
} satisfies Record<StatusTone, { border: string; text: string }>;

function getScoreTone(score: number): StatusTone {
  if (score >= 80) return "positive";
  if (score >= 65) return "warning";
  return "negative";
}

function ScoreTag({ score }: { score: number }) {
  return (
    <div className="flex min-w-12 justify-center">
      <span
        className={cn(
          "text-xl font-black leading-none tabular-nums",
          getScoreColor(score),
        )}
      >
        {score}%
      </span>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="font-medium uppercase tracking-widest">{label}</span>
      <span className="min-w-0 truncate text-foreground">{children}</span>
    </div>
  );
}

export default function ApplicantCard({
  name,
  institute,
  academicAverage,
  systemScore,
  scoreLabel = "Sys Score",
  statusLabel = "Pending",
  statusTone,
  reviewedAt,
  recruiterLabel,
  recruiterName,
  candidateGitHubUrl,
  actionLabel = "Review",
  onClick,
}: ApplicantCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const currentStatusTone = statusTone ?? getScoreTone(systemScore);
  const statusStyle = statusStyles[currentStatusTone];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View details for ${name}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-4",
        "border-l-4 border-border transition-all hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        statusStyle.border,
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary">
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-semibold leading-tight text-foreground">{name}</h4>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {institute}
        </p>
        {(recruiterName || candidateGitHubUrl) && (
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            {recruiterName && (
              <InfoRow label={recruiterLabel ?? "Recruiter"}>
                {recruiterName}
              </InfoRow>
            )}
            {candidateGitHubUrl && (
              <a
                href={candidateGitHubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                <GitBranch className="size-3.5" />
                GitHub
                <Link2 className="size-3" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="hidden w-[13rem] shrink-0 items-center justify-center gap-3 sm:flex">
        <div className="flex w-20 flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
            {scoreLabel}
          </span>
          <ScoreTag score={systemScore} />
        </div>
        {academicAverage !== undefined && (
          <>
            <div className="h-10 w-px bg-border" />
            <div className="flex w-20 flex-col items-center gap-0.5">
              <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                Acad. Avg
              </span>
              <ScoreTag score={academicAverage} />
            </div>
          </>
        )}
      </div>

      <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5">
        <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
          Status
        </span>
        <span
          className={cn(
            "max-w-full truncate text-xs font-semibold",
            statusStyle.text,
          )}
        >
          {statusLabel}
        </span>
      </div>

      {reviewedAt && (
        <div className="hidden w-36 shrink-0 flex-col items-end gap-0.5 md:flex">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
            Reviewed
          </span>
          <span className="max-w-full truncate whitespace-nowrap text-right text-xs font-medium tabular-nums text-foreground">
            {reviewedAt}
          </span>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2 pl-2">
        <div className="hidden gap-1.5 lg:flex">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Accept ${name}`}
            className="text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Reject ${name}`}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <span>{actionLabel}</span>
        </Button>
      </div>
    </div>
  );
}
