"use client";

import { useMemo, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";
import {
  useApplicantSelection,
  type SelectionTabKey,
} from "@/components/providers/applicant-selection-provider";
import { useInfiniteApplications } from "@/hooks/use-infinite-applications";
import { useEvaluation } from "@/hooks/use-evaluation";
import { useRecruiters } from "@/hooks/use-recruiters";
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

interface ApplicantListProps {
  status?: string;
  tabKey: "pending" | "all" | "accepted";
  filters?: ApplicationFilters;
  emptyTitle: string;
  showReviewedAt?: boolean;
  enableClaim?: boolean;
  groupByDate?: boolean;
  groupByMarks?: boolean;
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

const MARKS_BUCKET_SECTIONS = [
  {
    key: "excellent" as const,
    label: "Marks 85 and Above",
    countLabel: (count: number) => `${String(count)} Candidates`,
    emptyText: "No candidates with marks 85 and above.",
    headerColorClass: "text-emerald-600 dark:text-emerald-400",
    lineColorClass: "bg-emerald-200 dark:bg-emerald-800/30",
    countColorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/20",
  },
  {
    key: "good" as const,
    label: "Marks Between 75 and 85",
    countLabel: (count: number) => `${String(count)} Candidates`,
    emptyText: "No candidates with marks between 75 and 85.",
    headerColorClass: "text-sky-600 dark:text-sky-400",
    lineColorClass: "bg-sky-200 dark:bg-sky-800/30",
    countColorClass: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/20",
  },
  {
    key: "average" as const,
    label: "Marks Between 65 and 75",
    countLabel: (count: number) => `${String(count)} Candidates`,
    emptyText: "No candidates with marks between 65 and 75.",
    headerColorClass: "text-amber-600 dark:text-amber-400",
    lineColorClass: "bg-amber-200 dark:bg-amber-800/30",
    countColorClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/20",
  },
  {
    key: "fail" as const,
    label: "Marks Less Than 65",
    countLabel: (count: number) => `${String(count)} Candidates`,
    emptyText: "No candidates with marks less than 65.",
    headerColorClass: "text-red-600 dark:text-red-400",
    lineColorClass: "bg-red-200 dark:bg-red-800/30",
    countColorClass: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/20",
  },
];

function getMarksBucket(systemScore?: number | null): "excellent" | "good" | "average" | "fail" {
  const score = systemScore ?? 0;
  if (score >= 85) return "excellent";
  if (score >= 75) return "good";
  if (score >= 65) return "average";
  return "fail";
}
function groupApplicationsByMarks(applications: CandidateApplication[]) {
  const groups = {
    excellent: [] as CandidateApplication[],
    good: [] as CandidateApplication[],
    average: [] as CandidateApplication[],
    fail: [] as CandidateApplication[],
  };

  for (const app of applications) {
    const bucket = getMarksBucket(app.hiringAgentTotalScore);
    groups[bucket].push(app);
  }

  for (const key of Object.keys(groups) as Array<keyof typeof groups>) {
    groups[key].sort((a, b) => b.hiringAgentTotalScore - a.hiringAgentTotalScore);
  }

  return groups;
}
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
  groupByMarks = false,
  renderItem,
  renderCard,
}: ApplicantListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const recruiterIdentity = session?.user.email ?? ACTIVE_RECRUITER_ID;
  const { search } = useApplicantSearch();
  const { selectApplication } = useApplicantSelection();
  const { setOpen, setOpenMobile } = useSidebar();
  const recruitersQuery = useRecruiters();

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

    const shouldUsePendingCard =
      tabKey === "pending" &&
      ["PENDING", "PROCESSING"].includes(application.currentStatus.toUpperCase());

    if (shouldUsePendingCard) {
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
      showStatus: tabKey !== "pending",
      createdAt: application.createdAt,
      recruiterName: getRecruiterLabel(application, recruitersQuery.data),
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

  if (groupByMarks) {
    const groupedApplications = groupApplicationsByMarks(applications);

    return (
      <div className="space-y-10">
        {MARKS_BUCKET_SECTIONS.map(
          ({
            key,
            label,
            countLabel,
            emptyText,
            headerColorClass,
            lineColorClass,
            countColorClass,
          }) => {
            const bucketApplications = groupedApplications[key];

            return (
              <section key={key}>
                <div className="mb-4 flex items-center gap-4">
                  <h3
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest",
                      headerColorClass,
                    )}
                  >
                    {label}
                  </h3>
                  <div className={cn("h-px flex-1", lineColorClass)}></div>
                  <span
                    className={cn(
                      "text-[12px] font-semibold px-2 py-0.5 rounded-full border leading-none tabular-nums",
                      countColorClass,
                    )}
                  >
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
          },
        )}
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
