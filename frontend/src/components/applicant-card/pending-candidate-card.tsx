import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingCandidateCardProps = {
  name: string;
  institute: string;
  secondaryInstitute?: string;
  recruiterLabel?: string;
  recruiterName?: string;
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
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-primary";
  if (score >= 65) return "text-chart-4";
  return "text-destructive";
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
  recruiterLabel,
  recruiterName,
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
}: PendingCandidateCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
        "group relative flex cursor-pointer items-center gap-0 rounded-xl bg-card p-4 w-full transition-all hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",

      )}
    >
      <div className="flex w-[25rem] shrink-0 min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-semibold leading-tight text-foreground">{name}</h4>
          {showInstitute && (
            <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
              <p className="whitespace-normal break-words">{institute}</p>
              {secondaryInstitute ? (
                <p className="whitespace-normal break-words">{secondaryInstitute}</p>
              ) : null}
            </div>
          )}
          {recruiterName ? (
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium tracking-widest">
                  {recruiterLabel ?? "Recruiter"}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {recruiterName}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-2">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
              {scoreLabel}
            </span>
            <ScoreTag score={systemScore} />
          </div>

          <div className="h-8 w-px bg-border" />

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
              Acad. Avg
            </span>
            {academicAverage !== undefined ? (
              <ScoreTag score={academicAverage} />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">–</span>
            )}
          </div>

          <div className="h-8 w-px bg-border" />

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
              Applied
            </span>
            {daysAgo !== null && daysAgo >= 0 ? (
              <span className="whitespace-nowrap text-center text-xs font-medium tabular-nums text-foreground">
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

      <div className="flex shrink-0 flex-col justify-end items-end gap-2">
        {secondaryActionLabel ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn(
              "w-30 justify-center gap-1 text-xs",
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
          variant="outline"
          size="sm"
          className="w-30 justify-center gap-1 text-xs bg-primary text-white"
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
