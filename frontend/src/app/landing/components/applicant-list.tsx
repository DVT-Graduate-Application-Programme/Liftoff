"use client";

import { useMemo, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";
import {
  useApplicantSelection,
  type SelectionTabKey,
} from "@/components/providers/applicant-selection-provider";
import { useInfiniteApplications } from "@/hooks/use-infinite-applications";
import { useEvaluation } from "@/hooks/use-evaluation";
import {
  ACTIVE_RECRUITER_ID,
  useClaimApplication,
} from "@/hooks/use-claim-application";
import { useSidebar } from "@/components/ui/sidebar";
import { LoadMoreButton } from "@/components/load-more-button";
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
  isClaimedByActiveRecruiter,
  parseEducationEvidence,
  toScorePercent,
} from "./candidate-list-utils";
import type { Evaluation } from "@/types/api";

type SessionValue = {
  user?: {
    email?: string | null;
  } | null;
} | null;

const useTypedSession = useSession as unknown as () => { data: SessionValue };

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
  const educationEvidence = evaluation?.evidenceJson?.education.trim();
  return educationEvidence || fallback;
}

function PendingApplicationCard({
  application,
  enableClaim,
  recruiterIdentity,
  openDetails,
  claimMutation,
}: {
  application: CandidateApplication;
  enableClaim: boolean;
  recruiterIdentity: string;
  openDetails: (applicationId: string) => void;
  claimMutation: ReturnType<typeof useClaimApplication>;
}) {
  const router = useRouter();
  const evaluationQuery = useEvaluation(application.applicationId);
  const isClaimed = isClaimedByActiveRecruiter(application, recruiterIdentity);
  const isClaiming =
    enableClaim &&
    claimMutation.isPending &&
    claimMutation.variables === application.applicationId;

  const education = parseEducationEvidence(
    getEducationSubtitle(evaluationQuery.data, application.cvSummary),
  );

  const academicAverage =
    evaluationQuery.data?.institutionJson?.academic_average ??
    evaluationQuery.data?.categoryScoresJson.education.score ??
    application.academicAverage;

  return (
    <PendingCandidateCard
      key={application.applicationId}
      name={application.candidateName}
      institute={education.degree || application.cvSummary}
      secondaryInstitute={education.institution || undefined}
      recruiterLabel="Recruiter"
      recruiterName={getRecruiterLabel(application)}
      systemScore={toScorePercent(application.hiringAgentTotalScore)}
      academicAverage={academicAverage}
      createdAt={application.createdAt}
      showInstitute
      {...(enableClaim
        ? {
            secondaryActionLabel: isClaimed ? "Claimed" : "Claim for review",
            isSecondaryActionDisabled: isClaimed || isClaiming,
            isSecondaryActionLoading: isClaiming,
            onSecondaryActionClick: isClaimed
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
        openDetails(application.applicationId);
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
  const { data: session } = useTypedSession();
  const recruiterIdentity = session?.user?.email ?? ACTIVE_RECRUITER_ID;
  const { search } = useApplicantSearch();
  const { selectApplication } = useApplicantSelection();
  const { setOpen, setOpenMobile } = useSidebar();

  // Opens the details panel. The Sidebar mounts one branch at a time — a mobile
  // Sheet (openMobile) or a desktop offcanvas (open) — so set both to reliably
  // open whichever is live.
  const openDetails = (applicationId: string, tab?: SelectionTabKey) => {
    selectApplication(applicationId, tab);
    setOpen(true);
    setOpenMobile(true);
  };
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
      application.claimedByRecruiterId === recruiterIdentity;
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
          recruiterIdentity={recruiterIdentity}
          openDetails={openDetails}
          claimMutation={claimMutation}
        />
      );
    }

    const { isClaiming } = claimableApplication(application);
    const displayStatus: CandidateApplication["currentStatus"] = application.currentStatus;
    const commonProps = {
      name: application.candidateName,
      institute: application.cvSummary,
      systemScore: toScorePercent(application.hiringAgentTotalScore),
      reviewedAt: formatDate(application.createdAt),
      showReviewedAt,
      createdAt: application.createdAt,
      recruiterName: getRecruiterLabel(application),
      statusLabel: getStatusLabel(displayStatus),
      ...(enableClaim
        ? {
            secondaryActionLabel: application.claimedByRecruiterId
              ? "Claimed"
              : "Claim for review",
            isSecondaryActionDisabled:
              Boolean(application.claimedByRecruiterId) || isClaiming,
            isSecondaryActionLoading: isClaiming,
            onSecondaryActionClick: application.claimedByRecruiterId
              ? undefined
              : () => {
                  claimMutation.mutate(application.applicationId);
                },
          }
        : {}),
      onClick: () => {
        router.push(`/applicants/${application.applicationId}`);
      },
      onActionClick: () => {
        openDetails(application.applicationId, tabKey);
      },
    };

    return (
      <ApplicantCard
        key={application.applicationId}
        statusTone={getStatusTone(displayStatus)}
        {...commonProps}
      />
    );
  };

  const loadMoreButton = (
    <LoadMoreButton
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onClick={() => {
        void fetchNextPage();
      }}
    />
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
              <div className="@container grid grid-cols-1 gap-4">
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
        {hasNextPage && (
          <div className="flex justify-center">{loadMoreButton}</div>
        )}
      </div>
    );
  }

  return (
    <div className="@container flex flex-col gap-3">
      {applications.map(renderCardItem)}
      {loadMoreButton}
    </div>
  );
}
