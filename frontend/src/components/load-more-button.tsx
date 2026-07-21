"use client";

import { Button } from "@/components/ui/button";

interface LoadMoreButtonProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onClick: () => void;
  className?: string;
}

export function LoadMoreButton({
  hasNextPage,
  isFetchingNextPage,
  onClick,
  className,
}: LoadMoreButtonProps) {
  if (!hasNextPage) return null;

  return (
    <Button
      variant="outline"
      className={className ?? "self-center"}
      disabled={isFetchingNextPage}
      onClick={onClick}
    >
      {isFetchingNextPage ? "Loading..." : "Load more"}
    </Button>
  );
}
