import { NextRequest } from "next/server";
import { proxyPost } from "../../../../_lib/backend";

export async function POST(req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return proxyPost(`/api/applications/${applicationId}/ownership/claim`, req);
}
