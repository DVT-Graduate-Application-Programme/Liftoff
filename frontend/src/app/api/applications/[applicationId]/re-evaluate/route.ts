import { NextRequest } from "next/server";
import { proxyJson } from "../../../_lib/backend";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return proxyJson(`/api/applications/${applicationId}/re-evaluate`, {
    method: "POST",
  });
}
