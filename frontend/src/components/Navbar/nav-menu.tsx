"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutDashboard, Users, History } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  isActive?: boolean;
};
const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "#",
    isActive: true,
  },
  { label: "Applicants", icon: Users, href: "#" },
  { label: "Review History", icon: History, href: "#" },
];

export function NavMenu() {
  return (
    <nav className="w-full" aria-label="Drawer navigation">
      <ul className="m-0 w-full list-none space-y-2 p-0">
        {navItems.map((item) => (
          <li key={item.label} className="w-full">
            <Link
              href={item.href}
              className={cn(
                "block w-full text-primary rounded-md px-0 py-4 text-sm font-medium transition-colors hover:bg-muted",
                item.isActive && "bg-muted",
              )}
            >
              <span className="flex items-center gap-4 px-4">
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
