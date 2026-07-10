import { Search } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export function NavSearchBar() {
  return (
    <InputGroup className="w-full max-w-2xl border border-accent">
      <InputGroupInput placeholder="Search applicants..." />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
}
