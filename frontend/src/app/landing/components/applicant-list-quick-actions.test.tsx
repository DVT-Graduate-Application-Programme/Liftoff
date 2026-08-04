import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithQueryClient, jsonResponse } from "@/test-utils";
import { ApplicantSearchProvider } from "@/components/providers/applicant-search-provider";
import { ApplicantSelectionProvider } from "@/components/providers/applicant-selection-provider";
import { ApplicantList } from "./applicant-list";
import type { CandidateApplication } from "@/types/candidate";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "phindi@dvtsoftware.com" } } }),
}));
vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({ setOpen: vi.fn(), setOpenMobile: vi.fn() }),
}));

function makeApplication(
  overrides: Partial<CandidateApplication> = {},
): CandidateApplication {
  return {
    applicationId: "app-quick-1",
    candidateName: "Sarah Connor",
    currentStatus: "PENDING",
    tier: "STRONG",
    hardGatePassed: true,
    hiringAgentTotalScore: 4.8,
    cvSummary: "Senior Dev",
    flags: [],
    candidateGitHubUrl: null,
    claimedByRecruiterId: "phindi@dvtsoftware.com",
    shortlistedByRecruiterId: null,
    ratedByRecruiterId: null,
    createdAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("ApplicantList Quick Actions & View Detail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it("renders Shortlist, Reject, and View Detail buttons on My Candidates tab (pending)", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/applications")) {
        return Promise.resolve(jsonResponse({ applications: [makeApplication()], nextCursor: null }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    renderWithQueryClient(
      <ApplicantSearchProvider>
        <ApplicantSelectionProvider>
          <ApplicantList tabKey="pending" emptyTitle="No applicants" />
        </ApplicantSelectionProvider>
      </ApplicantSearchProvider>
    );

    expect(await screen.findByText("Sarah Connor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /shortlist/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view detail/i })).toBeInTheDocument();
  });

  it("navigates to candidate route when View Detail button is clicked", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/applications")) {
        return Promise.resolve(jsonResponse({ applications: [makeApplication()], nextCursor: null }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    renderWithQueryClient(
      <ApplicantSearchProvider>
        <ApplicantSelectionProvider>
          <ApplicantList tabKey="pending" emptyTitle="No applicants" />
        </ApplicantSelectionProvider>
      </ApplicantSearchProvider>
    );

    expect(await screen.findByText("Sarah Connor")).toBeInTheDocument();
    const viewDetailBtn = screen.getByRole("button", { name: /view detail/i });
    fireEvent.click(viewDetailBtn);

    expect(mockPush).toHaveBeenCalledWith("/applicants/app-quick-1");
  });

  it("triggers shortlist mutation when Shortlist is clicked", async () => {
    let shortlistCalled = false;
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/ownership/shortlist")) {
        shortlistCalled = true;
        return Promise.resolve(jsonResponse({ shortlistedByRecruiterId: "phindi@dvtsoftware.com", updatedStatus: "SHORTLISTED" }));
      }
      if (url.includes("/api/applications")) {
        return Promise.resolve(jsonResponse({ applications: [makeApplication()], nextCursor: null }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    renderWithQueryClient(
      <ApplicantSearchProvider>
        <ApplicantSelectionProvider>
          <ApplicantList tabKey="pending" emptyTitle="No applicants" />
        </ApplicantSelectionProvider>
      </ApplicantSearchProvider>
    );

    expect(await screen.findByText("Sarah Connor")).toBeInTheDocument();
    const shortlistBtn = screen.getByRole("button", { name: /shortlist/i });
    fireEvent.click(shortlistBtn);

    await waitFor(() => {
      expect(shortlistCalled).toBe(true);
    });
  });

  it("triggers reject mutation when Reject is clicked", async () => {
    let rejectCalled = false;
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/ownership/reject")) {
        rejectCalled = true;
        return Promise.resolve(jsonResponse({ actionedByRecruiterId: "phindi@dvtsoftware.com", updatedStatus: "REJECTED" }));
      }
      if (url.includes("/api/applications")) {
        return Promise.resolve(jsonResponse({ applications: [makeApplication()], nextCursor: null }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    renderWithQueryClient(
      <ApplicantSearchProvider>
        <ApplicantSelectionProvider>
          <ApplicantList tabKey="pending" emptyTitle="No applicants" />
        </ApplicantSelectionProvider>
      </ApplicantSearchProvider>
    );

    expect(await screen.findByText("Sarah Connor")).toBeInTheDocument();
    const rejectBtn = screen.getByRole("button", { name: /reject/i });
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(rejectCalled).toBe(true);
    });
  });

  it("hides quick-action Shortlist and Reject buttons on other tabs", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/recruiters")) {
        return Promise.resolve(jsonResponse([]));
      }
      if (url.includes("/api/applications")) {
        return Promise.resolve(jsonResponse({ applications: [makeApplication()], nextCursor: null }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    renderWithQueryClient(
      <ApplicantSearchProvider>
        <ApplicantSelectionProvider>
          <ApplicantList tabKey="all" emptyTitle="No applicants" />
        </ApplicantSelectionProvider>
      </ApplicantSearchProvider>
    );

    expect(await screen.findByText("Sarah Connor")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /shortlist/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
  });

});
