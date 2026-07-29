import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { NavSearchBar } from "./nav-search-bar";

function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 flex flex-col shrink-0 border-b bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation drawer"
            onClick={onMenuClick}
          >
            <Menu />
          </Button>
          <Logo />
        </div>

        {/* Full search bar — hidden on mobile, shown from sm up */}
        <NavSearchBar className="hidden sm:flex" />

        <div className="flex gap-2">
          {/* Mobile-only search toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search applicants"
            className="sm:hidden"
            onClick={() => {
              setMobileSearchOpen((open) => !open);
            }}
          >
            {mobileSearchOpen ? <X /> : <Search />}
          </Button>
          <ModeToggle />
        </div>
      </div>

      {/* Mobile search row — expands below the nav bar when toggled */}
      {mobileSearchOpen && (
        <div className="border-t bg-sidebar px-4 py-3 shadow-sm sm:hidden">
          <NavSearchBar autoFocus />
        </div>
      )}
    </nav>
  );
}

export default Navbar;
