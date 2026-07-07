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

  const { hiringAgentTotalScore, ...evaluationBody } = app.evaluation;

  return NextResponse.json({
    ...evaluationBody,
    // exposed here for convenience even though the contract lists it primarily
    // on the dashboard card endpoint
    hiringAgentTotalScore,
  });
}
