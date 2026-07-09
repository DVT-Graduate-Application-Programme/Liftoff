import { NextRequest, NextResponse } from "next/server";
import { badRequest, conflict, simulateLatency } from "../_lib/helpers";
import { applications } from "../_lib/mockData";

// Track email message IDs seen this dev-server session so a repeat POST
// naturally produces a 409, without needing a special test value.
const seenEmailMessageIds = new Set<string>();

export async function GET() {
  await simulateLatency();

  return NextResponse.json({
    applications: applications.map((application) => ({
      applicationId: application.applicationId,
      candidateName: application.applicant.candidateName,
      currentStatus: application.currentStatus,
      tier: application.tier,
      hardGatePassed: application.screening.hardGatePassed,
      hiringAgentTotalScore: application.evaluation?.hiringAgentTotalScore ?? 0,
      cvSummary: application.cvSummary,
      flags: application.flags,
      candidateGitHubUrl: application.applicant.candidateGitHubUrl,
      claimedByRecruiterId: application.ownership.claimedByRecruiterId,
      shortlistedByRecruiterId: application.ownership.shortlistedByRecruiterId,
      createdAt: application.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  await simulateLatency();

  const body = (await req.json().catch(() => null)) as { emailMessageId?: string } | null;
  if (!body?.emailMessageId) {
    return badRequest("emailMessageId is required.");
  }

  // Deliberate test hook: POST with this exact emailMessageId to always get a 409,
  // regardless of session state.
  if (body.emailMessageId === "msg-duplicate-test" || seenEmailMessageIds.has(body.emailMessageId)) {
    return conflict("An application with this EmailMessageId already exists.");
  }
  seenEmailMessageIds.add(body.emailMessageId);

  return NextResponse.json(
    {
      applicationId: crypto.randomUUID(),
      status: "PENDING",
      createdAt: new Date().toISOString(),
    },
    { status: 202 }
  );
}
