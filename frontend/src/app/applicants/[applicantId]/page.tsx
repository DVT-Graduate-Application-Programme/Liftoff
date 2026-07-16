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
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useApplicationDetail } from "@/hooks/use-application-detail";
import { useApplicant } from "@/hooks/use-applicant";
import { useEvaluation } from "@/hooks/use-evaluation";
import { useOwnership } from "@/hooks/use-ownership";
import { useRateApplication } from "@/hooks/use-rate-application";
import { useShortlistApplication } from "@/hooks/use-shortlist-application";
import { useAcceptApplication } from "@/hooks/use-accept-application";
import { useRejectApplication } from "@/hooks/use-reject-application";
import { useReevaluateApplication } from "@/hooks/use-reevaluate-application";
import type { Evaluation, EvaluationCategoryScores, EvaluationScore } from "@/types/api";
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
    <Card>
      <CardHeader>
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
      
      <CardContent className="flex flex-col gap-5">
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
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => { onChange(star); }}
          aria-label={`Rate ${String(star)} star${star > 1 ? "s" : ""}`}
          className="disabled:opacity-50"
        >
          <Star
            className={cn(
              "size-6 text-muted-foreground transition-colors",
              star <= value && "fill-primary text-primary",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function CandidateReview({ applicationId }: { applicationId: string }) {
  const ownershipQuery = useOwnership(applicationId);
  const rateMutation = useRateApplication(applicationId);
  const shortlistMutation = useShortlistApplication(applicationId);
  const acceptMutation = useAcceptApplication(applicationId);
  const rejectMutation = useRejectApplication(applicationId);

  const [ratingOverride, setRatingOverride] = useState<number | null>(null);
  const [notesOverride, setNotesOverride] = useState<string | null>(null);

  const rating = ratingOverride ?? ownershipQuery.data?.recruiterRating ?? 0;
  const notes = notesOverride ?? ownershipQuery.data?.recruiterRatingNote ?? "";
  const shortlistedAt = ownershipQuery.data?.shortlistedAt;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Review</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Rating</Label>
          <StarRatingInput value={rating} onChange={setRatingOverride} disabled={ownershipQuery.isLoading} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes..."
            value={notes}
            onChange={(e) => { setNotesOverride(e.target.value); }}
            disabled={ownershipQuery.isLoading}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={shortlistMutation.isPending || !!shortlistedAt}
              onClick={() => { shortlistMutation.mutate(undefined); }}
            >
              {shortlistedAt ? "Shortlisted" : shortlistMutation.isPending ? "Shortlisting..." : "Shortlist"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={acceptMutation.isPending}
              onClick={() => { acceptMutation.mutate(undefined); }}
            >
              {acceptMutation.isPending ? "Accepting..." : "Accept"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={rejectMutation.isPending}
              onClick={() => { rejectMutation.mutate(undefined); }}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </div>

          <Button
            disabled={rating === 0 || rateMutation.isPending}
            onClick={() => { rateMutation.mutate({ rating, notes: notes.length > 0 ? notes : undefined }); }}
          >
            {rateMutation.isPending ? "Submitting..." : "Submit Rating"}
          </Button>
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
      onSuccess: () => setOpen(false)
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
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
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={reevaluate.isPending}>
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
    return () => window.removeEventListener("resize", checkMobile);
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
          "w-full flex flex-col md:flex-row items-stretch justify-center pt-10",
          isResizing && "select-none cursor-col-resize"
        )}
      >
        {/* Document Viewer Container */}
        <section 
          style={isMobile ? undefined : { width: `${leftWidth}%` }}
          className="flex w-full md:h-[calc(100vh_-_10rem)] flex-col md:pr-4"
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
          onMouseDown={() => setIsResizing(true)}
          className={cn(
            "hidden md:flex w-2 cursor-col-resize hover:bg-primary/20 items-center justify-center transition-colors rounded mx-1",
            isResizing && "bg-primary/20"
          )}
        >
          <div className="w-[2px] h-10 rounded bg-muted-foreground/30" />
        </div>

        {/*Candidate INFO Container*/}
        <div 
          style={isMobile ? undefined : { width: `${100 - leftWidth}%` }}
          className="flex w-full flex-col gap-4 md:pl-4 overflow-y-auto md:h-[calc(100vh_-_10rem)]"
        >
          {/* Candidate Summary Section */}
          <section className="flex flex-col gap-4">
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
          <CandidateReview applicationId={applicantId} />
        </div>
      </div>
    </div>
  );
}
