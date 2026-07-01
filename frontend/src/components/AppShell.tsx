"use client";

import * as React from "react";
import Navbar from "@/components/Navbar/Navbar";
import { NavDrawer } from "@/components/Navbar/NavDrawer";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <>
      <Navbar
        onMenuClick={() => {
          setDrawerOpen((open) => !open);
        }}
      />
      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      {children}
    </>
  );
}
