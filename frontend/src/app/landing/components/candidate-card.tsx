import React from "react";
import { AlertTriangle, ShieldAlert, UserCheck } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type {
  CandidateApplication,
  CandidateStatus,
  CandidateTier,
} from "@/types/candidate";

//variants come from the variant prop https://ui.shadcn.com/docs/components/radix/badge
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const tierVariants: Record<CandidateTier, BadgeVariant> = {
  STRONG: "default",
  MODERATE: "outline",
  WEAK: "destructive",
};

const statusVariants: Record<CandidateStatus, BadgeVariant> = {
  PROCESSING: "secondary",
  SHORTLISTED: "default",
  REJECTED: "destructive",
  HIRED: "default",
};

const statusLabels: Record<CandidateStatus, string> = {
  PROCESSING: "Processing",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
};

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const CandidateCard = ({
  candidateName,
  currentStatus,
  tier,
  hardGatePassed,
  hiringAgentTotalScore,
  cvSummary,
  flags,
  claimedByRecruiterId,
  shortlistedByRecruiterId,
  createdAt,
}: CandidateApplication) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {candidateName}
        </CardTitle>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={tierVariants[tier]}>{tier}</Badge>
          <Badge variant={statusVariants[currentStatus]}>
            {statusLabels[currentStatus]}
          </Badge>
          {!hardGatePassed && (
            <Badge variant="destructive">
              <ShieldAlert /> Hard gate failed
            </Badge>
          )}
        </div>
        <CardAction className="flex flex-col items-end gap-0.5">
          Score:
          <span className="flex items-center gap-1 text-base font-semibold text-foreground">
            {hiringAgentTotalScore.toFixed(1)} / 5
            <span className="text-xs font-normal text-muted-foreground"></span>
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {cvSummary}
        </p>

        {flags.length > 0 && (
          <ul className="flex flex-col gap-1">
            {flags.map((flag) => (
              <li
                key={flag}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <AlertTriangle className="size-3.5 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {(shortlistedByRecruiterId || claimedByRecruiterId) && (
            <span className="flex items-center gap-1">
              <UserCheck className="size-3.5" />
              {shortlistedByRecruiterId ?? claimedByRecruiterId}
            </span>
          )}
        </div>
        <span>{formatDate(createdAt)}</span>
      </CardFooter>
    </Card>
  );
};

export default CandidateCard;
