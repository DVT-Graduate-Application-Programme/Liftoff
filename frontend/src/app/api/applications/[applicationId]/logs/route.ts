import { NextRequest } from "next/server";
import { proxyJson } from "../../../_lib/backend";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  return proxyJson(`/api/applications/${applicationId}/logs`);
}
