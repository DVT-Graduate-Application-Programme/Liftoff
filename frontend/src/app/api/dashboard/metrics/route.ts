import { NextResponse } from "next/server";
import { applications } from "../../_lib/mockData";
import { simulateLatency } from "../../_lib/helpers";

export async function GET() {
  await simulateLatency();

  const count = (status: string) => applications.filter((a) => a.currentStatus === status).length;

  return NextResponse.json({
    totalApplications: applications.length,
    pendingApplications: count("PENDING"),
    processingApplications: count("PROCESSING"),
    validApplications: count("VALID"),
    invalidApplications: count("INVALID"),
    manualReviewApplications: count("MANUAL_REVIEW"),
    shortlistedApplications: count("SHORTLISTED"),
    errorApplications: count("ERROR"),
  });
}
