"use client";

import * as React from "react";
import Link from "next/link";
import { useInfiniteLogs, type RecruiterActionLog } from "@/hooks/use-recruiter-logs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadMoreButton } from "@/components/load-more-button";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";

export default function LogsPage() {
  const { search } = useApplicantSearch();
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteLogs();
  const logs = React.useMemo(
    () => (data?.pages ?? []).flatMap((page: { logs: RecruiterActionLog[] }) => page.logs),
    [data?.pages],
  );
  const filteredLogs = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) => log.recruiterIdentity.toLowerCase().includes(query));
  }, [logs, search]);

  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="mx-auto flex w-fit max-w-full flex-col gap-6">
          <div className="w-full shrink-0">
            <h1 className="text-2xl font-bold text-foreground">Recruiter Logs</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              History of all recruiter actions across the system.
            </p>
          </div>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load logs"
            message={error instanceof Error ? error.message : "An unknown error occurred"}
            onRetry={() => { void refetch(); }}
          />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="size-5" />}
            title="No logs found"
            description={
              search.trim()
                ? `No recruiter actions match "${search}".`
                : "There are currently no recruiter actions recorded."
            }
          />
        ) : (
          <div className="w-fit max-w-full rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-max table-auto text-sm text-left">
                <thead className="sticky top-0 z-10 bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-3 py-3 font-medium sm:px-6 sm:py-4">Date</th>
                  <th className="px-3 py-3 font-medium sm:px-6 sm:py-4">Recruiter</th>
                  <th className="px-3 py-3 font-medium sm:px-6 sm:py-4">Action</th>
                  <th className="px-3 py-3 font-medium sm:px-6 sm:py-4">Status Change</th>
                  <th className="px-3 py-3 font-medium sm:px-6 sm:py-4">Details</th>
                  <th className="w-px px-3 py-3 font-medium text-right sm:px-6 sm:py-4">Link</th>
                </tr>
                </thead>
                <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground sm:px-6 sm:py-4">
                      {new Date(log.actionedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                    </td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap sm:px-6 sm:py-4">
                      {log.recruiterIdentity}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap sm:px-6 sm:py-4">
                      <Badge variant="outline" className="capitalize">
                        {log.actionType.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap sm:px-6 sm:py-4">
                      {(log.previousStatus || log.newStatus) ? (
                        <div className="flex items-center gap-2">
                          {log.previousStatus && (
                            <span className="text-muted-foreground text-xs">{log.previousStatus}</span>
                          )}
                          {log.previousStatus && log.newStatus && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          {log.newStatus && (
                            <span className="font-medium text-xs">{log.newStatus}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="max-w-[12rem] px-3 py-3 truncate text-muted-foreground sm:max-w-xs sm:px-6 sm:py-4">
                      {log.actionType === 'RATE' ? (
                        <span>Rated: {log.ratingValue}/5 {log.reason ? `- ${log.reason}` : ''}</span>
                      ) : log.reason ? (
                        <span title={log.reason}>{log.reason}</span>
                      ) : (
                        <span className="italic">None</span>
                      )}
                    </td>
                    <td className="w-px px-3 py-3 whitespace-nowrap text-right sm:px-6 sm:py-4">
                      <Button asChild variant="ghost" size="sm" className="gap-1">
                        <Link href={`/applicants/${log.applicationRecordId}?from=logs`}>
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {hasNextPage && (
          <div className="flex justify-center">
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onClick={() => {
                void fetchNextPage();
              }}
            />
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
