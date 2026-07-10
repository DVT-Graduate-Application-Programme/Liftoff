import { NextRequest, NextResponse } from "next/server";
import { findApplication } from "../../../../_lib/mockData";
import { badRequest, checkReservedTestIds, notFound, simulateLatency } from "../../../../_lib/helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  await simulateLatency();

  const { applicationId } = await params;

  const reserved = checkReservedTestIds(applicationId);
  if (reserved) return reserved;

  const app = findApplication(applicationId);
  if (!app) return notFound();

  const body = (await req.json().catch(() => null)) as { recruiterIdentity?: string } | null;
  if (!body?.recruiterIdentity) {
    return badRequest("recruiterIdentity is required.");
  }

  const shortlistedAt = new Date().toISOString();
  app.ownership.shortlistedByRecruiterId = body.recruiterIdentity;
  app.ownership.shortlistedAt = shortlistedAt;
  app.currentStatus = "SHORTLISTED";
  app.updatedAt = shortlistedAt;

  return NextResponse.json({
    shortlistedByRecruiterId: app.ownership.shortlistedByRecruiterId,
    shortlistedAt: app.ownership.shortlistedAt,
    updatedStatus: app.currentStatus,
  });
}
