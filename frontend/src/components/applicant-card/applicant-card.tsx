import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusTone = "positive" | "warning" | "negative" | "neutral";

type ApplicantCardProps = {
  name: string;
  institute: string;
  secondaryInstitute?: string;
  academicAverage?: number;
  systemScore: number;
  scoreLabel?: string;
  secondaryScoreLabel?: string;
  statusLabel?: string;
  statusTone?: StatusTone;
  showStatus?: boolean;
  showInstitute?: boolean;
  wrapInstitute?: boolean;
  reviewedAt?: string;
  showReviewedAt?: boolean;
  wrapReviewedAt?: boolean;
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
          "text-lg font-semibold leading-none tabular-nums",
          getScoreColor(score),
        )}
      >
        {Number(score).toFixed(1)}%
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
  secondaryInstitute,
  academicAverage,
  systemScore,
  scoreLabel = "System Score",
  secondaryScoreLabel = "Acad. Avg",
  statusLabel = "Pending",
  statusTone,
  showStatus = true,
  showInstitute = true,
  wrapInstitute = false,
  reviewedAt,
  createdAt,
  showReviewedAt = true,
  wrapReviewedAt = false,
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
          <h4 className="text-base font-semibold leading-tight text-foreground">
            {name}
          </h4>
          {showInstitute && (
            <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
              <p className={cn(wrapInstitute ? "whitespace-normal break-words" : "truncate")}>
                {institute}
              </p>
              {secondaryInstitute && (
                <p
                  className={cn(
                    "text-muted-foreground/80",
                    wrapInstitute ? "whitespace-normal break-words" : "truncate",
                  )}
                >
                  {secondaryInstitute}
                </p>
              )}
            </div>
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

      <div className="flex flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
        <div className="hidden w-[12rem] shrink-0 items-center justify-center gap-3 sm:flex">
          <div className="flex w-24 flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
              {scoreLabel}
            </span>
            <ScoreTag score={systemScore} />
          </div>
          {academicAverage !== undefined && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="flex w-24 flex-col items-center gap-0.5">
                <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                  {secondaryScoreLabel}
                </span>
                <ScoreTag score={academicAverage} />
              </div>
            </>
          )}
        </div>

        {showStatus && (
          <div className="flex shrink-0 flex-col items-start gap-0.5 sm:ml-0 sm:w-16 sm:items-center sm:justify-center md:ml-1">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
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
        )}

        {showReviewedAt && reviewedAt && (
          <div className="hidden w-28 shrink-0 flex-col items-end gap-0.5 pl-2 md:flex">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
              Reviewed
            </span>
            <span
              className={cn(
                "max-w-full text-right text-xs font-medium tabular-nums text-foreground",
                wrapReviewedAt ? "whitespace-normal break-words" : "truncate whitespace-nowrap",
              )}
            >
              {reviewedAt}
            </span>
          </div>
        )}
        {daysAgo !== null && daysAgo >= 1 && (
          <div className="hidden w-32 shrink-0 flex-col items-center gap-0.5 pl-2 md:flex">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
              Applied
            </span>
            <span
              className={cn(
                "max-w-full text-right text-xs font-medium tabular-nums text-foreground",
                wrapReviewedAt ? "whitespace-normal break-words" : "truncate whitespace-nowrap",
              )}
            >
              {daysAgo} day(s) ago
            </span>
          </div>
        )}
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
