import { NextRequest } from "next/server";
import { proxyBinary } from "../../../_lib/backend";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return proxyBinary(`/api/applications/${applicationId}/transcript`);
}
