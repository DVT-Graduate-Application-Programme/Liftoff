import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <h1 className={cn("text-primary font-extrabold text-3xl", className)}>
      DVT
    </h1>
  );
}
