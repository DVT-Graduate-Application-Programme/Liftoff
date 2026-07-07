"use client";

import { PanelRightOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function OpenApplicantDetailsSidebarButton() {
  const { open, setOpen } = useSidebar();

  if (open) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="shrink-0"
      onClick={() => {
        setOpen(true);
      }}
    >
      <PanelRightOpen className="size-4" />
      Open applicant details
    </Button>
  );
}

export function CloseApplicantDetailsSidebarButton() {
  const { open, setOpen } = useSidebar();

  if (!open) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Close applicant details sidebar"
      onClick={() => {
        setOpen(false);
      }}
    >
      <X className="size-4" />
    </Button>
  );
}
