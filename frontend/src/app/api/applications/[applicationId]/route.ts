import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../_lib/backend";

interface BackendApplicationDetails {
  id: string;
  status: string;
  tier: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const res = await fetch(backendUrl(`/api/applications/${applicationId}`));

  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const data = (await res.json()) as BackendApplicationDetails;

  return NextResponse.json({
    applicationId: data.id,
    currentStatus: data.status,
    tier: data.tier,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}
