"use client";

import { Search } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";
import { cn } from "@/lib/utils";

export function NavSearchBar({
  className,
  autoFocus = false,
}: {
  className?: string;
  autoFocus?: boolean;
}) {
  const { search, setSearch } = useApplicantSearch();

  return (
    <InputGroup className={cn("w-full max-w-2xl border border-accent", className)}>
      <InputGroupInput
        placeholder="Search applicants..."
        value={search}
        autoFocus={autoFocus}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
}
