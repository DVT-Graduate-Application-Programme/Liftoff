import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";

export function backendUrl(path: string): string {
  return `${BACKEND_URL}${path}`;
}

// Proxies a JSON request/response to backend
export async function proxyJson(path: string, init?: RequestInit): Promise<NextResponse> {
  const res = await fetch(backendUrl(path), init);
  const text = await res.text();
  return new NextResponse(text.length > 0 ? text : null, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

// Proxies a binary (pdf in this case) response to backend
export async function proxyBinary(path: string): Promise<NextResponse> {
  const res = await fetch(backendUrl(path));
  if (!res.ok || !res.body) {
    return new NextResponse(null, { status: res.status });
  }

  const headers = new Headers();
  headers.set("Content-Type", res.headers.get("Content-Type") ?? "application/pdf");
  const contentDisposition = res.headers.get("Content-Disposition");
  if (contentDisposition) {
    headers.set("Content-Disposition", contentDisposition);
  }

  return new NextResponse(res.body, { status: res.status, headers });
}

// Proxies a JSON POST body from incoming request to th backend
export async function proxyPost(path: string, req: NextRequest): Promise<NextResponse> {
  return proxyJson(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
  });
}