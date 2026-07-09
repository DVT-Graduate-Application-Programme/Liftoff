import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import type { ApplicantDetailsEvaluation } from "./mock-applicant-details";
import { CloseApplicantDetailsSidebarButton } from "./applicant-details-sidebar-controls";
import { SCORE_CATEGORIES } from "./constants";

type ApplicantDetailsSidebarProps = {
  candidateName: string;
  evaluation: ApplicantDetailsEvaluation;
};

function formatDecimal(value: number) {
  return value.toFixed(1);
}

export function ApplicantDetailsSidebar({
  candidateName,
  evaluation,
}: ApplicantDetailsSidebarProps) {
  const scoreTotal = SCORE_CATEGORIES.reduce(
    (total, { key }) => total + evaluation.scores[key].score,
    0,
  );
  const scoreMax = SCORE_CATEGORIES.reduce(
    (total, { key }) => total + evaluation.scores[key].max,
    0,
  );
  const overallScore = Math.max(
    0,
    scoreTotal + evaluation.bonusPoints.total - evaluation.deductions.total,
  );

  return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      className="top-16 h-auto font-sans text-sidebar-foreground"
    >
      <SidebarContent className="py-2">
        <SidebarGroup className="flex h-full min-h-0 flex-1 flex-col p-5">
          <div className="flex flex-1 flex-col justify-start gap-8">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-heading text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Resume evaluation results for
                </p>
                <p className="font-heading text-2xl font-semibold text-sidebar-foreground leading-tight">
                  {candidateName}
                </p>
              </div>
              <CloseApplicantDetailsSidebarButton />
            </div>
            <div className="space-y-4 rounded-md border border-sidebar-border bg-sidebar-accent/20 p-5 text-base">
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium">Overall Score</span>
                <span className="font-mono text-sm font-semibold">
                  {formatDecimal(overallScore)}/{scoreMax}
                </span>
              </p>
              {SCORE_CATEGORIES.map(({ key, label }) => {
                const category = evaluation.scores[key];

                return (
                  <p
                    key={key}
                    className="flex items-baseline justify-between gap-4 text-sm"
                  >
                    <span className="font-medium">{label}</span>
                    <span className="font-mono">
                      {formatDecimal(category.score)}/{category.max}
                    </span>
                  </p>
                );
              })}
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium text-sm">Bonus Points</span>
                <span className="font-mono text-sm">
                  {formatDecimal(evaluation.bonusPoints.total)}
                </span>
              </p>
              {evaluation.deductions.total > 0 ? (
                <p className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">Deductions</span>
                  <span className="font-mono text-destructive">
                    -{formatDecimal(evaluation.deductions.total)}
                  </span>
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="font-heading text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Key strengths
              </p>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-6">
                {evaluation.keyStrengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ol>
            </div>
            {/* {evaluation.areasForImprovement.length > 0 ? (
              <div className="space-y-2">
                <p className="font-heading text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Areas for improvement
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6">
                  {evaluation.areasForImprovement.map((improvement) => (
                    <li key={improvement}>{improvement}</li>
                  ))}
                </ul>
              </div>
            ) : null} */}
          </div>
          <Button
            type="button"
            className="mt-6 h-11 w-full text-base font-medium"
          >
            View CV and Transcript
          </Button>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
