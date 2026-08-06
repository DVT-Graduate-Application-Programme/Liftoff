
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
  actionVariant?:
    "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  onClick?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionClick?: () => void;
  isSecondaryActionDisabled?: boolean;
  isSecondaryActionLoading?: boolean;
  stackActions?: boolean;
};

function getScoreColor(score?: number | null) {
  if (score == null || Number.isNaN(score)) return "text-muted-foreground";
  if (score >= 80) return "text-primary";
  if (score >= 65) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

const statusStyles = {
  positive: {
    border: "border-l-primary",
    text: "text-primary dark:text-white",
    background: "bg-primary/10 dark:bg-sky-700",
  },
  warning: {
    border: "border-l-chart-4",
    text: "text-amber-700 dark:text-black",
    background: "bg-amber-100 dark:bg-chart-4",
  },
  negative: {
    border: "border-l-destructive",
    text: "text-red-700 dark:text-white",
    background: "bg-red-100 dark:bg-destructive",
  },
  neutral: {
    border: "border-l-border",
    text: "text-muted-foreground dark:text-secondary-foreground",
    background: "bg-muted dark:bg-secondary",
  },
} satisfies Record<
  StatusTone,
  { border: string; text: string; background: string }
>;

function ScoreTag({
  score,
  size = "md",
}: {
  score?: number | null;
  size?: "sm" | "md";
}) {
  if (score == null || Number.isNaN(score)) {
    return (
      <div className="flex min-w-10 justify-center">
        <span className="text-xs font-semibold text-muted-foreground">–</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-10 justify-center">
      <span
        className={cn(
          "font-semibold leading-none tabular-nums",
          size === "sm" ? "text-base" : "text-lg @2xl:text-xl",
          getScoreColor(score),
        )}
      >
        {score.toFixed(1)}%
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
  actionVariant = "outline",
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
  const displayRecruiterName = recruiterName;

  const handleCardClick = () => {
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex w-full flex-col gap-3.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-4",
        statusStyle.border,
        onClick && "cursor-pointer",
      )}
    >
      {/* Candidate Profile Info */}
      <div className="flex w-full min-w-0 flex-1 items-center gap-3 @3xl:w-auto @3xl:max-w-xs">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold leading-tight text-foreground text-base truncate">
              {name}
            </h4>
            {showStatus && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none shrink-0 @3xl:hidden",
                  statusStyle.text,
                  statusStyle.background,
                )}
              >
                {statusLabel}
              </span>
            )}
          </div>
          {showInstitute && (
            <div className="mt-0.5 flex flex-col text-xs text-muted-foreground">
              <p
                className={cn(
                  wrapInstitute
                    ? "whitespace-normal break-words"
                    : "line-clamp-1 break-words",
                )}
              >
                {institute}
              </p>
              {secondaryInstitute ? (
                <p
                  className={cn(
                    "text-muted-foreground/80",
                    wrapInstitute
                      ? "whitespace-normal break-words"
                      : "line-clamp-1 break-words",
                  )}
                >
                  {secondaryInstitute}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row for Mobile (< @3xl) */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 border border-border/40 text-center @3xl:hidden">
        <div className="flex flex-col items-center justify-start h-11">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground h-3 leading-none">
            {scoreLabel}
          </span>
          <div className="flex-1 flex items-center justify-center">
            <ScoreTag score={systemScore} size="sm" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-start h-11 border-x border-border/50 px-1">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground h-3 leading-none">
            {secondaryScoreLabel}
          </span>
          <div className="flex-1 flex items-center justify-center">
            <ScoreTag score={academicAverage} size="sm" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-start h-11">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground h-3 leading-none">
            {displayRecruiterName ? (recruiterLabel ?? "Recruiter") : "Applied"}
          </span>
          <div className="flex-1 flex items-center justify-center">
            {displayRecruiterName ? (
              <span className="text-xs font-medium text-foreground truncate max-w-full">
                {displayRecruiterName}
              </span>
            ) : daysAgo !== null && daysAgo >= 0 ? (
              <span className="text-xs font-medium tabular-nums text-foreground">
                {daysAgo === 0
                  ? "Today"
                  : daysAgo === 1
                    ? "1 day ago"
                    : `${String(daysAgo)}d ago`}
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">–</span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row for Desktop (>= @3xl) */}
      <div className="hidden flex-1 items-center justify-center gap-6 px-2 @3xl:flex">
        <div className="flex w-20 shrink-0 flex-col items-center justify-start h-12">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center h-3 leading-none">
            {scoreLabel}
          </span>
          <div className="flex-1 flex items-center justify-center">
            <ScoreTag score={systemScore} />
          </div>
        </div>
        <div className="flex w-20 shrink-0 flex-col items-center justify-start h-12">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center h-3 leading-none">
            {secondaryScoreLabel}
          </span>
          <div className="flex-1 flex items-center justify-center">
            <ScoreTag score={academicAverage} />
          </div>
        </div>

        {showStatus && (
          <div className="flex w-16 shrink-0 flex-col items-center justify-start h-12">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center h-3 leading-none">
              Status
            </span>
            <div className="flex-1 flex items-center justify-center">
              <span
                className={cn(
                  "max-w-full rounded-full px-2 py-0.5 text-xs font-semibold text-center leading-tight truncate",
                  statusStyle.text,
                  statusStyle.background,
                )}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        )}

        {daysAgo !== null && daysAgo >= 0 && (
          <div className="flex w-24 shrink-0 flex-col items-center justify-start h-12">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center h-3 leading-none">
              Applied
            </span>
            <div className="flex-1 flex items-center justify-center">
              <span className="max-w-full whitespace-nowrap text-center text-xs font-medium tabular-nums text-foreground">
                {daysAgo === 0
                  ? "Today"
                  : daysAgo === 1
                    ? "1 day ago"
                    : `${String(daysAgo)} days ago`}
              </span>
            </div>
          </div>
        )}

        {displayRecruiterName && (
          <div className="flex w-24 shrink-0 flex-col items-center justify-start h-12">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center h-3 leading-none">
              {recruiterLabel ?? "Recruiter"}
            </span>
            <div className="flex-1 flex items-center justify-center">
              <span className="max-w-full truncate whitespace-nowrap text-center text-xs font-medium text-foreground">
                {displayRecruiterName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Container */}
      <div className="flex w-full flex-col gap-1.5 shrink-0 @3xl:w-36">
        {secondaryActionLabel ? (
          <Button
            type="button"
            variant="secondary"
            className={cn(
              "h-7.5 w-full gap-1 px-3 text-xs font-medium justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors",
              isSecondaryActionDisabled &&
                "border-border bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground",
            )}
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
          variant={actionVariant}
          size="sm"
          className={cn(
            "h-7.5 w-full gap-1 px-3 text-xs font-medium justify-center transition-colors",
            actionVariant === "default"
              ? "bg-primary text-white hover:bg-primary/90 dark:bg-sky-500 dark:hover:bg-sky-400 dark:hover:text-white"
              : undefined,
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
