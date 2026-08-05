import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, X } from "lucide-react";

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

function ScoreTag({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const formattedScore = score.toFixed(1);
  const isHigh = score >= 80;
  const isMedium = score >= 65 && score < 80;

  return (
    <div className="flex min-w-10 justify-center">
      <span
        className={cn(
          "font-semibold tabular-nums",
          size === "sm" ? "text-base" : "text-lg @2xl:text-xl",
          isHigh && "text-emerald-600 dark:text-emerald-400",
          isMedium && "text-amber-600 dark:text-amber-400",
          !isHigh && !isMedium && "text-red-600 dark:text-red-400",
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const hasAnyAction = Boolean(onShortlist || onReject || onViewDetail);
  if (!hasAnyAction) return null;

  return (
    <div
      ref={menuRef}
      className="relative w-full text-left"
      onMouseEnter={() => {
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        setIsOpen(false);
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7.5 w-full gap-1.5 px-3 text-xs font-medium border-border justify-between hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        <span>Quick Actions</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 pt-1 w-48 animate-in fade-in-0 zoom-in-95"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-[''] rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-black/5">
            {onShortlist && (
              <button
                type="button"
                disabled={isShortlisting || isRejecting}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white disabled:opacity-50 transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  onShortlist();
                }}
              >
                {isShortlisting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>{isShortlisting ? "Shortlisting..." : "Shortlist Candidate"}</span>
              </button>
            )}

            {onReject && (
              <button
                type="button"
                disabled={isShortlisting || isRejecting}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive hover:text-white dark:hover:bg-destructive dark:hover:text-white disabled:opacity-50 transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  onReject();
                }}
              >
                {isRejecting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
                <span>{isRejecting ? "Rejecting..." : "Reject Candidate"}</span>
              </button>
            )}

            {onViewDetail && (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-foreground hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  onViewDetail();
                }}
              >
                <span>View Detail</span>
              </button>
            )}
          </div>
        </div>
      )}
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
        "group relative flex w-full flex-col gap-3.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-4",
      )}
    >
      {/* Candidate Profile Info */}
      <div className="flex w-full min-w-0 flex-1 items-center gap-3 @3xl:w-auto @3xl:max-w-xs">
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
                    : String(daysAgo) + " day(s) ago"}
              </span>
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">–</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: Stacked Quick Actions on top of Show AI Summary */}
      <div className="flex w-full flex-col gap-1.5 shrink-0 @3xl:w-36">
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
            size="sm"
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
            className="h-7.5 w-full gap-1 px-3 text-xs font-medium justify-center bg-primary text-white hover:bg-primary/90 hover:text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:hover:text-white transition-colors"
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
