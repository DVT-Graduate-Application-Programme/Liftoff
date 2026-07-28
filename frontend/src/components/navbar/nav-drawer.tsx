"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

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
import { useRecruiters } from "@/hooks/use-recruiters";
import { NavMenu } from "./nav-menu";
import { LogoutButton } from "./logout-button";

export function NavDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const recruitersQuery = useRecruiters();
  const sessionEmail = session?.user?.email?.toLowerCase() ?? null;
  const sessionName = session?.user?.name ?? "Recruiter";
  const recruiter = recruitersQuery.data?.find(
    (candidate) => candidate.email.toLowerCase() === sessionEmail,
  );
  const displayName = recruiter?.fullName ?? sessionName;
  const displayEmail = recruiter?.email ?? session?.user?.email ?? "";

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
          <div className="mt-auto pt-3 flex flex-col gap-3">
            <Separator />
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                <Image
                  src="https://github.com/shadcn.png"
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="aspect-square h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{displayName}</span>
                <span className="mt-1.5 text-xs text-muted-foreground">
                  {displayEmail || "Signed in recruiter"}
                </span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
