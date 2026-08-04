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
