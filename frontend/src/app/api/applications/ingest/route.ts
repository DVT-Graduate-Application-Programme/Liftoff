import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../_lib/backend";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  
  // Forward the multipart/form-data request directly to the backend ingest route
  const backendRes = await fetch(backendUrl("/api/applications/ingest"), {
    method: "POST",
    headers: {
      "Idempotency-Key": req.headers.get("Idempotency-Key") ?? "",
    },
    body: formData,
  });

  if (!backendRes.ok) {
    const errText = await backendRes.text();
    return new NextResponse(errText || backendRes.statusText, { status: backendRes.status });
  }

  const data = (await backendRes.json()) as unknown;
  return NextResponse.json(data, { status: backendRes.status });
}
