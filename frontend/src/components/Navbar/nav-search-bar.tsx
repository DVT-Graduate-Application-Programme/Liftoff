import { Search } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export function NavSearchBar() {
  return (
    <InputGroup className="max-w-xs">
      <InputGroupInput placeholder="Search applicants..." />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
}
