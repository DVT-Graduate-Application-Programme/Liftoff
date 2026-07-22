import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { proxyPostJson } from "../../../../_lib/backend";

export async function POST(req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const session = await auth();
  const recruiterIdentity = session?.user?.email;
  if (!recruiterIdentity) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as { reason?: unknown } | null;
  const payload: { recruiterIdentity: string; reason?: string } = { recruiterIdentity };
  if (typeof body?.reason === "string") {
    payload.reason = body.reason;
  }

  return proxyPostJson(`/api/applications/${applicationId}/ownership/shortlist`, payload);
}
