import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import AllCandidates from "./components/all-candidates";
import PendingCandidates from "./components/pending-candidates";
import AcceptedCandidates from "./components/accepted-candidates";
import { ApplicantDetailsSidebar } from "./components/applicant-details/applicant-details-sidebar";
import { OpenApplicantDetailsSidebarButton } from "./components/applicant-details/applicant-details-sidebar-controls";
import { mockApplicantDetails } from "./components/applicant-details/mock-applicant-details";

const page = () => {
  return (
    <div className="w-full overflow-hidden">
      <SidebarProvider defaultOpen={false} className="min-h-0 w-full">
        <div className="flex h-full min-h-0 w-full overflow-hidden">
          <SidebarInset className="flex-1 overflow-y-auto min-w-1/3">
            <div className="flex w-full flex-col gap-4 p-4">
              <div className="flex items-center justify-center gap-2">
                <Input className="w-full max-w-2xl border border-accent" />
                <OpenApplicantDetailsSidebarButton />
              </div>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="self-center">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="all">All Candidates</TabsTrigger>
                  <TabsTrigger value="accepted">
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
            </div>
          </SidebarInset>
          <ApplicantDetailsSidebar
            candidateName="Alex Morgan"
            evaluation={mockApplicantDetails}
          />
        </div>
      </SidebarProvider>
    </div>
  );
};

export default page;
