import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { notFound } from "../../_lib/helpers";

/**
 * Serves the placeholder PDFs used by resolve-document-url.ts while the real
 * blob-storage-backed documents endpoint isn't live yet.
 */
const DEMO_DOCS_DIR = path.join(
  process.cwd(),
  "src/app/applicants/[applicantId]/demo_docs",
);

const ALLOWED_FILENAMES = new Set([
  "Thabo_Nkosi_CV.pdf",
  "Thabo_Nkosi_Academic_Transcript.pdf",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!ALLOWED_FILENAMES.has(filename)) {
    return notFound("The Demo document not found");
  }

  try {
    const file = await readFile(path.join(DEMO_DOCS_DIR, filename));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return notFound("Demo document not found");
  }
}
