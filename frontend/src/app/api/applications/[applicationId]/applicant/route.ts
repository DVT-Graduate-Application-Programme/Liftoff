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

  return NextResponse.json(app.applicant);
}
