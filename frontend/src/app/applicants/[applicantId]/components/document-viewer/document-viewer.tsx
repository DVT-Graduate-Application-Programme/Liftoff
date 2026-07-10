"use client";

import dynamic from "next/dynamic";
import { FileX2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PdfViewer = dynamic(
  () => import("./pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full min-h-64 w-full" />,
  },
);

export function DocumentViewer({
  url,
  label,
  className,
}: {
  /** Document URL as returned by the API (blob storage today, or fake blob-storage host in mock data). */
  url: string | null;
  /** Human-readable name shown in empty/error states, e.g. "CV" or "Transcript". */
  label: string;
  className?: string;
}) {
  if (!url) {
    return (
      <Card className={cn("h-full items-center justify-center", className)}>
        <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <FileX2 className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No {label} on file</p>
        </CardContent>
      </Card>
    );
  }

  return <PdfViewer url={url} label={label} className={className} />;
}
