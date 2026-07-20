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

/**
 * POST /api/internal/notify
 *
 * Called exclusively by the C# backend whenever application data changes.
 * Broadcasts the event to all connected browser clients via the in-process
 * EventEmitter.
 *
 * This route is protected by network isolation — in Docker only the backend
 * container can reach it. Do not expose port 3000 directly to the internet.
 */
export async function POST(request: NextRequest) {
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
