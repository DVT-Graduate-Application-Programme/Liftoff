/**
 * Redirect any URL from that fake host (url host in mockdata) to a 
 * locally-served PDF instead. 
 * 
 * Once real blob-storage URLs are provided, 'isPlaceholderUrl' will
 * stop file matching and the urls will essentially just passthrough
 * this function.
 */

const PLACEHOLDER_HOST = "storageaccount.blob.core.windows.net";

const DEMO_DOC_FILENAMES = {
  cv: "Thabo_Nkosi_CV.pdf",
  transcript: "Thabo_Nkosi_Academic_Transcript.pdf",
} as const;

export type DocumentKind = keyof typeof DEMO_DOC_FILENAMES;

function isPlaceholderUrl(url: string) {
  try {
    return new URL(url).hostname === PLACEHOLDER_HOST;
  } catch {
    return false;
  }
}

function inferDocumentKind(url: string): DocumentKind {
  return url.toLowerCase().includes("transcript") ? "transcript" : "cv";
}

export function resolveDocumentUrl(url: string): string {
  if (!isPlaceholderUrl(url)) {
    return url;
  }

  const filename = DEMO_DOC_FILENAMES[inferDocumentKind(url)];
  return `/api/demo-docs/${filename}`;
}
