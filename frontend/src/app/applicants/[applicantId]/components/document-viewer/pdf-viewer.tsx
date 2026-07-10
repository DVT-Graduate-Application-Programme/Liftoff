"use client";

import { AlertTriangle } from "lucide-react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { resolveDocumentUrl } from "./resolve-document-url";
import { DocumentViewerToolbar } from "./document-viewer-toolbar";
import { usePdfDocuments } from "./use-pdf-documents";

export function PdfViewer({
  url,
  label,
  className,
}: {
  url: string;
  label: string;  // text in error state( "CV" or "Transcript")
  className?: string;
}) {
  const {
    status,
    numPages,
    pageNumber,
    scale,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    canGoPrev,
    canGoNext,
    canZoomIn,
    canZoomOut,
  } = usePdfDocuments();

  const resolvedUrl = resolveDocumentUrl(url);

  return (
    <Card className={cn("h-full gap-0 overflow-hidden p-0", className)}>
      {status === "ready" && (
        <DocumentViewerToolbar
          pageNumber={pageNumber}
          numPages={numPages}
          scale={scale}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          onPrevPage={goToPrevPage}
          onNextPage={goToNextPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
      )}
      <CardContent
        className={cn(
          "flex flex-1 items-center justify-center overflow-auto p-4",
          status !== "ready" && "min-h-64",
        )}
      >
        {status === "error" ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertTriangle className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Couldn't load {label.toLowerCase()}.
            </p>
          </div>
        ) : (
          <Document
            file={resolvedUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<Skeleton className="h-96 w-full" />}
            error={null}
          >
            <Page pageNumber={pageNumber} scale={scale} />
          </Document>
        )}
      </CardContent>
    </Card>
  );
}
