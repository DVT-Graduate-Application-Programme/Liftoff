"use client";

import * as React from "react";
import Link from "next/link";
import { useInfiniteLogs, type RecruiterActionLog } from "@/hooks/use-recruiter-logs";
import { useRecruiters } from "@/hooks/use-recruiters";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadMoreButton } from "@/components/load-more-button";
import { useApplicantSearch } from "@/components/providers/applicant-search-provider";
import {
  FilterBarShell,
  FilterField,
  FilterSelect,
  type ActiveFilter,
} from "@/app/landing/components/filter-bar";

const ALL_VALUE = "All";

function LogsFilterBar({
  filtersOpen,
  onToggleFilters,
  actionType,
  onActionTypeChange,
  actionTypeOptions,
  recruiter,
  onRecruiterChange,
  recruiterOptions,
  dateRange,
  onDateRangeChange,
  activeFilters,
  onClearAll,
}: {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  actionType: string;
  onActionTypeChange: (value: string) => void;
  actionTypeOptions: [string, string][];
  recruiter: string;
  onRecruiterChange: (value: string) => void;
  recruiterOptions: [string, string][];
  dateRange: { start: string; end: string };
  onDateRangeChange: (value: { start: string; end: string }) => void;
  activeFilters: ActiveFilter[];
  onClearAll: () => void;
}) {
  return (
    <FilterBarShell
      id="logs-filters"
      filtersOpen={filtersOpen}
      onToggleFilters={onToggleFilters}
      gridClassName="sm:grid-cols-2 lg:grid-cols-4"
      activeFilters={activeFilters}
      onClearAll={onClearAll}
    >
      <FilterField label="Action">
        <FilterSelect value={actionType} onChange={onActionTypeChange} options={actionTypeOptions} />
      </FilterField>
      <FilterField label="Recruiter">
        <FilterSelect value={recruiter} onChange={onRecruiterChange} options={recruiterOptions} />
      </FilterField>
      <FilterField label="From">
        <input
          aria-label="From"
          type="date"
          value={dateRange.start}
          onChange={(event) => {
            onDateRangeChange({ ...dateRange, start: event.target.value });
          }}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        />
      </FilterField>
      <FilterField label="To">
        <input
          aria-label="To"
          type="date"
          value={dateRange.end}
          onChange={(event) => {
            onDateRangeChange({ ...dateRange, end: event.target.value });
          }}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        />
      </FilterField>
    </FilterBarShell>
  );
}

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
  const { data: recruiters } = useRecruiters();

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filterActionType, setFilterActionType] = React.useState(ALL_VALUE);
  const [filterRecruiter, setFilterRecruiter] = React.useState(ALL_VALUE);
  const [filterDateRange, setFilterDateRange] = React.useState({ start: "", end: "" });

  const clearFilters = () => {
    setFilterActionType(ALL_VALUE);
    setFilterRecruiter(ALL_VALUE);
    setFilterDateRange({ start: "", end: "" });
  };

  const logs = React.useMemo(
    () => (data?.pages ?? []).flatMap((page: { logs: RecruiterActionLog[] }) => page.logs),
    [data?.pages],
  );

  const actionTypeOptions = React.useMemo<[string, string][]>(() => {
    const distinct = Array.from(new Set(logs.map((log) => log.actionType))).sort();
    return [
      [ALL_VALUE, "All actions"],
      ...distinct.map((value): [string, string] => [value, value.replace(/_/g, " ")]),
    ];
  }, [logs]);

  const recruiterOptions = React.useMemo<[string, string][]>(() => {
    const known = new Set((recruiters ?? []).map((r) => r.email));
    const extra = logs
      .map((log) => log.recruiterIdentity)
      .filter((identity) => !known.has(identity));
    const identities = [
      ...(recruiters ?? []).map((r) => r.email),
      ...Array.from(new Set(extra)),
    ];
    return [
      [ALL_VALUE, "All recruiters"],
      ...identities.map((identity): [string, string] => [identity, identity]),
    ];
  }, [recruiters, logs]);

  const activeFilters: ActiveFilter[] = [
    filterActionType !== ALL_VALUE && {
      label: `Action: ${filterActionType.replace(/_/g, " ")}`,
      onClear: () => { setFilterActionType(ALL_VALUE); },
    },
    filterRecruiter !== ALL_VALUE && {
      label: `Recruiter: ${filterRecruiter}`,
      onClear: () => { setFilterRecruiter(ALL_VALUE); },
    },
    (filterDateRange.start || filterDateRange.end) && {
      label: `Date: ${filterDateRange.start || "Any"} to ${filterDateRange.end || "Any"}`,
      onClear: () => { setFilterDateRange({ start: "", end: "" }); },
    },
  ].filter(Boolean) as ActiveFilter[];

  const filteredLogs = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const start = filterDateRange.start ? new Date(filterDateRange.start) : null;
    const end = filterDateRange.end ? new Date(filterDateRange.end) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return logs.filter((log) => {
      if (query) {
        const actionLabel = log.actionType.replace(/_/g, " ").toLowerCase();
        const matchesQuery =
          log.recruiterIdentity.toLowerCase().includes(query) ||
          actionLabel.includes(query);
        if (!matchesQuery) return false;
      }
      if (filterActionType !== ALL_VALUE && log.actionType !== filterActionType) return false;
      if (filterRecruiter !== ALL_VALUE && log.recruiterIdentity !== filterRecruiter) return false;
      const actionedAt = new Date(log.actionedAt);
      if (start && actionedAt < start) return false;
      if (end && actionedAt > end) return false;
      return true;
    });
  }, [logs, search, filterActionType, filterRecruiter, filterDateRange]);

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

          <LogsFilterBar
            filtersOpen={filtersOpen}
            onToggleFilters={() => { setFiltersOpen((open) => !open); }}
            actionType={filterActionType}
            onActionTypeChange={setFilterActionType}
            actionTypeOptions={actionTypeOptions}
            recruiter={filterRecruiter}
            onRecruiterChange={setFilterRecruiter}
            recruiterOptions={recruiterOptions}
            dateRange={filterDateRange}
            onDateRangeChange={setFilterDateRange}
            activeFilters={activeFilters}
            onClearAll={clearFilters}
          />

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
                : activeFilters.length > 0
                  ? "No recruiter actions match the selected filters."
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
