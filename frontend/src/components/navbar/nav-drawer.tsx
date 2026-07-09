"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
          <DrawerHeader>
            <DrawerTitle>DVT</DrawerTitle>
          </DrawerHeader>
          <div className="relative pt-4 pb-0">
            <DrawerClose asChild className="absolute right-5 top-4">
              <Button variant="ghost">
                <X size={16} />
              </Button>
            </DrawerClose>
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
