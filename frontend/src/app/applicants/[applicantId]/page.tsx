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

  //Record of whether applicant has been evaluated before 
  const hasHadEvaluationRef = useRef(false);
  if (evaluationQuery.data) {
    hasHadEvaluationRef.current = true;
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

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {detailQuery.isLoading || applicantQuery.isLoading ? (
        <Skeleton className="h-9 w-64" />
      ) : (
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">{candidateName ?? "Applicant"}</h1>
      )}
      {evaluationQuery.data?.institutionJson && (
        <p className="text-sm text-muted-foreground">
          {evaluationQuery.data.institutionJson.degreeName} · {evaluationQuery.data.institutionJson.name}
        </p>
      )}
      <div
        ref={containerRef}
        className={cn(
          "w-full max-w-[1400px] flex flex-col md:flex-row items-stretch justify-center pt-10 md:h-[calc(100vh_-_10rem)] md:min-h-0",
          isResizing && "select-none cursor-col-resize"
        )}
      >
        {/* Document Viewer Container */}
        <section
          style={isMobile ? undefined : { width: `${String(leftWidth)}%` }}
          className="flex w-full md:h-full flex-col md:pr-4 min-h-0"
        >
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
                  <TabsTrigger value="cv">CV</TabsTrigger>
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
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
        </section>

        {/* Resize Handle */}
        <div
          onMouseDown={() => { setIsResizing(true); }}
          className={cn(
            "hidden md:flex w-2 cursor-col-resize hover:bg-primary/20 items-center justify-center transition-colors rounded mx-1",
            isResizing && "bg-primary/20"
          )}
        >
          <div className="w-[2px] h-10 rounded bg-muted-foreground/30" />
        </div>

        {/*Candidate INFO Container*/}
        <div
          style={isMobile ? undefined : { width: `${String(100 - leftWidth)}%` }}
          className="flex w-full flex-col gap-4 md:pl-4 md:h-full md:min-h-0"
        >
          {/* Candidate Summary Section */}
          <section className="flex flex-col gap-4 flex-1 h-0 min-h-0">
            {evaluationQuery.isLoading ? (
              <Card>
                <CardContent className="flex flex-col gap-2 py-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ) : evaluationQuery.isError ? (
              <ErrorState message="Couldn't load evaluation." onRetry={() => { void evaluationQuery.refetch(); }} />
            ) : !evaluationQuery.data ? (
              detailQuery.data?.currentStatus === "PROCESSING" && hasHadEvaluationRef.current ? (
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
            )}
          </section>

          {/* Candidate Rating section*/}
          <CandidateReview applicationId={applicantId} currentStatus={detailQuery.data?.currentStatus} />
        </div>
      </div>

      {/* Under the split: Applicant Logs */}
      {applicantId && (
        <div className="w-full mt-6 max-w-[1400px]">
          <ApplicationLogs applicationId={applicantId} />
        </div>
      )}
    </div>
  );
}
