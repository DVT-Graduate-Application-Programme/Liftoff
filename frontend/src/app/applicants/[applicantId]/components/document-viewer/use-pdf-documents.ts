"use client";

import { useCallback, useMemo, useState } from "react";
import { pdfjs } from "react-pdf";
import type { DocumentCallback } from "react-pdf/dist/shared/types.js";

// Configured once when app loads
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MIN_SCALE = 1;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;
const DEFAULT_SCALE = 1;

export type PdfLoadStatus = "loading" | "ready" | "error";

export function usePdfDocuments() {
  const [status, setStatus] = useState<PdfLoadStatus>("loading");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(DEFAULT_SCALE);

  const onDocumentLoadSuccess = useCallback((pdf: DocumentCallback) => {
    setStatus("ready");
    setNumPages(pdf.numPages);
    setPageNumber(1);
    setScale(DEFAULT_SCALE);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setStatus("error");
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber((page) => Math.max(1, page - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((page) => Math.min(numPages, page + 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, Number((s + SCALE_STEP).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, Number((s - SCALE_STEP).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(DEFAULT_SCALE);
  }, []);

  return useMemo(
    () => ({
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
      resetZoom,
      canGoPrev: pageNumber > 1,
      canGoNext: pageNumber < numPages,
      canZoomIn: scale < MAX_SCALE,
      canZoomOut: scale > MIN_SCALE,
    }),
    [
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
      resetZoom,
    ],
  );
}
