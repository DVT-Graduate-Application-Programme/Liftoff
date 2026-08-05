"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";
import { useCandidateSearch } from "@/hooks/use-candidate-search";
import { getStatusTone } from "@/app/landing/components/candidate-list-utils";
import { cn } from "@/lib/utils";

const toneHeadingClassName: Record<ReturnType<typeof getStatusTone>, string> = {
  positive: "**:[[cmdk-group-heading]]:text-primary dark:**:[[cmdk-group-heading]]:text-sky-300",
  warning: "**:[[cmdk-group-heading]]:text-amber-700 dark:**:[[cmdk-group-heading]]:text-chart-4",
  negative: "**:[[cmdk-group-heading]]:text-red-700 dark:**:[[cmdk-group-heading]]:text-destructive",
  neutral: "**:[[cmdk-group-heading]]:text-muted-foreground",
};

export function NavSearchBar({
  className,
  autoFocus = false,
}: {
  className?: string;
  autoFocus?: boolean;
}) {
  const { search, setSearch } = useApplicantSearch();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { groups, isLoading, hasQuery } = useCandidateSearch(search);

  const goToCandidate = (applicationId: string) => {
    setOpen(false);
    router.push(`/applicants/${applicationId}?from=search`);
  };

  return (
    <Command
      shouldFilter={false}
      className="w-full max-w-2xl overflow-visible bg-transparent pt-4"
    >
      <Popover open={open && hasQuery} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <InputGroup className={cn("w-full max-w-2xl border border-accent", className)}>
            <InputGroupInput
              placeholder="Search applicants..."
              value={search}
              autoFocus={autoFocus}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => { setOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          onOpenAutoFocus={(e) => { e.preventDefault(); }}
          onInteractOutside={() => { setOpen(false); }}
          className="w-[var(--radix-popper-anchor-width)] p-0"
        >
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading candidates…</CommandEmpty>
            ) : groups.length === 0 ? (
              <CommandEmpty>No candidates found.</CommandEmpty>
            ) : (
              groups.map((group) => (
                <CommandGroup
                  key={group.status}
                  heading={group.label}
                  className={toneHeadingClassName[getStatusTone(group.status)]}
                >
                  {group.candidates.map((candidate) => (
                    <CommandItem
                      key={candidate.applicationId}
                      value={candidate.applicationId}
                      onSelect={() => { goToCandidate(candidate.applicationId); }}
                    >
                      {candidate.candidateName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
}
