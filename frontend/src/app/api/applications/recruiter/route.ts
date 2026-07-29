import { NextResponse } from "next/server";
import { backendUrl } from "../../_lib/backend";

export async function GET() {
  const res = await fetch(backendUrl("/api/applications/recruiter"));

  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const data = (await res.json()) as unknown;
  return NextResponse.json(data);
}
