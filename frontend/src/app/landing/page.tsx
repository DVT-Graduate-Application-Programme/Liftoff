"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AllCandidates from "./components/all-candidates";
import PendingCandidates from "./components/pending-candidates";
import AcceptedCandidates from "./components/accepted-candidates";
import { ApplicantDetailsSidebar } from "./components/applicant-details/applicant-details-sidebar";
import {
  ApplicantSelectionProvider,
  useApplicantSelection,
} from "@/components/providers/applicant-selection-provider";
import { useApplicant } from "@/hooks/use-applicant";
import { useEvaluation } from "@/hooks/use-evaluation";

function SelectedApplicantDetailsSidebar() {
  const { selectedApplicationId, selectedTabKey } = useApplicantSelection();
  const applicantQuery = useApplicant(selectedApplicationId ?? "");
  const evaluationQuery = useEvaluation(selectedApplicationId ?? "");

  const evaluationMessage = !selectedApplicationId
    ? "Select a candidate's “Show AI Summary” to view their evaluation here."
    : evaluationQuery.isError
      ? "Couldn't load evaluation."
      : null;

  return (
    <ApplicantDetailsSidebar
      applicantId={selectedApplicationId}
      candidateName={applicantQuery.data?.candidateName ?? "Applicant"}
      evaluation={evaluationQuery.data ?? null}
      isLoadingEvaluation={Boolean(selectedApplicationId) && (applicantQuery.isLoading || evaluationQuery.isLoading)}
      evaluationMessage={evaluationMessage}
      tabKey={selectedTabKey}
    />
  );
}

const VALID_TABS = ["pending", "all", "accepted"] as const;
type TabValue = (typeof VALID_TABS)[number];

function isTabValue(value: string | null): value is TabValue {
  return VALID_TABS.includes(value as TabValue);
}

function DashboardTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    return isTabValue(tab) ? tab : "pending";
  }, [searchParams]);

  const handleTabChange = useCallback(
    (value: string) => {
      router.replace(`/landing?tab=${value}`, { scroll: false });
    },
    [router],
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
        <PendingCandidates />
      </TabsContent>
      <TabsContent value="all">
        <AllCandidates />
      </TabsContent>
      <TabsContent value="accepted">
        <AcceptedCandidates />
      </TabsContent>
    </Tabs>
  );
}

const Page = () => {
  return (
    <ApplicantSelectionProvider>
      <div className="w-full overflow-hidden">
        <SidebarProvider defaultOpen={false} className="min-h-0 w-full">
          <div className="flex h-full min-h-0 w-full overflow-hidden">
            <SidebarInset className="flex-1 overflow-y-auto min-w-1/3">
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
                <Suspense fallback={null}>
                  <DashboardTabs />
                </Suspense>
              </div>
            </SidebarInset>
            <SelectedApplicantDetailsSidebar />
          </div>
        </SidebarProvider>
      </div>
    </ApplicantSelectionProvider>
  );
};

export default Page;
