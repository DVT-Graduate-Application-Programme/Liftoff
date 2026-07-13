"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, History } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
};
type NavMenuProps = {
  onItemNavigate?: () => void;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/landing" },
  { label: "Applicants", icon: Users, href: "/applicants" },
  { label: "Review History", icon: History, href: "/history" },
];

export function NavMenu({ onItemNavigate }: NavMenuProps) {
  const pathname = usePathname();

  return (
    <nav className="w-full" aria-label="Drawer navigation">
      <ul className="m-0 w-full list-none space-y-2 p-0">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <li key={item.label} className="w-full">
              <Link
                href={item.href}
                onNavigate={onItemNavigate}
                className={cn(
                  "block w-full text-primary rounded-md px-0 py-4 text-sm font-medium transition-colors hover:bg-muted",
                  isActive && "bg-muted",
                )}
              >
                <span className="flex items-center gap-4 px-4">
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
