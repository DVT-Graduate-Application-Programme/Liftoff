"use client";

import { useEffect, useMemo, useState } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import type { CandidateApplication } from "@/types/candidate";
import AllCandidates from "./components/all-candidates";
import PendingCandidates from "./components/pending-candidates";
import AcceptedCandidates from "./components/accepted-candidates";
import { ApplicantDetailsSidebar } from "./components/applicant-details/applicant-details-sidebar";
import type { ApplicantDetailsEvaluation } from "./components/applicant-details/mock-applicant-details";

type DashboardApplicationsResponse = {
  applications: CandidateApplication[];
};
type ClaimOwnershipResponse = {
  claimedByRecruiterId: string | null;
};

const ACTIVE_RECRUITER_ID = "recruiter1@company.com";

const LandingPage = () => {
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<CandidateApplication | null>(null);
  const [evaluation, setEvaluation] =
    useState<ApplicantDetailsEvaluation | null>(null);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);
  const [evaluationMessage, setEvaluationMessage] = useState<string | null>(
    null,
  );
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingApplicationId, setClaimingApplicationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    let isCurrent = true;

    const fetchApplications = async () => {
      setIsLoadingApplications(true);
      setError(null);

      try {
        const response = await fetch("/api/applications");

        if (!response.ok) {
          throw new Error("Unable to load applications.");
        }

        const data = (await response.json()) as DashboardApplicationsResponse;

        if (!isCurrent) return;

        setApplications(data.applications);
        setSelectedApplication(data.applications[0] ?? null);
      } catch (cause) {
        if (!isCurrent) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load applications.",
        );
      } finally {
        if (isCurrent) setIsLoadingApplications(false);
      }
    };

    void fetchApplications();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const fetchEvaluation = async () => {
      if (!selectedApplication) {
        setEvaluation(null);
        setEvaluationMessage(null);
        setIsLoadingEvaluation(false);
        return;
      }

      setEvaluation(null);
      setEvaluationMessage(null);
      setIsLoadingEvaluation(true);

      try {
        const response = await fetch(
          `/api/applications/${selectedApplication.applicationId}/evaluation`,
        );

        if (!isCurrent) return;

        if (response.status === 404) {
          setEvaluationMessage("No evaluation available for this applicant yet.");
          return;
        }

        if (!response.ok) {
          setEvaluationMessage("Unable to load evaluation results.");
          return;
        }

        setEvaluation((await response.json()) as ApplicantDetailsEvaluation);
      } catch {
        if (!isCurrent) return;
        setEvaluationMessage("Unable to load evaluation results.");
      } finally {
        if (isCurrent) setIsLoadingEvaluation(false);
      }
    };

    void fetchEvaluation();

    return () => {
      isCurrent = false;
    };
  }, [selectedApplication]);

  const pendingApplications = useMemo(
    () =>
      applications.filter(
        (application) => application.currentStatus === "PROCESSING",
      ),
    [applications],
  );

  const acceptedApplications = useMemo(
    () =>
      applications.filter((application) =>
        ["SHORTLISTED", "HIRED"].includes(application.currentStatus),
      ),
    [applications],
  );

  const handleClaimApplication = async (application: CandidateApplication) => {
    if (
      application.claimedByRecruiterId === ACTIVE_RECRUITER_ID ||
      claimingApplicationId === application.applicationId
    ) {
      return;
    }

    setClaimingApplicationId(application.applicationId);

    try {
      const response = await fetch(
        `/api/applications/${application.applicationId}/ownership/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recruiterIdentity: ACTIVE_RECRUITER_ID,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to claim candidate for review.");
      }

      const data = (await response.json()) as ClaimOwnershipResponse;
      const claimedByRecruiterId =
        data.claimedByRecruiterId ?? ACTIVE_RECRUITER_ID;

      setApplications((currentApplications) =>
        currentApplications.map((currentApplication) =>
          currentApplication.applicationId === application.applicationId
            ? { ...currentApplication, claimedByRecruiterId }
            : currentApplication,
        ),
      );

      setSelectedApplication((currentSelection) =>
        currentSelection?.applicationId === application.applicationId
          ? { ...currentSelection, claimedByRecruiterId }
          : currentSelection,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to claim candidate for review.",
      );
    } finally {
      setClaimingApplicationId(null);
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <SidebarProvider defaultOpen={false} className="min-h-0 w-full">
        <div className="flex h-full min-h-0 w-full overflow-hidden">
          <SidebarInset className="flex-1 overflow-y-auto min-w-1/3">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
              <div className="flex items-center justify-center gap-2">
                <Input className="w-full max-w-2xl border border-accent" />
              </div>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="mb-3 flex w-full justify-between gap-2">
                  <TabsTrigger
                    value="pending"
                    className="flex-1 rounded-t-md px-4 py-2 text-sm font-semibold text-muted-foreground data-active:border-b-2 data-active:border-primary data-active:text-foreground"
                  >
                    Pending Candidates
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="flex-1 rounded-t-md px-4 py-2 text-sm font-semibold text-muted-foreground data-active:border-b-2 data-active:border-primary data-active:text-foreground"
                  >
                    All Candidates
                  </TabsTrigger>
                  <TabsTrigger
                    value="accepted"
                    className="flex-1 rounded-t-md px-4 py-2 text-sm font-semibold text-muted-foreground data-active:border-b-2 data-active:border-primary data-active:text-foreground"
                  >
                    Accepted Candidates
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                  {isLoadingApplications ? (
                    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Loading applicants...
                    </p>
                  ) : error ? (
                    <p className="rounded-lg border border-dashed border-destructive/40 p-6 text-center text-sm text-destructive">
                      {error}
                    </p>
                  ) : (
                    <PendingCandidates
                      applications={pendingApplications}
                      onSelectApplication={setSelectedApplication}
                    />
                  )}
                </TabsContent>
                <TabsContent value="all">
                  <AllCandidates
                    applications={applications}
                    onSelectApplication={setSelectedApplication}
                    onClaimApplication={handleClaimApplication}
                    claimingApplicationId={claimingApplicationId}
                    activeRecruiterId={ACTIVE_RECRUITER_ID}
                  />
                </TabsContent>
                <TabsContent value="accepted">
                  <AcceptedCandidates
                    applications={acceptedApplications}
                    onSelectApplication={setSelectedApplication}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </SidebarInset>
          {selectedApplication ? (
            <ApplicantDetailsSidebar
              candidateName={selectedApplication.candidateName}
              evaluation={evaluation}
              isLoadingEvaluation={isLoadingEvaluation}
              evaluationMessage={evaluationMessage}
            />
          ) : null}
        </div>
      </SidebarProvider>
    </div>
  );
};

export default LandingPage;
