import { NextRequest, NextResponse } from "next/server";
import { badRequest, conflict, simulateLatency } from "../_lib/helpers";
import { backendUrl } from "../_lib/backend";
import type { CandidateApplication } from "@/types/candidate";

// Track email message IDs seen this dev-server session so a repeat POST
// naturally produces a 409, without needing a special test value.
const seenEmailMessageIds = new Set<string>();

function toBool(value: string | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export async function GET(req: NextRequest) {
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

  // The backend's status filter is an exact match only (no comma-separated multi-status),
  // so it's applied client-side below instead of being forwarded.
  const backendParams = new URLSearchParams();
  if (tier) backendParams.set("tier", tier);
  if (hardGatePassed !== null) backendParams.set("hardGatePassed", String(hardGatePassed));
  if (claimed !== null) backendParams.set("isClaimed", String(claimed));
  if (shortlisted !== null) backendParams.set("isShortlisted", String(shortlisted));
  if (dateFrom) backendParams.set("fromDate", dateFrom);
  if (dateTo) backendParams.set("toDate", dateTo);

  const res = await fetch(backendUrl(`/api/dashboard/applications?${backendParams.toString()}`));
  if (!res.ok) {
    return NextResponse.json({ error: "BACKEND_ERROR", message: res.statusText }, { status: res.status });
  }
  const { applications } = (await res.json()) as { applications: CandidateApplication[] };

  let results = applications;

  if (status) {
    const statuses = status.split(",");
    results = results.filter((a) => statuses.includes(a.currentStatus));
  }
  if (search) {
    const needle = search.toLowerCase();
    results = results.filter((a) => a.candidateName.toLowerCase().includes(needle));
  }
  if (minScore !== null) {
    results = results.filter((a) => a.hiringAgentTotalScore >= minScore);
  }
  if (sort === "score_desc" || sort === "score_asc") {
    const direction = sort === "score_desc" ? -1 : 1;
    results = [...results].sort((a, b) => direction * (a.hiringAgentTotalScore - b.hiringAgentTotalScore));
  }
  if (sort === "date_desc" || sort === "date_asc") {
    const direction = sort === "date_desc" ? -1 : 1;
    results = [...results].sort((a, b) => direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }

  const page = results.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < results.length ? cursor + limit : null;

  return NextResponse.json({ applications: page, nextCursor });
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
