import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { proxyPostJson } from "../../../../_lib/backend";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const session = await auth();
  const recruiterIdentity = session?.user?.email;
  if (!recruiterIdentity) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 },
    );
  }
  return proxyPostJson(`/api/applications/${applicationId}/ownership/claim`, { recruiterIdentity });
}
