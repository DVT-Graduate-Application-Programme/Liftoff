import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../_lib/backend";
import type { RecruiterActionLog } from "@/hooks/use-recruiter-logs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? Number.MAX_SAFE_INTEGER);
  const cursor = Number(searchParams.get("cursor") ?? 0);

  const res = await fetch(backendUrl("/api/applications/logs"));

  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const logs = (await res.json()) as RecruiterActionLog[];
  const page = logs.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < logs.length ? cursor + limit : null;

  return NextResponse.json({ logs: page, nextCursor });
}
