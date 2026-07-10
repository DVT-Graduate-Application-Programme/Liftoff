"use client";

import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentViewerToolbar({
  pageNumber,
  numPages,
  scale,
  canGoPrev,
  canGoNext,
  canZoomIn,
  canZoomOut,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
}: {
  pageNumber: number;
  numPages: number;
  scale: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b px-2 py-1.5">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous page"
          disabled={!canGoPrev}
          onClick={onPrevPage}
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-16 text-center text-xs text-muted-foreground">
          Page {pageNumber} / {numPages}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next page"
          disabled={!canGoNext}
          onClick={onNextPage}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out"
          disabled={!canZoomOut}
          onClick={onZoomOut}
        >
          <ZoomOut />
        </Button>
        <span className="min-w-10 text-center text-xs text-muted-foreground">
          {Math.round(scale * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom in"
          disabled={!canZoomIn}
          onClick={onZoomIn}
        >
          <ZoomIn />
        </Button>
      </div>
    </div>
  );
}
