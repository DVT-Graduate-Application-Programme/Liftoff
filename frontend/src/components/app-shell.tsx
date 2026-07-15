"use client";

import * as React from "react";
import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { NavDrawer } from "./navbar/nav-drawer";
import Navbar from "./navbar/navbar";
import { Breadcrumbs } from "./breadcrumbs";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar
        onMenuClick={() => {
          setDrawerOpen((open) => !open);
        }}
      />
      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <Suspense fallback={null}>
        <Breadcrumbs />
      </Suspense>
      {children}
    </>
  );
}
