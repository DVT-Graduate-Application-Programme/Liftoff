import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithQueryClient, jsonResponse } from "@/test-utils";
import { ApplicantSearchProvider } from "@/components/providers/applicant-search-provider";
import { ApplicantSelectionProvider } from "@/components/providers/applicant-selection-provider";
import PendingCandidates from "./pending-candidates";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "phindi@dvtsoftware.com" } } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({ setOpen: vi.fn(), setOpenMobile: vi.fn() }),
}));

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

describe("PendingCandidates", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads pending and processing applications for the signed-in recruiter", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.includes("/api/dashboard/applications?")) {
        const searchParams = new URL(url).searchParams;
        expect(searchParams.get("status")).toBe("PENDING,PROCESSING");
        expect(searchParams.get("recruiterIdentity")).toBe("phindi@dvtsoftware.com");
        return Promise.resolve(jsonResponse({ applications: [], nextCursor: null }));
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });

    renderWithQueryClient(
      <ApplicantSearchProvider>
        <ApplicantSelectionProvider>
          <PendingCandidates />
        </ApplicantSelectionProvider>
      </ApplicantSearchProvider>,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
