"use client";

import { useMemo, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";
import { useApplicantSelection } from "@/components/providers/applicant-selection-provider";
import { useInfiniteApplications } from "@/hooks/use-infinite-applications";
import { useEvaluation } from "@/hooks/use-evaluation";
import {
  ACTIVE_RECRUITER_ID,
  useClaimApplication,
} from "@/hooks/use-claim-application";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import ApplicantCard from "@/components/applicant-card/applicant-card";
import PendingCandidateCard from "@/components/applicant-card/pending-candidate-card";
import type { CandidateApplication } from "@/types/candidate";
import type { ApplicationFilters, PaginatedApplications } from "@/types/api";
import {
  formatDate,
  getRecruiterLabel,
  groupApplicationsByDate,
  getStatusLabel,
  getStatusTone,
  toScorePercent,
} from "./candidate-list-utils";
import type { Evaluation } from "@/types/api";
import router from "next/router";

interface ApplicantListProps {
  status?: string;
  tabKey: "pending" | "all" | "accepted";
  filters?: ApplicationFilters;
  emptyTitle: string;
  showReviewedAt?: boolean;
  enableClaim?: boolean;
  groupByDate?: boolean;
  renderItem?: (application: CandidateApplication) => ReactNode;
  renderCard?: (application: CandidateApplication) => ReactElement;
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

function getEducationSubtitle(evaluation: Evaluation | null | undefined, fallback: string) {
  const educationEvidence = evaluation?.evidenceJson?.education?.trim();
  return educationEvidence || fallback;
}

function parseEducationDisplay(education: string) {
  const parts = education
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    degree: parts[0] ?? education,
    university: parts[1] ?? "",
  };
}

function PendingApplicationCard({
  application,
  enableClaim,
  selectApplication,
  setOpen,
  claimMutation,
}: {
  application: CandidateApplication;
  enableClaim: boolean;
  selectApplication: (applicationId: string) => void;
  setOpen: (open: boolean) => void;
  claimMutation: ReturnType<typeof useClaimApplication>;
}) {
  const evaluationQuery = useEvaluation(application.applicationId);
  const isClaimedByActiveRecruiter =
    application.claimedByRecruiterId === ACTIVE_RECRUITER_ID;
  const isClaiming =
    enableClaim &&
    claimMutation.isPending &&
    claimMutation.variables === application.applicationId;

  const education = parseEducationDisplay(
    getEducationSubtitle(evaluationQuery.data, application.cvSummary),
  );

  return (
    <PendingCandidateCard
      key={application.applicationId}
      name={application.candidateName}
      institute={education.degree}
      secondaryInstitute={education.university}
      systemScore={toScorePercent(application.hiringAgentTotalScore)}
      academicAverage={application.academicAverage}
      createdAt={application.createdAt}
      showInstitute
      {...(enableClaim
        ? {
            secondaryActionLabel: isClaimedByActiveRecruiter
              ? "Claimed"
              : "Claim for review",
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
}

export function ApplicantList({
  status,
  tabKey,
  filters,
  emptyTitle,
  showReviewedAt = true,
  enableClaim = false,
  groupByDate = false,
  renderItem,
  renderCard,
}: ApplicantListProps) {
  const router = useRouter();
  const { search } = useApplicantSearch();
  const { selectApplication } = useApplicantSelection();
  const { setOpen } = useSidebar();
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteApplications({
    ...filters,
    status: status ?? filters?.status,
    search: search || undefined,
  });
  const claimMutation = useClaimApplication();
  const applications = useMemo(
    () =>
      (data?.pages ?? []).flatMap(
        (page: PaginatedApplications) => page.applications,
      ),
    [data?.pages],
  );
  const claimableApplication = (application: CandidateApplication) => {
    const isClaimedByActiveRecruiter =
      application.claimedByRecruiterId === ACTIVE_RECRUITER_ID;
    const isClaiming =
      enableClaim &&
      claimMutation.isPending &&
      claimMutation.variables === application.applicationId;

    return {
      isClaimedByActiveRecruiter,
      isClaiming,
    };
  };

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
    return (
      <ErrorState
        message="Couldn't load applicants."
        onRetry={() => {
          void refetch();
        }}
      />
    );
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

    if (renderItem) {
      return <div key={application.applicationId}>{renderItem(application)}</div>;
    }

    if (application.currentStatus === "PENDING") {
      return (
        <PendingApplicationCard
          key={application.applicationId}
          application={application}
          enableClaim={enableClaim}
          selectApplication={selectApplication}
          setOpen={setOpen}
          claimMutation={claimMutation}
        />
      );
    }

    const { isClaimedByActiveRecruiter, isClaiming } =
      claimableApplication(application);
    const commonProps = {
      name: application.candidateName,
      institute: application.cvSummary,
      systemScore: toScorePercent(application.hiringAgentTotalScore),
      reviewedAt: formatDate(application.createdAt),
      showReviewedAt,
      createdAt: application.createdAt,
      recruiterName: getRecruiterLabel(application),
      ...(enableClaim
        ? {
            secondaryActionLabel: isClaimedByActiveRecruiter
              ? "Claimed"
              : "Claim for review",
            isSecondaryActionDisabled:
              isClaimedByActiveRecruiter || isClaiming,
            isSecondaryActionLoading: isClaiming,
            onSecondaryActionClick: isClaimedByActiveRecruiter
              ? undefined
              : () => {
                  claimMutation.mutate(application.applicationId);
                },
          }
        : {}),
      onClick: () => {
        void router.push(`/applicants/${application.applicationId}`);
      },
      onActionClick: () => {
        selectApplication(application.applicationId, tabKey);
        setOpen(true);
      },
    };

    return (
      <ApplicantCard
        key={application.applicationId}
        statusLabel={getStatusLabel(application.currentStatus)}
        statusTone={getStatusTone(application.currentStatus)}
        {...commonProps}
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
    const groupedApplications =
      groupApplicationsByDate<CandidateApplication>(applications);

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
        {loadMoreButton && (
          <div className="flex justify-center">{loadMoreButton}</div>
        )}
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
