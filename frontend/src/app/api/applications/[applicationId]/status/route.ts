import { NextRequest, NextResponse } from "next/server";
import { CurrentStatus, findApplication } from "../../../_lib/mockData";
import { badRequest, checkReservedTestIds, notFound, simulateLatency } from "../../../_lib/helpers";

const VALID_STATUSES: CurrentStatus[] = [
  "PENDING",
  "PROCESSING",
  "VALID",
  "INVALID",
  "MANUAL_REVIEW",
  "SHORTLISTED",
  "ERROR",
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  await simulateLatency();

  const { applicationId } = await params;

  const reserved = checkReservedTestIds(applicationId);
  if (reserved) return reserved;

  const app = findApplication(applicationId);
  if (!app) return notFound();

  const body = (await req.json().catch(() => null)) as
    | { newStatus?: CurrentStatus; reason?: string; recruiterIdentity?: string }
    | null;
  if (!body?.newStatus) return badRequest("newStatus is required.");
  if (!body.reason) return badRequest("reason is required for a status override.");
  if (!body.recruiterIdentity) return badRequest("recruiterIdentity is required.");
  if (!VALID_STATUSES.includes(body.newStatus)) {
    return badRequest(`newStatus must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  const previousStatus = app.currentStatus;
  const updatedAt = new Date().toISOString();
  app.currentStatus = body.newStatus;
  app.updatedAt = updatedAt;

  return NextResponse.json({
    previousStatus,
    updatedStatus: app.currentStatus,
    updatedAt,
  });
}
