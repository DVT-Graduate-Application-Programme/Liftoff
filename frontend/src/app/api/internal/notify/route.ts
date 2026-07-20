import { NextRequest, NextResponse } from "next/server";
import emitter from "@/lib/sse-emitter";

export interface ApplicationSseEvent {
  event:
    | "application-ingested"
    | "evaluation-saved"
    | "evaluation-reset"
    | "ownership-changed";
  applicationId: string;
  changeType: string | null;
  timestamp: string;
}

const SHARED_SECRET = process.env.INTERNAL_TOKEN;

/**
 * POST /api/internal/notify
 *
 * Called exclusively by the C# backend whenever application data changes.
 * Validates the shared secret then broadcasts the event to all connected
 * browser clients via the in-process EventEmitter.
 *
 * This route must never be publicly accessible — protect it at the
 * network/firewall level in production (only the backend container should
 * be able to reach it).
 */
export async function POST(request: NextRequest) {
  if (SHARED_SECRET && request.headers.get("x-internal-token") !== SHARED_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as ApplicationSseEvent;

  if (!body.event || !body.applicationId) {
    return NextResponse.json(
      { error: "Missing required fields: event, applicationId" },
      { status: 400 }
    );
  }

  emitter.emit("application-event", body);

  return NextResponse.json({ ok: true });
}
