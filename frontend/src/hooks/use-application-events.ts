"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { ApplicationSseEvent } from "@/app/api/internal/notify/route";

/**
 * Subscribes to the SSE event stream and invalidates the relevant TanStack
 * Query cache entries whenever the backend signals a data change.
 *
 * Mount this once — high up in the tree (e.g. inside QueryProvider or a
 * layout that wraps authenticated pages). It self-cleans on unmount.
 *
 * Invalidation strategy:
 *   application-ingested  → list + infinite list (new row appeared)
 *   evaluation-saved      → detail + evaluation for that application
 *   evaluation-reset      → detail + evaluation for that application
 *   ownership-changed     → ownership, detail, logs for that application
 */
export function useApplicationEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource("/api/events");

    source.onmessage = (e: MessageEvent<string>) => {
      const payload = JSON.parse(e.data) as ApplicationSseEvent;
      const { event, applicationId } = payload;

      switch (event) {
        case "application-ingested":
          // A new application arrived — invalidate every variant of the list.
          queryClient.invalidateQueries({ queryKey: ["applications"] });
          break;

        case "evaluation-saved":
        case "evaluation-reset":
          // Evaluation data changed — refresh the detail panel and the eval card.
          queryClient.invalidateQueries({
            queryKey: queryKeys.applicationDetail(applicationId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.evaluation(applicationId),
          });
          // Also bump the list so status/tier/score columns update.
          queryClient.invalidateQueries({ queryKey: ["applications"] });
          break;

        case "ownership-changed":
          // A recruiter acted — refresh ownership, detail, and the action log.
          queryClient.invalidateQueries({
            queryKey: queryKeys.ownership(applicationId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.applicationDetail(applicationId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.applicationLogs(applicationId),
          });
          // Refresh list so claimed/shortlisted columns stay in sync.
          queryClient.invalidateQueries({ queryKey: ["applications"] });
          break;
      }
    };

    source.onerror = () => {
      // EventSource reconnects automatically after ~3 s — no action needed.
    };

    return () => {
      source.close();
    };
  }, [queryClient]);
}
