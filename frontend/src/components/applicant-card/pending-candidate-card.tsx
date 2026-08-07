import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, Loader2, X, NotebookTabs } from "lucide-react";

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

function getScoreColor(score: number) {
  if (score >= 80) return "text-primary";
  if (score >= 65) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function ScoreTag({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const formattedScore = score ? score.toFixed(1) : 0;

  return (
    <div className="flex min-w-10 justify-center">
      <span
        className={cn(
          "font-semibold tabular-nums",
          size === "sm" ? "text-base" : "text-lg @2xl:text-xl",
          getScoreColor(score),
        )}
      >
        {formattedScore}%
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

function QuickActionsMenu({
  onShortlist,
  isShortlisting,
  onReject,
  isRejecting,
  onViewDetail,
}: {
  onShortlist?: () => void;
  isShortlisting?: boolean;
  onReject?: () => void;
  isRejecting?: boolean;
  onViewDetail?: () => void;
}) {
  const hasAnyAction = Boolean(onShortlist || onReject || onViewDetail);
  if (!hasAnyAction) return null;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="w-full min-w-0"
    >
      <Select
        value=""
        onValueChange={(val) => {
          if (val === "shortlist" && onShortlist) onShortlist();
          if (val === "reject" && onReject) onReject();
          if (val === "view_detail" && onViewDetail) onViewDetail();
        }}
      >
        <SelectTrigger size="sm" className="group h-7.5 w-full gap-1.5 px-3 text-xs font-medium bg-secondary text-secondary-foreground border-border/60 justify-between rounded-[min(var(--radius-md),12px)] hover:bg-primary hover:text-white hover:data-[placeholder]:text-white dark:hover:bg-primary dark:hover:text-white dark:hover:data-[placeholder]:text-white [&_svg]:hover:text-white [&_svg]:group-hover:text-white transition-colors truncate whitespace-nowrap">
          <SelectValue placeholder="Quick Actions" className="truncate whitespace-nowrap" />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) p-1"
        >
          {onShortlist && (
            <SelectItem
              value="shortlist"
              disabled={isShortlisting || isRejecting}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 focus:bg-emerald-600 focus:text-white dark:focus:bg-emerald-600 dark:focus:text-white cursor-pointer truncate whitespace-nowrap"
            >
              {isShortlisting ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" />
              ) : (
                <Check className="size-3.5 shrink-0" />
              )}
              <span className="truncate whitespace-nowrap">
                {isShortlisting ? "Shortlisting..." : "Shortlist"}
              </span>
            </SelectItem>
          )}

          {onReject && (
            <SelectItem
              value="reject"
              disabled={isShortlisting || isRejecting}
              className="text-xs font-medium text-red-600 dark:text-red-400 focus:bg-destructive focus:text-white dark:focus:bg-destructive dark:focus:text-white cursor-pointer truncate whitespace-nowrap"
            >
              {isRejecting ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" />
              ) : (
                <X className="size-3.5 shrink-0" />
              )}
              <span className="truncate whitespace-nowrap">
                {isRejecting ? "Rejecting..." : "Reject"}
              </span>
            </SelectItem>
          )}

          {onViewDetail && (
            <SelectItem
              value="view_detail"
              className="text-xs font-medium text-foreground focus:bg-primary focus:text-white dark:focus:bg-primary dark:focus:text-white cursor-pointer truncate whitespace-nowrap"
            >
              <NotebookTabs className="size-3.5 shrink-0" />
              <span className="truncate whitespace-nowrap">View Detail</span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
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
  const [confirmAction, setConfirmAction] = useState<"shortlist" | "reject" | null>(null);

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const daysAgo = createdAt ? getDaysAgo(createdAt) : null;
  const handleShortlistClick = onShortlist ?? onAccept;
  const isShortlistLoading = isShortlisting || isAccepting;
  const handleViewDetailClick = onViewDetail ?? onClick;

  return (
    <div
      className={cn(
        "group relative flex w-full flex-col gap-3.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm @4xl:flex-row @4xl:items-center @4xl:justify-between @4xl:gap-4",
      )}
    >
      {/* Candidate Profile Info */}
      <div className="flex w-full min-w-0 flex-1 items-center gap-3 @4xl:w-auto @4xl:max-w-[220px] @5xl:max-w-xs">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-semibold leading-tight text-foreground text-base truncate">
            {name}
          </h4>
          {showInstitute && (
            <div className="mt-0.5 flex flex-col text-xs text-muted-foreground">
              <p className="line-clamp-1 break-words">{institute}</p>
              {secondaryInstitute ? (
                <p className="line-clamp-1 break-words">
                  {secondaryInstitute}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row for Mobile (< @4xl) */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 border border-border/40 text-center @4xl:hidden">
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
            Acad. Avg
          </span>
          <div className="flex-1 flex items-center justify-center">
            {academicAverage !== undefined ? (
              <ScoreTag score={academicAverage} size="sm" />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">–</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-start h-11">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground h-3 leading-none">
            Applied
          </span>
          <div className="flex-1 flex items-center justify-center">
            {daysAgo !== null && daysAgo >= 0 ? (
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

      {/* Metrics Row for Desktop (>= @4xl) */}
      <div className="hidden flex-1 items-center justify-center gap-6 px-2 @4xl:flex">
        <div className="flex w-20 shrink-0 flex-col items-center justify-start h-12">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center h-3 leading-none">
            {scoreLabel}
          </span>
          <div className="flex-1 flex items-center justify-center">
            <ScoreTag score={systemScore} />
          </div>
        </div>
        <div className="h-10 w-px bg-border/60" />
        <div className="flex w-20 shrink-0 flex-col items-center justify-start h-12">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center h-3 leading-none">
            Acad. Avg
          </span>
          <div className="flex-1 flex items-center justify-center">
            {academicAverage !== undefined ? (
              <ScoreTag score={academicAverage} />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">–</span>
            )}
          </div>
        </div>
        <div className="h-10 w-px bg-border/60" />
        <div className="flex w-24 shrink-0 flex-col items-center justify-start h-12">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center h-3 leading-none">
            Applied
          </span>
          <div className="flex-1 flex items-center justify-center">
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
        </div>
      </div>

      {/* Action Buttons: Stacked Quick Actions on top of Show AI Summary */}
      <div className="flex w-full flex-col gap-1.5 shrink-0 @4xl:w-36">
        <QuickActionsMenu
          onShortlist={handleShortlistClick ? () => { setConfirmAction("shortlist"); } : undefined}
          isShortlisting={isShortlistLoading}
          onReject={onReject ? () => { setConfirmAction("reject"); } : undefined}
          isRejecting={isRejecting}
          onViewDetail={handleViewDetailClick}
        />

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

        {onActionClick && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full gap-1 px-3 text-xs font-medium justify-center bg-primary text-white hover:bg-primary/90 hover:text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:hover:text-white transition-colors"
            onClick={(event) => {
              event.stopPropagation();
              onActionClick();
            }}
          >
            <span>{actionLabel}</span>
          </Button>
        )}
      </div>

      {/* Confirmation Modal Popup - Identical to Candidate Review page */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            if (!isShortlistLoading && !isRejecting) {
              setConfirmAction(null);
            }
          }}
        >
          <div
            className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h3 className="text-lg font-semibold text-foreground">
              {confirmAction === "shortlist" ? "Confirm Shortlist" : "Confirm Rejection"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {confirmAction === "shortlist"
                ? `Are you sure you want to shortlist ${name}? This will move them to your team's shortlisted candidates list.`
                : `Are you sure you want to reject ${name}? This will update their status to rejected.`}
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                type="button"
                variant="ghost"
                disabled={isShortlistLoading || isRejecting}
                onClick={() => {
                  setConfirmAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirmAction === "reject" ? "destructive" : "default"}
                disabled={isShortlistLoading || isRejecting}
                onClick={() => {
                  if (confirmAction === "shortlist" && handleShortlistClick) {
                    handleShortlistClick();
                  } else if (confirmAction === "reject" && onReject) {
                    onReject();
                  }
                  setConfirmAction(null);
                }}
              >
                {isShortlistLoading || isRejecting ? "Submitting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
