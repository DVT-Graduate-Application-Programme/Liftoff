import type { ReactNode } from "react";
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
  tierLabel?: string;
  tierTone?: StatusTone;
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

function ScoreTag({
  score,
  isDefault = true,
  className,
}: {
  score: number;
  isDefault?: boolean;
  className?: string;
}) {
  return (
    <div className="flex min-w-12 justify-center">
      <span
        className={cn(
          "text-xl leading-none tabular-nums",
          className ?? "font-black",
          !isDefault ? getScoreColor(score) : undefined,
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

export default function AllCandidateCard({
  name,
  institute,
  subtitle,
  academicAverage,
  systemScore,
  scoreLabel = "System Score",
  scoreClassName,
  statusLabel = "Pending",
  statusTone,
  tierLabel,
  tierTone,
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
  const currentTierTone = tierTone ?? "neutral";
  const tierStyle = statusStyles[currentTierTone];
  const daysAgo = createdAt ? getDaysAgo(createdAt) : null;
  const displaySubtitle = subtitle ?? institute;
  const displayTier = tierLabel;

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
        "group relative flex cursor-pointer items-center gap-0 rounded-xl border bg-card p-4 w-full",
      )}
    >
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5">
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

      {layout === "history" ? (
        <>
          <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
              Tier
            </span>
            <span
              className={cn(
                "max-w-full rounded-full px-2 py-1 text-xs font-semibold",
                "inline-flex items-center justify-between text-center leading-tight whitespace-normal",
                tierStyle.text,
                tierStyle.background,
              )}
            >
              {displayTier ?? "Unknown"}
            </span>
          </div>

          <div className="min-w-0 flex-1 flex flex-col pl-4">
            <h4 className="break-words font-semibold leading-tight text-foreground">
              {name}
            </h4>
            {showInstitute && displaySubtitle && (
              <p className="mt-0.5 break-words text-xs text-muted-foreground">
                {displaySubtitle}
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
        </>
      ) : (
        <div className="min-w-0 flex-1 flex flex-col pl-4">
          <h4 className="font-semibold leading-tight text-foreground">{name}</h4>
          {showInstitute && (
            <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
              <p className="whitespace-normal break-words">{institute}</p>
              {displaySubtitle ? (
                <p className="whitespace-normal break-words">{displaySubtitle}</p>
              ) : null}
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
      )}

      <div className="flex flex-1 items-center justify-center gap-6 px-2">
        <div className="hidden w-20 shrink-0 flex-col items-center gap-0.5 sm:flex">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            {scoreLabel}
          </span>
          <ScoreTag score={systemScore} className={scoreClassName} />
        </div>

        <div className="hidden w-20 shrink-0 flex-col items-center gap-0.5 sm:flex">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            Acad. Avg
          </span>
          {academicAverage !== undefined ? (
            <ScoreTag score={academicAverage} className={scoreClassName} />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">–</span>
          )}
        </div>

        <div className="hidden w-24 shrink-0 flex-col items-center gap-0.5 md:flex">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
            Applied
          </span>
          {daysAgo !== null && daysAgo >= 1 ? (
            <span className="max-w-full whitespace-nowrap text-center text-xs font-medium tabular-nums text-foreground">
              {daysAgo} day(s) ago
            </span>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">–</span>
          )}
        </div>

        <div className="hidden w-24 shrink-0 flex-col items-center gap-0.5 md:flex">
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground text-center">
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
      </div>

      <div className="flex shrink-0 flex-col justify-end items-end gap-2">
        {secondaryActionLabel ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-30 justify-center gap-1 text-xs"
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
