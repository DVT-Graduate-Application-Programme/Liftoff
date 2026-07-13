"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pdfjs } from "react-pdf";
import type {
  DocumentCallback,
  PageCallback,
} from "react-pdf/dist/shared/types.js";

// Configured once when app loads
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MIN_SCALE = 1;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;
const DEFAULT_SCALE = 1;
const CONTAINER_PADDING = 16; // matches p-4 (8px) on both sides

export type PdfLoadStatus = "loading" | "ready" | "error";

export function usePdfDocuments() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  const [status, setStatus] = useState<PdfLoadStatus>("loading");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(DEFAULT_SCALE);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(Math.max(0, width - CONTAINER_PADDING));
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  const onDocumentLoadSuccess = useCallback((pdf: DocumentCallback) => {
    setStatus("ready");
    setNumPages(pdf.numPages);
    setPageNumber(1);
    setScale(DEFAULT_SCALE);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setStatus("error");
  }, []);

  const onPageLoadSuccess = useCallback((page: PageCallback) => {
    setPageWidth(page.originalWidth);
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

 
  const fitScale = containerWidth > 0 && pageWidth > 0 ? containerWidth / pageWidth : 1;
  const renderScale = fitScale * scale;

  return useMemo(
    () => ({
      containerRef,
      status,
      numPages,
      pageNumber,
      scale,
      renderScale,
      onDocumentLoadSuccess,
      onDocumentLoadError,
      onPageLoadSuccess,
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
      renderScale,
      onDocumentLoadSuccess,
      onDocumentLoadError,
      onPageLoadSuccess,
      goToPrevPage,
      goToNextPage,
      zoomIn,
      zoomOut,
      resetZoom,
    ],
  );
}
