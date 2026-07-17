"use client";

import { Search } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";

export function NavSearchBar() {
  const { search, setSearch } = useApplicantSearch();

  return (
    <InputGroup className="w-full max-w-2xl border border-accent">
      <InputGroupInput
        placeholder="Search applicants..."
        value={search}
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
