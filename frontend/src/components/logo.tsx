import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/landing"
      aria-label="Go to home"
      className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <h1 className={cn("text-primary font-extrabold text-3xl", className)}>
        DVT
      </h1>
    </Link>
  );
}
