import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  ChevronDown,
  Code2,
  GitBranch,
  GraduationCap,
  MinusCircle,
  Rocket,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Evaluation, EvaluationCategoryScores, EvaluationScore } from "@/types/api";
import { SCORE_CATEGORIES } from "@/app/landing/components/applicant-details/constants";
import { ReevaluateButton } from "../reevaluate-button/reevaluate-button";

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

export function EvaluationSummary({ evaluation, applicationId }: { evaluation: Evaluation; applicationId: string }) {
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
  }, [updateScrollState, evaluation]);

  useEffect(() => {
    window.addEventListener("resize", updateScrollState);
    return () => { window.removeEventListener("resize", updateScrollState); };
  }, [updateScrollState]);

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

      <div className="relative flex-1 min-h-0">
        <CardContent
          ref={scrollRef}
          onScroll={updateScrollState}
          className="h-full overflow-y-auto flex flex-col gap-5 pr-3 scrollbar-thin [scrollbar-color:var(--muted-foreground)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
        >
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
