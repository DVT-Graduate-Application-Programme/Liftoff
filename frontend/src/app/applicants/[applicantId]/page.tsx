"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  Code2,
  GitBranch,
  GraduationCap,
  MinusCircle,
  Rocket,
  Sparkles,
  Star,
  RefreshCw,
  FileText,
  History,
  X,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useApplicationDetail } from "@/hooks/use-application-detail";
import { useApplicant } from "@/hooks/use-applicant";
import { useEvaluation } from "@/hooks/use-evaluation";
import { useOwnership } from "@/hooks/use-ownership";
import { useRateApplication } from "@/hooks/use-rate-application";
import { ACTIVE_RECRUITER_ID, useClaimApplication } from "@/hooks/use-claim-application";
import { useShortlistApplication } from "@/hooks/use-shortlist-application";
import { useRejectApplication } from "@/hooks/use-reject-application";
import { useReevaluateApplication } from "@/hooks/use-reevaluate-application";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/query-keys";
import { useApplicationLogs } from "@/hooks/use-recruiter-logs";
import type { Evaluation, EvaluationCategoryScores, EvaluationScore, Ownership } from "@/types/api";
import { SCORE_CATEGORIES } from "@/app/landing/components/applicant-details/constants";
import { DocumentViewer } from "./components/document-viewer/document-viewer";

const scoreCategoryMeta: Record<keyof EvaluationCategoryScores, { icon: typeof GitBranch }> = {
  education: { icon: GraduationCap },
  open_source: { icon: GitBranch },
  self_projects: { icon: Rocket },
  production: { icon: Building2 },
  technical_skills: { icon: Code2 },
};

function ScoreCategoryRow({
  label,
  icon: Icon,
  category,
}: {
  label: string;
  icon: typeof GitBranch;
  category: EvaluationScore;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </span>
        <span className="text-sm font-semibold">
          {category.score.toFixed(1)}
          <span className="text-muted-foreground"> / {category.max}</span>
        </span>
      </div>
      <Progress value={(category.score / category.max) * 100} />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {category.evidence}
      </p>
    </div>
  );
}

