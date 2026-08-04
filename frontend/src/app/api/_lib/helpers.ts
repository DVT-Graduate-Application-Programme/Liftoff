import { NextResponse } from "next/server";

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
  return NextResponse.json(
    { error: "INTERNAL_SERVER_ERROR", message },
    { status: 500 },
  );
}
