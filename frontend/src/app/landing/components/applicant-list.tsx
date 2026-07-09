"use client";

import { useRouter } from "next/navigation";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";
import { useInfiniteApplications } from "@/hooks/use-infinite-applications";
import { ACTIVE_RECRUITER_ID, useClaimApplication } from "@/hooks/use-claim-application";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import ApplicantCard from "@/components/applicant-card/applicant-card";
import {
  formatDate,
  getRecruiterLabel,
  statusLabels,
  statusTones,
  toScorePercent,
} from "./candidate-list-utils";

interface ApplicantListProps {
  status?: string;
  emptyTitle: string;
  showReviewedAt?: boolean;
  enableClaim?: boolean;
}

export function ApplicantList({ status, emptyTitle, showReviewedAt = true, enableClaim = false }: ApplicantListProps) {
  const router = useRouter();
  const { search } = useApplicantSearch();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteApplications({
    status,
    search: search || undefined,
  });
  const claimMutation = useClaimApplication();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Couldn't load applicants." onRetry={() => { void refetch(); }} />;
  }

  const applications = (data?.pages ?? []).flatMap((page) => page.applications);

  if (applications.length === 0) {
    return (
      <EmptyState
        title={search ? `No applicants match "${search}"` : emptyTitle}
        description={search ? "Try a different search term." : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((application) => {
        const isClaimedByActiveRecruiter = application.claimedByRecruiterId === ACTIVE_RECRUITER_ID;
        const isClaiming = enableClaim && claimMutation.isPending && claimMutation.variables === application.applicationId;

        return (
          <ApplicantCard
            key={application.applicationId}
            name={application.candidateName}
            institute={application.cvSummary}
            systemScore={toScorePercent(application.hiringAgentTotalScore)}
            statusLabel={statusLabels[application.currentStatus]}
            statusTone={statusTones[application.currentStatus]}
            reviewedAt={formatDate(application.createdAt)}
            showReviewedAt={showReviewedAt}
            createdAt={application.createdAt}
            recruiterName={getRecruiterLabel(application)}
            {...(enableClaim
              ? {
                  secondaryActionLabel: isClaimedByActiveRecruiter ? "Claimed" : "Claim for review",
                  isSecondaryActionDisabled: isClaimedByActiveRecruiter || isClaiming,
                  isSecondaryActionLoading: isClaiming,
                  onSecondaryActionClick: isClaimedByActiveRecruiter
                    ? undefined
                    : () => {
                        claimMutation.mutate(application.applicationId);
                      },
                }
              : {})}
            onClick={() => {
              router.push(`/applicants/${application.applicationId}`);
            }}
          />
        );
      })}
      {hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          disabled={isFetchingNextPage}
          onClick={() => {
            void fetchNextPage();
          }}
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  );
}