function EvaluationSummary({ evaluation, applicationId }: { evaluation: Evaluation; applicationId: string }) {
  const categoryScores = evaluation.categoryScoresJson;
  const bonusTotal = evaluation.bonusPointsJson?.total ?? 0;
  const keyStrengths = evaluation.keyStrengthsJson ?? [];
  const areasForImprovement = evaluation.areasForImprovementJson ?? [];

  const totalScore = SCORE_CATEGORIES.reduce(
    (sum, { key }) => sum + categoryScores[key].score,
    0,
  );
  const maxScore = SCORE_CATEGORIES.reduce(
    (sum, { key }) => sum + categoryScores[key].max,
    0,
  );
  const overallScore = Math.max(0, totalScore + bonusTotal);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4" />
          AI Summary
          <div className="ml-2">
            <ReevaluateButton applicantId={applicationId} />
          </div>
        </CardTitle>
        <CardAction className="flex flex-col items-end gap-1">
          Overall Score
          <span className="text-base font-semibold text-foreground">
            {overallScore.toFixed(1)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              / {maxScore}
            </span>
          </span>
        </CardAction>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto flex flex-col gap-5 pr-3">
        {evaluation.aiSummary && (
          <>
            <p className="text-sm leading-relaxed text-foreground">{evaluation.aiSummary}</p>
            <Separator />
          </>
        )}

        <div className="flex flex-col gap-4">
          {SCORE_CATEGORIES.map(({ key, label }) => (
            <ScoreCategoryRow
              key={key}
              label={label}
              icon={scoreCategoryMeta[key].icon}
              category={categoryScores[key]}
            />
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Award className="size-4 text-muted-foreground" />
            Bonus Points
            <Badge variant="secondary" className="ml-auto">
              +{bonusTotal.toFixed(1)}
            </Badge>
          </span>
          {evaluation.bonusPointsJson?.breakdown && (
            <p className="pl-6 text-xs text-muted-foreground">
              {evaluation.bonusPointsJson.breakdown}
            </p>
          )}
        </div>

        {evaluation.deductionsJson?.promptInjectionDetected && (
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <MinusCircle className="size-4 text-muted-foreground" />
              Prompt Injection Detected
            </span>
            <p className="pl-6 text-xs text-muted-foreground">
              {evaluation.deductionsJson.promptInjectionEvidence}
            </p>
          </div>
        )}

        <Separator />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Key Strengths</span>
          <ul className="flex flex-col gap-2">
            {keyStrengths.map((strength) => (
              <li key={strength} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Areas for Improvement</span>
          <ul className="flex flex-col gap-2">
            {areasForImprovement.map((area) => (
              <li key={area} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4 shrink-0 text-muted-foreground" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isHighlighted = hoveredValue !== null ? star <= hoveredValue : star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => { onChange(star); }}
            onMouseEnter={() => { if (!disabled) setHoveredValue(star); }}
            onMouseLeave={() => { if (!disabled) setHoveredValue(null); }}
            aria-label={`Rate ${String(star)} star${star > 1 ? "s" : ""}`}
            className="disabled:opacity-50 transition-transform duration-100 hover:scale-110 focus:outline-none"
          >
            <Star
              className={cn(
                "size-6 text-muted-foreground transition-colors",
                isHighlighted && "fill-primary text-primary",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

interface RateResponse {
  recruiterRating: number | null;
  recruiterRatingNote: string | null;
  ratedByRecruiterId: string | null;
  ratedAt: string | null;
}

function CandidateReview({ applicationId, currentStatus }: { applicationId: string; currentStatus?: string }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const ownershipQuery = useOwnership(applicationId);
  const rateMutation = useRateApplication(applicationId);
  const shortlistMutation = useShortlistApplication(applicationId);
  const rejectMutation = useRejectApplication(applicationId);

  const [ratingOverride, setRatingOverride] = useState<number | null>(null);
  const [notesOverride, setNotesOverride] = useState<string | null>(null);

  const rating = ratingOverride ?? ownershipQuery.data?.recruiterRating ?? 0;
  const notes = notesOverride ?? ownershipQuery.data?.recruiterRatingNote ?? "";
  const statusUpper = currentStatus?.toUpperCase() ?? "";
  const isShortlisted = Boolean(ownershipQuery.data?.shortlistedAt) || /SHORTLIST|ACCEPT|HIRE/.test(statusUpper);
  const isRejected = /REJECT/.test(statusUpper);
  const recruiterIdentity = session?.user?.email ?? ACTIVE_RECRUITER_ID;
  const isAssignedToCurrentRecruiter =
    ownershipQuery.data?.claimedByRecruiterId === recruiterIdentity ||
    ownershipQuery.data?.shortlistedByRecruiterId === recruiterIdentity ||
    ownershipQuery.data?.ratedByRecruiterId === recruiterIdentity;

  // Mutation to save notes only
  const notesMutation = useMutation({
    mutationFn: (notesText: string) =>
      apiFetch<RateResponse>(`/api/applications/${applicationId}/ownership/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<Ownership | undefined>(queryKeys.ownership(applicationId), (prev) =>
        prev ? { ...prev, ...data } : prev,
      );
      setNotesOverride(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLogs(applicationId) });
    },
  });

  const isNotesChanged = notesOverride !== null && notesOverride !== (ownershipQuery.data?.recruiterRatingNote ?? "");

  return (
    <Card className="shrink-0">
      <CardHeader>
        <CardTitle>Candidate Review</CardTitle>
        <p className="text-sm text-muted-foreground">
          Decide, rate, and leave notes for this applicant
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Rating
          </Label>
          <StarRatingInput value={rating} onChange={setRatingOverride} disabled={ownershipQuery.isLoading} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="notes"
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Notes
            </Label>
            {isNotesChanged && (
              <button
                type="button"
                disabled={notesMutation.isPending}
                onClick={() => { notesMutation.mutate(notes); }}
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
              >
                {notesMutation.isPending ? "Saving..." : "Save"}
              </button>
            )}
          </div>
          <Textarea
            id="notes"
            placeholder="Add notes about this candidate..."
            value={notes}
            onChange={(e) => { setNotesOverride(e.target.value); }}
            disabled={ownershipQuery.isLoading}
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Decision
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={shortlistMutation.isPending}
              onClick={() => {
                shortlistMutation.mutate(undefined, {
                  onSuccess: () => {
                    void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLogs(applicationId) });
                  }
                });
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                isShortlisted
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input hover:bg-accent hover:text-white",
              )}
            >
              <Star className={cn("size-4", isShortlisted && "fill-primary")} />
              {shortlistMutation.isPending ? "Shortlisting..." : "Shortlist"}
            </button>
            <button
              type="button"
              disabled={rejectMutation.isPending}
              onClick={() => {
                rejectMutation.mutate(undefined, {
                  onSuccess: () => {
                    void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLogs(applicationId) });
                  }
                });
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                isRejected
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-input hover:bg-destructive hover:text-white",
              )}
            >
              <X className="size-4" />
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </div>

        <Button
          className="h-11 w-full text-base font-medium"
          disabled={rating === 0 || rateMutation.isPending}
          onClick={() => {
            rateMutation.mutate(
              { rating, notes: notes.length > 0 ? notes : undefined },
              {
                onSuccess: () => {
                  setRatingOverride(null);
                  setNotesOverride(null);
                  void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLogs(applicationId) });
                }
              }
            );
          }}
        >
          {rateMutation.isPending ? "Submitting..." : "Submit Rating"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ApplicationLogs({ applicationId }: { applicationId: string }) {
  const { data: logs, isLoading, isError, refetch } = useApplicationLogs(applicationId);

  if (isLoading) {
    return (
      <Card className="w-full mt-6 shrink-0">
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
      <Card className="w-full mt-6 shrink-0">
        <CardContent className="py-6">
          <ErrorState message="Could not load activity logs." onRetry={() => void refetch()} />
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="w-full mt-6 shrink-0">
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
    <Card className="w-full mt-8 shrink-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="size-5" />
          Activity History
        </CardTitle>
      </CardHeader>
      <CardContent>
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
    </Card>
  );
}

function ReevaluateButton({ applicantId }: { applicantId: string }) {
  const [open, setOpen] = useState(false);
  const reevaluate = useReevaluateApplication(applicantId);

  const handleConfirm = () => {
    reevaluate.mutate(undefined, {
      onSuccess: () => { setOpen(false); }
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); }} className="gap-2">
        <RefreshCw className={cn("size-4", reevaluate.isPending && "animate-spin")} />
        Re-evaluate
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold">Confirm Re-evaluation</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to re-evaluate this applicant? This will reset the AI summary and trigger a new analysis based on the latest uploaded documents.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => { setOpen(false); }} disabled={reevaluate.isPending}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={reevaluate.isPending}>
                {reevaluate.isPending ? "Re-evaluating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DetailedApplicantInfo() {
  const params = useParams<{ applicantId: string }>();
  const applicantId = params.applicantId;

  const detailQuery = useApplicationDetail(applicantId);
  const applicantQuery = useApplicant(applicantId);
  const evaluationQuery = useEvaluation(applicantId);

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
              <EmptyState
                title="Not yet evaluated"
                description="This candidate has not been evaluated by the Hiring Agent yet."
              />
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
