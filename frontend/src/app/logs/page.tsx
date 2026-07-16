"use client";

import * as React from "react";
import Link from "next/link";
import { useRecruiterLogs } from "@/hooks/use-recruiter-logs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LogsPage() {
  const { data: logs, isLoading, error, refetch } = useRecruiterLogs();

  return (
    <div className="flex w-full flex-col gap-6 p-6 md:p-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Recruiter Logs</h1>
            <p className="text-sm text-muted-foreground">
              History of all recruiter actions across the system.
            </p>
          </div>
        </div>
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
          description={error instanceof Error ? error.message : "An unknown error occurred"}
          action={{ label: "Try again", onClick: () => refetch() }}
        />
      ) : !logs || logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No logs found"
          description="There are currently no recruiter actions recorded."
        />
      ) : (
        <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Recruiter</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Status Change</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                  <th className="px-6 py-4 font-medium text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {new Date(log.actionedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      {log.recruiterIdentity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="capitalize">
                        {log.actionType.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 max-w-xs truncate text-muted-foreground">
                      {log.actionType === 'RATE' ? (
                        <span>Rated: {log.ratingValue}/5 {log.reason ? `- ${log.reason}` : ''}</span>
                      ) : log.reason ? (
                        <span title={log.reason}>{log.reason}</span>
                      ) : (
                        <span className="italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button asChild variant="ghost" size="sm" className="gap-1">
                        <Link href={`/applicants/${log.applicationRecordId}`}>
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
    </div>
  );
}
