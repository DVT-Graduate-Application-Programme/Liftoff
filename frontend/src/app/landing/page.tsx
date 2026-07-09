"use client";

import { useEffect, useMemo, useState } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { CandidateApplication } from "@/types/candidate";
import AllCandidates from "./components/all-candidates";
import PendingCandidates from "./components/pending-candidates";
import AcceptedCandidates from "./components/accepted-candidates";
import { ApplicantDetailsSidebar } from "./components/applicant-details/applicant-details-sidebar";
import { OpenApplicantDetailsSidebarButton } from "./components/applicant-details/applicant-details-sidebar-controls";
import type { ApplicantDetailsEvaluation } from "./components/applicant-details/mock-applicant-details";

type DashboardApplicationsResponse = {
  applications: CandidateApplication[];
};

const LandingPage = () => {
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<CandidateApplication | null>(null);
  const [evaluation, setEvaluation] =
    useState<ApplicantDetailsEvaluation | null>(null);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        return;
      }

      setEvaluation(null);

      const response = await fetch(
        `/api/applications/${selectedApplication.applicationId}/evaluation`,
      );

      if (!isCurrent) return;

      if (!response.ok) {
        return;
      }

      setEvaluation((await response.json()) as ApplicantDetailsEvaluation);
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

  return (
    <div className="w-full overflow-hidden">
      <SidebarProvider defaultOpen={false} className="min-h-0 w-full">
        <div className="flex h-full min-h-0 w-full overflow-hidden">
          <SidebarInset className="flex-1 overflow-y-auto min-w-1/3">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
              <div className="flex items-center justify-end">
                <OpenApplicantDetailsSidebarButton />
              </div>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="self-center">        {/*  For underlined tab <TabsList className="self-center" variant="line"></TabsList> */}
                  <TabsTrigger value="pending">Pending Candidates</TabsTrigger>
                  <TabsTrigger value="all">All Candidates</TabsTrigger>
                  <TabsTrigger value="accepted">Accepted Candidates</TabsTrigger>
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
          {selectedApplication && evaluation ? (
            <ApplicantDetailsSidebar
              candidateName={selectedApplication.candidateName}
              evaluation={evaluation}
            />
          ) : null}
        </div>
      </SidebarProvider>
    </div>
  );
};

export default LandingPage;
