import { NextRequest, NextResponse } from "next/server";
import { findApplication } from "../../../_lib/mockData";
import { checkReservedTestIds, notFound, simulateLatency } from "../../../_lib/helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  await simulateLatency();

  const { applicationId } = await params;

  const reserved = checkReservedTestIds(applicationId);
  if (reserved) return reserved;

  const app = findApplication(applicationId);
  if (!app) return notFound();

  // No HiringAgentEvaluations row yet — e.g. still PENDING, or failed the hard
  // gate and was never sent to the Hiring Agent. Use this to test the
  // "not yet evaluated" empty state in the evaluation panel.
  if (!app.evaluation) {
    return notFound("No evaluation available for this application yet.");
  }

  const { hiringAgentTotalScore, ...evaluation } = app.evaluation;

  return NextResponse.json({
    id: applicationId,
    applicationRecordId: applicationId,
    institutionJson: evaluation.institution,
    categoryScoresJson: {
      education: {
        score: 0,
        max: 0,
        evidence: "Education scoring is not available in the local mock data.",
      },
      ...evaluation.scores,
    },
    evidenceJson: {
      openSource: evaluation.scores.open_source.evidence,
      selfProjects: evaluation.scores.self_projects.evidence,
      production: evaluation.scores.production.evidence,
      technicalSkills: evaluation.scores.technical_skills.evidence,
    },
    bonusPointsJson: {
      total: evaluation.bonusPoints.total,
      breakdown: Object.entries(evaluation.bonusPoints.breakdown)
        .map(([label, points]) => `${label}: +${String(points)}`)
        .join("; "),
    },
    deductionsJson: {
      promptInjectionDetected: false,
      promptInjectionEvidence: "",
    },
    keyStrengthsJson: evaluation.keyStrengths,
    areasForImprovementJson: evaluation.areasForImprovement,
    gitHubProfileDataJson: null,
    projectClassificationsJson: null,
    processedAt: new Date().toISOString(),
    applicationRecord: null,
    // exposed here for convenience even though the contract lists it primarily
    // on the dashboard card endpoint
    hiringAgentTotalScore,
  });
}
