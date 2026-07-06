import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { CloseApplicantDetailsSidebarButton } from "./applicant-details-sidebar-controls";

export function ApplicantDetailsSidebar() {
  return (
    <Sidebar side="right" collapsible="offcanvas" className="top-16 h-auto">
      <SidebarContent>
        <SidebarGroup>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Applicant details</p>
            <CloseApplicantDetailsSidebarButton />
          </div>
          <SidebarMenu>Hello sidebar</SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
