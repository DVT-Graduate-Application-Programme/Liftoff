import { NextRequest, NextResponse } from "next/server";
import { badRequest, conflict, simulateLatency } from "../_lib/helpers";
import { applications } from "../_lib/mockData";

// Track email message IDs seen this dev-server session so a repeat POST
// naturally produces a 409, without needing a special test value.
const seenEmailMessageIds = new Set<string>();

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
  const search = searchParams.get("search");
  const minScoreValue = Number(searchParams.get("minScore"));
  const minScore = Number.isFinite(minScoreValue) && searchParams.has("minScore") ? minScoreValue : null;
  const sort = searchParams.get("sort");
  // Callers that don't care about pagination (e.g. History) omit `limit` and get everything back.
  const limit = Number(searchParams.get("limit") ?? Number.MAX_SAFE_INTEGER);
  const cursor = Number(searchParams.get("cursor") ?? 0);

  let results = applications;

  if (status) {
    const statuses = status.split(",");
    results = results.filter((a) => statuses.includes(a.currentStatus));
  }
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
  if (search) {
    const needle = search.toLowerCase();
    results = results.filter((a) => a.applicant.candidateName.toLowerCase().includes(needle));
  }
  if (minScore !== null) {
    results = results.filter((a) => (a.evaluation?.hiringAgentTotalScore ?? 0) >= minScore);
  }
  if (sort === "score_desc" || sort === "score_asc") {
    const direction = sort === "score_desc" ? -1 : 1;
    results = [...results].sort(
      (a, b) => direction * ((a.evaluation?.hiringAgentTotalScore ?? 0) - (b.evaluation?.hiringAgentTotalScore ?? 0))
    );
  }
  if (sort === "date_desc" || sort === "date_asc") {
    const direction = sort === "date_desc" ? -1 : 1;
    results = [...results].sort((a, b) => direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }

  const page = results.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < results.length ? cursor + limit : null;

  return NextResponse.json({
    applications: page.map((application) => ({
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
    nextCursor,
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
