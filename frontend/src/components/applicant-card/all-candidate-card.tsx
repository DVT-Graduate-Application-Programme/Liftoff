import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusTone = "positive" | "warning" | "negative" | "neutral";

type AllCandidateCardProps = {
  name: string;
  institute?: string;
  subtitle?: string;
  academicAverage?: number;
  systemScore: number;
  scoreLabel?: string;
  scoreClassName?: string;
  statusLabel?: string;
  statusTone?: StatusTone;
  layout?: "default" | "history";
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
  isDefault = true,
  className,
}: {
  score?: number | null;
  isDefault?: boolean;
  className?: string;
}) {
  if (score == null || Number.isNaN(score)) {
    return (
      <div className="flex min-w-12 justify-center">
        <span className="text-sm font-semibold text-muted-foreground">–</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-12 justify-center">
      <span
        className={cn(
          "text-lg font-semibold leading-none tabular-nums text-foreground",
          className,
          !isDefault ? getScoreColor(score) : undefined,
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

export default function AllCandidateCard({
  name,
  institute,
  subtitle,
  academicAverage,
  systemScore,
  scoreLabel = "System Score",
  scoreClassName,
  statusLabel = "Processing",
  statusTone,
  layout = "default",
  showInstitute = true,
  reviewedAt,
  showReviewedAt = true,
  createdAt,
  recruiterLabel,
  recruiterName,
  actionLabel = "Show AI Summary",
  onActionClick,
  onClick,
  secondaryActionLabel,
  onSecondaryActionClick,
  isSecondaryActionDisabled = false,
  isSecondaryActionLoading = false,
}: AllCandidateCardProps) {
  const currentStatusTone = statusTone ?? "positive";
  const statusStyle = statusStyles[currentStatusTone];
  const daysAgo = createdAt ? getDaysAgo(createdAt) : null;
  const displaySubtitle = subtitle ?? institute;
  const displayRecruiterName = recruiterName;

  if (layout === "history") {
    return (
      <div
        className={cn(
          "group relative grid w-full grid-cols-1 gap-3 rounded-xl border bg-card p-4",
          "@2xl:grid-cols-[5rem_minmax(0,1fr)_12rem_8rem_7.5rem] @2xl:items-center @2xl:gap-x-4",
          "@4xl:grid-cols-[5rem_minmax(0,1fr)_12rem_8rem_7rem_7.5rem]",
        )}
      >
        <div className="flex shrink-0 flex-col items-start gap-0.5 @2xl:items-center @2xl:justify-center">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
            Status
          </span>
          <span
            className={cn(
              "max-w-full rounded-full px-2 py-1 text-xs font-semibold",
              "inline-flex items-center justify-center text-center leading-tight whitespace-normal",
              statusStyle.text,
              statusStyle.background,
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="min-w-0 flex flex-col">
          <h4 className="break-words font-semibold leading-tight text-foreground">
            {name}
          </h4>
          {showInstitute && (
            <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
              {displaySubtitle ? (
                <p className="whitespace-normal break-words">{displaySubtitle}</p>
              ) : null}
              <p className="whitespace-normal break-words">{institute}</p>
            </div>
          )}
        </div>

        <div className="flex w-[12rem] shrink-0 items-center justify-center gap-3">
          <div className="flex w-24 flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
              {scoreLabel}
            </span>
            <ScoreTag score={systemScore} className={scoreClassName} />
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="flex w-24 flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
              Acad. Avg
            </span>
            {academicAverage !== undefined ? (
              <ScoreTag score={academicAverage} className={scoreClassName} />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">–</span>
            )}
          </div>
        </div>

        <div className="flex w-32 shrink-0 flex-col items-center gap-0.5 pl-2">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
            Applied
          </span>
          {daysAgo !== null && daysAgo >= 0 ? (
            <span className="max-w-full whitespace-nowrap text-center text-xs font-medium tabular-nums text-foreground">
              {daysAgo === 0
                ? "Today"
                : daysAgo === 1
                  ? "1 day ago"
                  : `${String(daysAgo)} days ago`}
            </span>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">–</span>
          )}
        </div>

        <div className="hidden w-28 shrink-0 flex-col items-center gap-0.5 pl-2 @4xl:flex">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
            Reviewed
          </span>
          {showReviewedAt && reviewedAt ? (
            <span className="max-w-full truncate whitespace-nowrap text-center text-xs font-medium tabular-nums text-foreground">
              {reviewedAt}
            </span>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">–</span>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 @2xl:w-auto @2xl:items-end @2xl:justify-end">
          {secondaryActionLabel ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full justify-center gap-1 text-xs @2xl:w-30"
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
            className="w-full justify-center gap-1 text-xs bg-primary text-white dark:bg-sky-500 dark:hover:bg-sky-400 @2xl:w-30"
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

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 w-full @2xl:flex-row @2xl:items-center @2xl:gap-0",
      )}
    >
      <div className="flex shrink-0 flex-col items-start gap-0.5 @2xl:w-20 @2xl:items-center @2xl:justify-center">
        <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
          Status
        </span>
        <span
          className={cn(
            "max-w-full rounded-full px-2 py-1 text-xs font-semibold",
            "inline-flex items-center justify-between text-center leading-tight whitespace-normal",
            statusStyle.text,
            statusStyle.background,
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="min-w-0 flex-1 flex flex-col pl-4">
        <h4 className="font-semibold leading-tight text-foreground">
          {name}
        </h4>
        {showInstitute && (
          <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
            <p className="whitespace-normal break-words">{institute}</p>
            {displaySubtitle ? (
              <p className="whitespace-normal break-words">
                {displaySubtitle}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-1 items-center justify-start gap-6 @2xl:justify-center @2xl:px-2">
        <div className="flex w-20 shrink-0 flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            {scoreLabel}
          </span>
          <ScoreTag score={systemScore} className={scoreClassName} />
        </div>

        <div className="h-10 w-px bg-border" />

        <div className="flex w-20 shrink-0 flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            Acad. Avg
          </span>
          {academicAverage !== undefined ? (
            <ScoreTag score={academicAverage} className={scoreClassName} />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              –
            </span>
          )}
        </div>

        <div className="hidden w-24 shrink-0 flex-col items-center gap-0.5 @4xl:flex">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            Applied
          </span>
          {daysAgo !== null && daysAgo >= 0 ? (
            <span className="max-w-full whitespace-nowrap text-center text-xs font-medium tabular-nums text-foreground">
              {daysAgo === 0
                ? "Today"
                : daysAgo === 1
                  ? "1 day ago"
                  : `${String(daysAgo)} days ago`}
            </span>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              –
            </span>
          )}
        </div>

        {displayRecruiterName && (
          <div className="hidden w-24 shrink-0 flex-col items-center gap-0.5 @4xl:flex">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
              {recruiterLabel ?? "Recruiter"}
            </span>
            <span className="max-w-full truncate whitespace-nowrap text-center text-xs font-medium text-foreground">
              {displayRecruiterName}
            </span>
          </div>
        )}
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 @2xl:w-auto @2xl:justify-end @2xl:items-end">
        {secondaryActionLabel ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full justify-center gap-1 text-xs @2xl:w-30"
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
          className="w-full justify-center gap-1 text-xs bg-primary text-white dark:bg-sky-500 dark:hover:bg-sky-400 @2xl:w-30"
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
