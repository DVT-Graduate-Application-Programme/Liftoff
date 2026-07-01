import { Bell, Menu, Settings } from "lucide-react";
import React from "react";
import { ModeToggle } from "./mode-toggle";
import { NavSearchBar } from "./NavSearchBar";
import { Button } from "./ui/button";

function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <nav className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation drawer"
          onClick={onMenuClick}
        >
          <Menu />
        </Button>
        <div>
          <h1 className="text-primary font-extrabold text-3xl">DVT</h1>
        </div>
        <NavSearchBar />
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings />
        </Button>
        <ModeToggle />
      </div>
    </nav>
  );
}

export default Navbar;
