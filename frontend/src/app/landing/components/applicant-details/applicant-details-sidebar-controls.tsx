"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

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
