import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ExternalLink, Loader2, X } from "lucide-react";

type PendingCandidateCardProps = {
  name: string;
  institute: string;
  secondaryInstitute?: string;
  academicAverage?: number;
  systemScore: number;
  scoreLabel?: string;
  showInstitute?: boolean;
  createdAt?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  onClick?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionClick?: () => void;
  isSecondaryActionDisabled?: boolean;
  isSecondaryActionLoading?: boolean;
  onViewDetail?: () => void;
  onShortlist?: () => void;
  isShortlisting?: boolean;
  onAccept?: () => void;
  isAccepting?: boolean;
  onReject?: () => void;
  isRejecting?: boolean;
};

function getScoreColor(score?: number | null) {
  if (score == null || Number.isNaN(score)) return "text-muted-foreground";
  if (score >= 80) return "text-primary";
  if (score >= 65) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function ScoreTag({ score }: { score?: number | null }) {
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
          "text-xl font-semibold leading-none tabular-nums",
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

export default function PendingCandidateCard({
  name,
  institute,
  secondaryInstitute,
  academicAverage,
  systemScore,
  scoreLabel = "System Score",
  showInstitute = true,
  createdAt,
  actionLabel = "Show AI Summary",
  onActionClick,
  onClick,
  secondaryActionLabel,
  onSecondaryActionClick,
  isSecondaryActionDisabled = false,
  isSecondaryActionLoading = false,
  onViewDetail,
  onShortlist,
  isShortlisting = false,
  onAccept,
  isAccepting = false,
  onReject,
  isRejecting = false,
}: PendingCandidateCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const daysAgo = createdAt ? getDaysAgo(createdAt) : null;
  const handleShortlistClick = onShortlist ?? onAccept;
  const isShortlistLoading = isShortlisting || isAccepting;

  return (
    <div
      className={cn(
        "group relative flex w-full flex-col gap-3 rounded-xl bg-card p-4 transition-all @2xl:flex-row @2xl:items-center @2xl:gap-0",
      )}
    >
      <div className="flex w-full min-w-0 flex-1 items-center gap-3 @2xl:w-auto">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-semibold leading-tight text-foreground">
            {name}
          </h4>
          {showInstitute && (
            <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
              <p className="whitespace-normal break-words">{institute}</p>
              {secondaryInstitute ? (
                <p className="whitespace-normal break-words">
                  {secondaryInstitute}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-start gap-6 @2xl:justify-center @2xl:px-2">
        <div className="flex w-20 shrink-0 flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            {scoreLabel}
          </span>
          <ScoreTag score={systemScore} />
        </div>
        <div className="flex w-20 shrink-0 flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            Acad. Avg
          </span>
          {academicAverage !== undefined ? (
            <ScoreTag score={academicAverage} />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">–</span>
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
                  : String(daysAgo) + " day(s) ago"}
            </span>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">–</span>
          )}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center gap-2 @2xl:w-auto @2xl:justify-end">
        {handleShortlistClick && (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-8 gap-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
            disabled={isShortlistLoading || isRejecting}
            onClick={(event) => {
              event.stopPropagation();
              handleShortlistClick();
            }}
          >
            {isShortlistLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span>{isShortlistLoading ? "Shortlisting..." : "Shortlist"}</span>
          </Button>
        )}
        {onReject && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-8 gap-1 px-3 text-xs"
            disabled={isAccepting || isRejecting}
            onClick={(event) => {
              event.stopPropagation();
              onReject();
            }}
          >
            {isRejecting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
            <span>{isRejecting ? "Rejecting..." : "Reject"}</span>
          </Button>
        )}
        {(onViewDetail || onClick) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-3 text-xs"
            onClick={(event) => {
              event.stopPropagation();
              onViewDetail ? onViewDetail() : onClick?.();
            }}
          >
            <ExternalLink className="size-3.5" />
            <span>View Detail</span>
          </Button>
        )}
        {secondaryActionLabel ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn(
              "h-8 gap-1 px-3 text-xs",
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
        {onActionClick && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-3 text-xs bg-primary text-white dark:bg-sky-500 dark:hover:bg-sky-400"
            onClick={(event) => {
              event.stopPropagation();
              onActionClick();
            }}
          >
            <span>{actionLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
