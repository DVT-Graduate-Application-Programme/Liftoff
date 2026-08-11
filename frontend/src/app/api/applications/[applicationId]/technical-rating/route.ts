import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { proxyPostJson } from "../../../_lib/backend";

export async function POST(req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const session = await auth();
  const recruiterIdentity = session?.user.email;
  if (!recruiterIdentity) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as { rating?: unknown } | null;
  if (typeof body?.rating !== "number" || !Number.isFinite(body.rating)) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "A numeric rating is required." },
      { status: 400 },
    );
  }

  return proxyPostJson(`/api/applications/${applicationId}/technical-rating`, {
    recruiterIdentity,
    rating: body.rating,
  });
}
