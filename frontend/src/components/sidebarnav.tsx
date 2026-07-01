import {
  Bell,
  History,
  LayoutDashboard,
  Rocket,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NavSearchBar } from "./NavSearchBar";
import { Button } from "./ui/button";

type NavItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  isActive?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type SidebarData = {
  branding: {
    title: string;
    description: string;
  };
  navGroups: NavGroup[];
};

const sidebarData: SidebarData = {
  branding: {
    title: "Liftoff",
    description: "Graduate Recruitment Portal",
  },
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "#",
          isActive: true,
        },
        { label: "Applicants", icon: Users, href: "#" },
        { label: "Review History", icon: History, href: "#" },
      ],
    },
  ],
};

const SidebarLogo = ({ branding }: { branding: SidebarData["branding"] }) => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <div className="flex aspect-square size-8 items-center justify-center rounded-sm">
            <Rocket size={24} className="text-primary" />
          </div>

          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-medium">{branding.title}</span>
            <span className="text-xs text-muted-foreground">
              {branding.description}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="py-8">
        <SidebarLogo branding={sidebarData.branding} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.href}>
                        <item.icon />
                        {item.label}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

interface SidebarProps {
  className?: string;
  children?: React.ReactNode;
}

const SidebarNav = ({ className, children }: SidebarProps) => {
  return (
    <SidebarProvider className={cn(className)}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-white">
          <div>
            <NavSearchBar />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" aria-label="Notifications">
              <Bell />
            </Button>
            <Button variant="outline" size="icon" aria-label="Settings">
              <Settings />
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export { SidebarNav };
