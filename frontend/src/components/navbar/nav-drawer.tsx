"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { NavMenu } from "./nav-menu";
import { LogoutButton } from "./logout-button";

export function NavDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="left">
      <DrawerContent>
        <div className="flex h-full w-full flex-col p-4">
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle className="sr-only">Navigation menu</DrawerTitle>
            <Logo />
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close navigation drawer">
                <X size={16} />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="pt-4 pb-0">
            <div className="w-full">
              <NavMenu
                onItemNavigate={() => {
                  onOpenChange(false);
                }}
              />
            </div>
          </div>
          <div className="mt-auto pt-3">
            <Separator />
            <LogoutButton />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
