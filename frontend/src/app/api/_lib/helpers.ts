import { NextResponse } from "next/server";
import { NOT_FOUND_ID, SERVER_ERROR_ID } from "./mockData";

/**
 * Simulates network latency so loading states are actually visible during dev.
 * Set MOCK_API_DELAY_MS=0 in .env.local to disable.
 */
export async function simulateLatency() {
  const ms = Number(process.env.MOCK_API_DELAY_MS ?? 350);
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function notFound(message = "Application not found") {
  return NextResponse.json({ error: "NOT_FOUND", message }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: "BAD_REQUEST", message }, { status: 400 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: "CONFLICT", message }, { status: 409 });
}

export function serverError(message = "Simulated internal server error") {
  return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message }, { status: 500 });
}

/**
 * Every {applicationId} route should call this first. Returns a NextResponse
 * to short-circuit with if the ID is one of the reserved test IDs, or null
 * if the caller should proceed with normal lookup logic.
 */
export function checkReservedTestIds(applicationId: string) {
  if (applicationId === NOT_FOUND_ID) return notFound();
  if (applicationId === SERVER_ERROR_ID) return serverError();
  return null;
}
