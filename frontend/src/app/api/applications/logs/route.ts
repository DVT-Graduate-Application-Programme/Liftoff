import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../_lib/backend";

export async function GET(_req: NextRequest) {
  const res = await fetch(backendUrl("/api/applications/logs"));

  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
