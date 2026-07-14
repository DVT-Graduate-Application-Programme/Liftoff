"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";
import { useApplicantSelection } from "@/components/providers/applicant-selection-provider";
import { useInfiniteApplications } from "@/hooks/use-infinite-applications";
import { ACTIVE_RECRUITER_ID, useClaimApplication } from "@/hooks/use-claim-application";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import ApplicantCard from "@/components/applicant-card/applicant-card";
import type { CandidateApplication } from "@/types/candidate";
import type { ApplicationFilters, PaginatedApplications } from "@/types/api";
import {
  formatDate,
  getRecruiterLabel,
  groupApplicationsByDate,
  statusLabels,
  statusTones,
  toScorePercent,
} from "./candidate-list-utils";

interface ApplicantListProps {
  status?: string;
  filters?: ApplicationFilters;
  emptyTitle: string;
  showReviewedAt?: boolean;
  enableClaim?: boolean;
  groupByDate?: boolean;
  filterApplications?: (applications: CandidateApplication[]) => CandidateApplication[];
  sortApplications?: (applications: CandidateApplication[]) => CandidateApplication[];
  renderCard?: (application: CandidateApplication) => ReactNode;
}

const DATE_BUCKET_SECTIONS = [
  {
    key: "today" as const,
    label: "Today",
    countLabel: (count: number) => `${String(count)} New Applicants`,
    emptyText: "No pending applicants received today.",
  },
  {
    key: "thisWeek" as const,
    label: "This Week",
    countLabel: (count: number) => `${String(count)} Applicants`,
    emptyText: "No pending applicants from earlier this week.",
  },
  {
    key: "lastWeek" as const,
    label: "Last Week",
    countLabel: (count: number) => `${String(count)} Applicants`,
    emptyText: "No pending applicants from last week.",
  },
  {
    key: "older" as const,
    label: "Older",
    countLabel: (count: number) => `${String(count)} Applicants`,
    emptyText: "No older pending applicants.",
  },
];

export function ApplicantList({
  status,
  filters,
  emptyTitle,
  showReviewedAt = true,
  enableClaim = false,
  groupByDate = false,
  filterApplications,
  sortApplications,
  renderCard,
}: ApplicantListProps) {
  const router = useRouter();
  const { search } = useApplicantSearch();
  const { selectApplication } = useApplicantSelection();
  const { setOpen } = useSidebar();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteApplications({
    ...filters,
    status: status ?? filters?.status,
    search: search || undefined,
  });
  const claimMutation = useClaimApplication();
  const applications = useMemo(() => {
    const loadedApplications = (data?.pages ?? []).flatMap(
      (page: PaginatedApplications) => page.applications,
    );
    const filteredApplications = filterApplications ? filterApplications(loadedApplications) : loadedApplications;
    return sortApplications ? sortApplications(filteredApplications) : filteredApplications;
  }, [data?.pages, filterApplications, sortApplications]);

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

  if (applications.length === 0) {
    return (
      <EmptyState
        title={search ? `No applicants match "${search}"` : emptyTitle}
        description={search ? "Try a different search term." : undefined}
      />
    );
  }

  const renderCardItem = (application: CandidateApplication) => {
    if (renderCard) {
      return renderCard(application);
    }

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
        onActionClick={() => {
          selectApplication(application.applicationId);
          setOpen(true);
        }}
      />
    );
  };

  const loadMoreButton = hasNextPage && (
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
  );

  if (groupByDate) {
    const groupedApplications = groupApplicationsByDate<CandidateApplication>(applications);

    return (
      <div className="space-y-10">
        {DATE_BUCKET_SECTIONS.map(({ key, label, countLabel, emptyText }) => {
          const bucketApplications = groupedApplications[key];

          return (
            <section key={key}>
              <div className="mb-4 flex items-center gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {label}
                </h3>
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-[12px] font-medium text-muted-foreground">
                  {countLabel(bucketApplications.length)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {bucketApplications.length > 0 ? (
                  bucketApplications.map(renderCardItem)
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    {emptyText}
                  </p>
                )}
              </div>
            </section>
          );
        })}
        {loadMoreButton && <div className="flex justify-center">{loadMoreButton}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map(renderCardItem)}
      {loadMoreButton}
    </div>
  );
}
