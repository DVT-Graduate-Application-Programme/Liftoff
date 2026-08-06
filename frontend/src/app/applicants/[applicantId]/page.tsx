"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useApplicationDetail } from "@/hooks/use-application-detail";
import { useApplicant } from "@/hooks/use-applicant";
import { useEvaluation } from "@/hooks/use-evaluation";
import { DocumentViewer } from "./components/document-viewer/document-viewer";
import { EvaluationSummary } from "./components/evaluation-summary/evaluation-summary";
import { CandidateReview } from "./components/candidate-review/candidate-review";
import { ApplicationLogs } from "./components/activity-log/activity-log";

export default function DetailedApplicantInfo() {
  const params = useParams<{ applicantId: string }>();
  const applicantId = params.applicantId;

  const detailQuery = useApplicationDetail(applicantId);
  const applicantQuery = useApplicant(applicantId);
  const evaluationQuery = useEvaluation(applicantId);

  // Record of whether the applicant has been evaluated before
  const [lastEvaluationData, setLastEvaluationData] = useState(evaluationQuery.data);
  const [hasHadEvaluation, setHasHadEvaluation] = useState(!!evaluationQuery.data);
  if (evaluationQuery.data !== lastEvaluationData) {
    setLastEvaluationData(evaluationQuery.data);
    if (evaluationQuery.data) {
      setHasHadEvaluation(true);
    }
  }

  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => { window.removeEventListener("resize", checkMobile); };
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      if (percentage >= 25 && percentage <= 75) {
        setLeftWidth(percentage);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  if (detailQuery.isError) {
    const error = detailQuery.error;
    if (error instanceof ApiError && error.status === 404) {
      return (
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg">
            <EmptyState
              title="Applicant not found"
              description="This application may have been removed."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/history">Back to history</Link>
                </Button>
              }
            />
          </div>
        </main>
      );
    }

    return (
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <ErrorState message="Couldn't load this applicant." onRetry={() => { void detailQuery.refetch(); }} />
        </div>
      </main>
    );
  }

  const candidateName = detailQuery.isLoading || applicantQuery.isLoading ? undefined : applicantQuery.data?.candidateName;

  const documentViewerCard = (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FileText className="size-4" />
          Applicant Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 gap-3">
        <Tabs defaultValue="cv" className="flex-1 flex flex-col min-h-0 gap-3">
          <TabsList className="self-start">
            <TabsTrigger
              value="cv"
              className="rounded-t-md px-1.5 py-2 text-xs font-semibold text-muted-foreground data-active:border-b-2 data-active:border-primary data-active:text-foreground"
            >
              CV
            </TabsTrigger>
            <TabsTrigger
              value="transcript"
              className="rounded-t-md px-1.5 py-2 text-xs font-semibold text-muted-foreground data-active:border-b-2 data-active:border-primary data-active:text-foreground"
            >
              Transcript
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cv" className="flex-1 min-h-0 mt-0">
            <DocumentViewer
              url={`/api/applications/${applicantId}/cv`}
              label="CV"
              className="h-full min-h-64"
            />
          </TabsContent>
          <TabsContent value="transcript" className="flex-1 min-h-0 mt-0">
            <DocumentViewer
              url={`/api/applications/${applicantId}/transcript`}
              label="Transcript"
              className="h-full min-h-64"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const aiSummaryBlock = evaluationQuery.isLoading ? (
    <Card>
      <CardContent className="flex flex-col gap-2 py-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  ) : evaluationQuery.isError ? (
    <ErrorState message="Couldn't load evaluation." onRetry={() => { void evaluationQuery.refetch(); }} />
  ) : !evaluationQuery.data ? (
    detailQuery.data?.currentStatus === "PROCESSING" && hasHadEvaluation ? (
      <EmptyState
        className="flex-1"
        title="Re-evaluating applicant"
        description="The Hiring Agent is re-evaluating this candidate. This may take a moment."
      />
    ) : (
      <EmptyState
        className="flex-1"
        title="Not yet evaluated"
        description="This candidate has not been evaluated by the Hiring Agent yet."
      />
    )
  ) : (
    <EvaluationSummary evaluation={evaluationQuery.data} applicationId={applicantId} />
  );

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {detailQuery.isLoading || applicantQuery.isLoading ? (
        <Skeleton className="h-9 w-64" />
      ) : (
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">{candidateName ?? "Applicant"}</h1>
      )}
      {evaluationQuery.data?.institutionJson && (
        <p className="text-center text-sm text-muted-foreground">
          {evaluationQuery.data.institutionJson.degreeName} · {evaluationQuery.data.institutionJson.name}
        </p>
      )}
      {isMobile ? (
        <div className="w-full max-w-[1400px] flex flex-col gap-4 pt-10">
          <Tabs defaultValue="documents" className="w-full flex flex-col gap-3">
            <TabsList className="flex w-full justify-between gap-1">
              <TabsTrigger
                value="documents"
                className="min-w-0 flex-1 truncate rounded-t-md px-1.5 py-2 text-xs font-semibold text-muted-foreground data-active:border-b-2 data-active:border-primary data-active:text-foreground"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="summary"
                className="min-w-0 flex-1 truncate rounded-t-md px-1.5 py-2 text-xs font-semibold text-muted-foreground data-active:border-b-2 data-active:border-primary data-active:text-foreground"
              >
                AI Summary
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="min-w-0 flex-1 truncate rounded-t-md px-1.5 py-2 text-xs font-semibold text-muted-foreground data-active:border-b-2 data-active:border-primary data-active:text-foreground"
              >
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="documents" className="mt-0">
              {documentViewerCard}
            </TabsContent>
            <TabsContent value="summary" className="mt-0">
              {aiSummaryBlock}
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              {applicantId && <ApplicationLogs applicationId={applicantId} />}
            </TabsContent>
          </Tabs>
          <CandidateReview applicationId={applicantId} currentStatus={detailQuery.data?.currentStatus} isMobile />
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className={cn(
              "w-full max-w-[1400px] flex flex-row items-stretch justify-center pt-10 h-[calc(100vh_-_10rem)] min-h-0",
              isResizing && "select-none cursor-col-resize"
            )}
          >
            {/* Document Viewer Container */}
            <section
              style={{ width: `${String(leftWidth)}%` }}
              className="flex h-full flex-col pr-4 min-h-0"
            >
              {documentViewerCard}
            </section>

            {/* Resize Handle */}
            <div
              onMouseDown={() => { setIsResizing(true); }}
              className={cn(
                "flex w-2 cursor-col-resize hover:bg-primary/20 items-center justify-center transition-colors rounded mx-1",
                isResizing && "bg-primary/20"
              )}
            >
              <div className="w-[2px] h-10 rounded bg-muted-foreground/30" />
            </div>

            {/*Candidate INFO Container*/}
            <div
              style={{ width: `${String(100 - leftWidth)}%` }}
              className="flex flex-col gap-4 pl-4 h-full min-h-0"
            >
              {/* Candidate Summary Section */}
              <section className="flex flex-col gap-4 flex-1 h-0 min-h-0">
                {aiSummaryBlock}
              </section>
            </div>
          </div>

          {/* Under the split: Candidate Review, then Applicant Logs */}
          <div className="w-full mt-6 max-w-[1400px] flex flex-col gap-6">
            <CandidateReview applicationId={applicantId} currentStatus={detailQuery.data?.currentStatus} />
            {applicantId && <ApplicationLogs applicationId={applicantId} />}
          </div>
        </>
      )}
    </div>
  );
}
