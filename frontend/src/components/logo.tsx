import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/landing"
      aria-label="Go to home"
      className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img
        src="/favicon.png"
        alt="DVT Logo"
        className={cn("h-10 w-auto", className)}
      />
    </Link>
  );
}

export function Slogan() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="hidden sm:block leading-tight">
        <p className="text-[9px] text-gray-400 tracking-wide">smart people</p>
        <p className="text-[9px] text-gray-400 tracking-wide">smart solutions</p>
      </div>
    </div>
  );
}
