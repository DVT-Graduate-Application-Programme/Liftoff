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
  showInstitute?: boolean;
  reviewedAt?: string;
  showReviewedAt?: boolean;
  createdAt?: string;
  recruiterLabel?: string;
  recruiterName?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  onClick?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionClick?: () => void;
  isSecondaryActionDisabled?: boolean;
  isSecondaryActionLoading?: boolean;
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
    background: "bg-primary/10",
  },
  warning: {
    border: "border-l-chart-4",
    text: "text-chart-4",
    background: "bg-chart-4/10",
  },
  negative: {
    border: "border-l-destructive",
    text: "text-destructive",
    background: "bg-destructive/10",
  },
  neutral: {
    border: "border-l-border",
    text: "text-muted-foreground",
    background: "bg-muted",
  },
} satisfies Record<
  StatusTone,
  { border: string; text: string; background: string }
>;

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

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="font-medium tracking-widest">{label}</span>
      <span className="min-w-0 flex-1 truncate text-foreground">
        {children}
      </span>
    </div>
  );
}

function getDaysAgo(dateString: string): number | null {
  const inputDate = new Date(dateString);
  if (Number.isNaN(inputDate.getTime())) return null;
  const today = new Date();

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const difference = today.getTime() - inputDate.getTime();

  return Math.max(0, Math.floor(difference / millisecondsPerDay));
}

export default function ApplicantCard({
  name,
  institute,
  academicAverage,
  systemScore,
  scoreLabel = "System Score",
  statusLabel = "Pending",
  statusTone,
  showInstitute = true,
  reviewedAt,
  createdAt,
  showReviewedAt = true,
  recruiterLabel,
  recruiterName,
  actionLabel = "Show AI Summary",
  onActionClick,
  onClick,
  secondaryActionLabel,
  onSecondaryActionClick,
  isSecondaryActionDisabled = false,
  isSecondaryActionLoading = false,
}: ApplicantCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const currentStatusTone = statusTone ?? "positive";
  const statusStyle = statusStyles[currentStatusTone];
  const daysAgo = createdAt ? getDaysAgo(createdAt) : null;

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
        "group relative flex cursor-pointer rounded-xl border bg-card p-4 transition-all hover:-translate-y-px",
        "flex-col gap-4 sm:flex-row sm:items-center sm:gap-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        statusStyle.border,
      )}
    >
      <div className="flex w-full min-w-0 flex-1 items-center gap-3 sm:w-auto">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-semibold leading-tight text-foreground">{name}</h4>
          {showInstitute && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {institute}
            </p>
          )}
          {recruiterName && (
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              <InfoRow label={recruiterLabel ?? "Recruiter"}>
                {recruiterName}
              </InfoRow>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center gap-6">
        {/* Column 1: System Score */}
        <div className="hidden w-20 shrink-0 flex-col items-center gap-0.5 sm:flex">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            {scoreLabel}
          </span>
          <ScoreTag score={systemScore} />
        </div>

        {/* Column 2: Acad. Avg */}
        <div className="hidden w-20 shrink-0 flex-col items-center gap-0.5 sm:flex">
          {academicAverage !== undefined ? (
            <>
              <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
                Acad. Avg
              </span>
              <ScoreTag score={academicAverage} />
            </>
          ) : null}
        </div>

        {/* Column 3: Status */}
        <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            Status
          </span>
          <span
            className={cn(
              "max-w-full rounded-full px-2 py-1 text-xs font-semibold text-center",
              statusStyle.text,
              statusStyle.background,
            )}
          >
            {statusLabel}
          </span>
        </div>

        {/* Column 4: Reviewed */}
        <div className="hidden w-24 shrink-0 flex-col items-center gap-0.5 md:flex">
          {showReviewedAt && reviewedAt ? (
            <>
              <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
                Reviewed
              </span>
              <span className="max-w-full truncate whitespace-nowrap text-center text-xs font-medium tabular-nums text-foreground">
                {reviewedAt}
              </span>
            </>
          ) : null}
        </div>

        {/* Column 5: Applied */}
        <div className="hidden w-24 shrink-0 flex-col items-center gap-0.5 md:flex">
          {daysAgo !== null && daysAgo >= 1 ? (
            <>
              <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
                Applied
              </span>
              <span className="max-w-full truncate whitespace-nowrap text-center text-xs font-medium tabular-nums text-foreground">
                {daysAgo} day(s) ago
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:pl-2">
        {secondaryActionLabel ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full justify-center gap-1.5 text-xs sm:w-32"
            disabled={isSecondaryActionDisabled || isSecondaryActionLoading}
            onClick={(event) => {
              event.stopPropagation();
              onSecondaryActionClick?.();
            }}
          >
            <span>
              {isSecondaryActionLoading ? "Claiming..." : secondaryActionLabel}
            </span>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 text-xs w-full sm:w-auto",
            secondaryActionLabel ? "sm:w-32 justify-center" : undefined,
          )}
          onClick={(event) => {
            event.stopPropagation();
            if (onActionClick) {
              onActionClick();
              return;
            }
            onClick?.();
          }}
        >
          <span>{actionLabel}</span>
        </Button>
      </div>
    </div>
  );
}
