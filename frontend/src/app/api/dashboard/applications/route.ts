import { NextRequest, NextResponse } from "next/server";
import { applications } from "../../_lib/mockData";
import { simulateLatency } from "../../_lib/helpers";

function toBool(value: string | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export async function GET(req: NextRequest) {
  await simulateLatency();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tier = searchParams.get("tier");
  const hardGatePassed = toBool(searchParams.get("hardGatePassed"));
  const claimed = toBool(searchParams.get("claimed"));
  const shortlisted = toBool(searchParams.get("shortlisted"));
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  let results = applications;

  if (status) results = results.filter((a) => a.currentStatus === status);
  if (tier) results = results.filter((a) => a.tier === tier);
  if (hardGatePassed !== null) results = results.filter((a) => a.screening.hardGatePassed === hardGatePassed);
  if (claimed !== null) {
    results = results.filter((a) => (claimed ? a.ownership.claimedByRecruiterId !== null : a.ownership.claimedByRecruiterId === null));
  }
  if (shortlisted !== null) {
    results = results.filter((a) =>
      shortlisted ? a.ownership.shortlistedByRecruiterId !== null : a.ownership.shortlistedByRecruiterId === null
    );
  }
  if (dateFrom) results = results.filter((a) => a.createdAt >= dateFrom);
  if (dateTo) results = results.filter((a) => a.createdAt <= dateTo);

  return NextResponse.json({
    applications: results.map((a) => ({
      applicationId: a.applicationId,
      candidateName: a.applicant.candidateName,
      currentStatus: a.currentStatus,
      tier: a.tier,
      hardGatePassed: a.screening.hardGatePassed,
      hiringAgentTotalScore: a.evaluation?.hiringAgentTotalScore ?? 0,
      cvSummary: a.cvSummary,
      flags: a.flags,
      candidateGitHubUrl: a.applicant.candidateGitHubUrl,
      claimedByRecruiterId: a.ownership.claimedByRecruiterId,
      shortlistedByRecruiterId: a.ownership.shortlistedByRecruiterId,
      createdAt: a.createdAt,
    })),
  });
}
