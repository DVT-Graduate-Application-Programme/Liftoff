import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, History, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";
import { useApplicationLogs } from "@/hooks/use-recruiter-logs";

export function ApplicationLogs({ applicationId }: { applicationId: string }) {
  const { data: logs, isLoading, isError, refetch } = useApplicationLogs(applicationId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const next = el.scrollHeight - el.scrollTop - el.clientHeight > 1;
    setCanScrollDown((prev) => (prev === next ? prev : next));
  }, []);

  useLayoutEffect(() => {
    updateScrollState();
  }, [updateScrollState, logs]);

  useEffect(() => {
    window.addEventListener("resize", updateScrollState);
    return () => { window.removeEventListener("resize", updateScrollState); };
  }, [updateScrollState]);

  if (isLoading) {
    return (
      <Card className="w-full shrink-0">
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full shrink-0">
        <CardContent className="py-6">
          <ErrorState message="Could not load activity logs." onRetry={() => void refetch()} />
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="w-full shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="size-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-sm text-muted-foreground">
          No activity logs recorded for this applicant yet.
        </CardContent>
      </Card>
    );
  }

  const getActionBadge = (actionType: string) => {
    switch (actionType.toUpperCase()) {
      case "ACCEPT":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Accepted</Badge>;
      case "REJECT":
        return <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
      case "SHORTLIST":
        return <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30">Shortlisted</Badge>;
      case "CLAIM":
        return <Badge variant="secondary">Claimed</Badge>;
      case "RATING":
        return <Badge variant="outline" className="border-primary text-primary">Rated</Badge>;
      case "NOTES":
        return <Badge variant="outline" className="text-muted-foreground">Notes Added</Badge>;
      default:
        return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  return (
    <Card className="w-full h-full flex flex-col min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="size-5" />
          Activity History
        </CardTitle>
      </CardHeader>
      <div className="relative flex-1 min-h-0">
        <CardContent
          ref={scrollRef}
          onScroll={updateScrollState}
          className="h-full overflow-y-auto scrollbar-thin [scrollbar-color:var(--muted-foreground)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
        >
          <div className="relative border-l border-muted pl-6 ml-2 flex flex-col gap-6">
            {logs.map((log) => (
              <div key={log.id} className="relative">
                {/* Timeline marker */}
                <div className="absolute -left-[31px] mt-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />

                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {log.recruiterIdentity}
                    </span>
                    {getActionBadge(log.actionType)}
                    {log.ratingValue !== null && (
                      <div className="flex items-center gap-0.5 text-xs text-primary">
                        <Star className="size-3.5 fill-primary text-primary" />
                        <span className="font-semibold">{log.ratingValue.toFixed(1)}</span>
                      </div>
                    )}
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(log.actionedAt).toLocaleString()}
                    </span>
                  </div>

                  {log.reason && (
                    <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-muted/50 mt-1 max-w-full break-words">
                      {log.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        {canScrollDown && (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center",
              "bg-linear-to-t from-card to-transparent pt-10 pb-2",
            )}
          >
            <div className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm">
              Scroll for more
              <ChevronDown className="size-3.5 animate-bounce" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
