"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import type { ApplicantDetailsEvaluation } from "./mock-applicant-details";
import { CloseApplicantDetailsSidebarButton } from "./applicant-details-sidebar-controls";
import { SCORE_CATEGORIES } from "./constants";
import type { SelectionTabKey } from "@/components/providers/applicant-selection-provider";
import { useApplicationLogs } from "@/hooks/use-recruiter-logs";
import { ScrollText } from "lucide-react";

type ApplicantDetailsSidebarProps = {
  applicantId?: string | null;
  candidateName: string;
  evaluation: ApplicantDetailsEvaluation | null;
  isLoadingEvaluation?: boolean;
  evaluationMessage?: string | null;
  tabKey?: SelectionTabKey | null;
};

function formatDecimal(value: number) {
  return value.toFixed(1);
}

export function ApplicantDetailsSidebar({
  applicantId = null,
  candidateName,
  evaluation,
  isLoadingEvaluation = false,
  evaluationMessage = null,
  tabKey = null,
}: ApplicantDetailsSidebarProps) {
  const categoryScores: Partial<
    ApplicantDetailsEvaluation["categoryScoresJson"]
  > | null = evaluation?.categoryScoresJson ?? null;
  const hasEvaluation = Boolean(categoryScores);
  const bonusTotal = evaluation?.bonusPointsJson?.total ?? 0;
  const keyStrengths = evaluation?.keyStrengthsJson ?? [];
  const showNotesSection = tabKey === "accepted";
  const { data: applicationLogs, isLoading: isLoadingNotes } = useApplicationLogs(applicantId ?? "");
  const notes = (applicationLogs ?? []).filter((log) => {
    const actionType = log.actionType.toUpperCase();
    return (actionType === "NOTES" || actionType === "RATING") && Boolean(log.reason);
  });
  const scoreTotal = categoryScores
    ? SCORE_CATEGORIES.reduce(
        (total, { key }) => total + (categoryScores[key]?.score ?? 0),
        0,
      )
    : 0;
  const scoreMax = categoryScores
    ? SCORE_CATEGORIES.reduce(
        (total, { key }) => total + (categoryScores[key]?.max ?? 0),
        0,
      )
    : 0;
  const overallScore = categoryScores
    ? Math.max(0, scoreTotal + bonusTotal)
    : 0;

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
            {isLoadingEvaluation ? (
              <div className="rounded-md border border-sidebar-border bg-sidebar-accent/20 p-5 text-sm text-muted-foreground">
                Loading evaluation summary...
              </div>
            ) : hasEvaluation && categoryScores ? (
              <>
                <div className="space-y-4 rounded-md border border-sidebar-border bg-sidebar-accent/20 p-5 text-base">
                  <p className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">Overall Score</span>
                    <span className="font-mono text-sm font-semibold">
                      {formatDecimal(overallScore)}/{scoreMax}
                    </span>
                  </p>
                  {SCORE_CATEGORIES.map(({ key, label }) => {
                    const category = categoryScores[key];
                    if (!category) {
                      return null;
                    }

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
                      {formatDecimal(bonusTotal)}
                    </span>
                  </p>
                </div>
                {keyStrengths.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-heading text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Key strengths
                    </p>
                    <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-6">
                      {keyStrengths.map((strength) => (
                        <li key={strength}>{strength}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-md border border-sidebar-border bg-sidebar-accent/20 p-5 text-sm text-muted-foreground">
                {evaluationMessage ??
                  "No evaluation available for this application yet."}
              </div>
            )}
            {showNotesSection && applicantId ? (
              <div className="space-y-3 rounded-md border border-sidebar-border bg-sidebar-accent/20 p-5">
                <div className="space-y-1">
                  <p className="font-heading text-2xl font-semibold text-sidebar-foreground leading-tight">
                    Notes
                  </p>
                </div>
                {isLoadingNotes ? (
                  <div className="rounded-md border border-sidebar-border bg-sidebar/60 p-4 text-sm text-muted-foreground">
                    Loading notes...
                  </div>
                ) : notes.length > 0 ? (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="space-y-2 rounded-md border border-sidebar-border bg-sidebar p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-sidebar-foreground">
                              {note.recruiterIdentity}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(note.actionedAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </p>
                          </div>
                          <ScrollText className="size-4 shrink-0 text-muted-foreground" />
                        </div>
                        <p className="text-sm leading-relaxed text-sidebar-foreground">
                          {note.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-sidebar-border bg-sidebar p-4 text-sm text-muted-foreground">
                    No recruiter notes recorded yet.
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <Button
            type="button"
            asChild={Boolean(applicantId)}
            disabled={!applicantId}
            className="mt-6 h-11 w-full text-base font-medium"
          >
            {applicantId ? (
              <Link href={tabKey ? `/applicants/${applicantId}?from=${tabKey}` : `/applicants/${applicantId}`}>
                View CV and Transcript
              </Link>
            ) : (
              "View CV and Transcript"
            )}
          </Button>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
