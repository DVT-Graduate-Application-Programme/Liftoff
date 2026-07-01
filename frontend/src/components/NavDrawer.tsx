"use client";

import * as React from "react";
import { Cross, Minus, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { NavMenu } from "./NavMenu";

export function NavDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [goal, setGoal] = React.useState(350);

  function onClick(adjustment: number) {
    setGoal((prevGoal) => Math.max(200, Math.min(400, prevGoal + adjustment)));
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="left">
      <DrawerContent>
        <div className="w-full p-4">
          <DrawerHeader>
            <DrawerTitle>DVT</DrawerTitle>
          </DrawerHeader>
          <div className="pt-4 pb-0">
            <DrawerClose asChild className="absolute right-5 top-4">
              <Button variant="ghost">
                <X size={16} />
              </Button>
            </DrawerClose>
            <div className="w-full">
              <NavMenu />
            </div>
            <div className="mt-3 h-[120px]"></div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
