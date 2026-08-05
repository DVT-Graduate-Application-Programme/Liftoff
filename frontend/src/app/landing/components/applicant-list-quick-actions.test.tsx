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

  it("renders Quick Actions dropdown trigger on My Candidates tab (pending)", async () => {
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
    const quickActionsBtn = screen.getByRole("button", { name: /quick actions/i });
    expect(quickActionsBtn).toBeInTheDocument();

    fireEvent.click(quickActionsBtn);
    expect(screen.getByRole("button", { name: /shortlist candidate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject candidate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view detail/i })).toBeInTheDocument();
  });

  it("navigates to candidate route when View Detail item is clicked inside Quick Actions menu", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /quick actions/i }));

    const viewDetailBtn = screen.getByRole("button", { name: /view detail/i });
    fireEvent.click(viewDetailBtn);

    expect(mockPush).toHaveBeenCalledWith("/applicants/app-quick-1");
  });

  it("triggers shortlist mutation when Shortlist is confirmed from modal", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /quick actions/i }));

    const shortlistBtn = screen.getByRole("button", { name: /shortlist candidate/i });
    fireEvent.click(shortlistBtn);

    const confirmBtn = await screen.findByRole("button", { name: /^confirm$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(shortlistCalled).toBe(true);
    });
  });

  it("triggers reject mutation when Reject is confirmed from modal", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /quick actions/i }));

    const rejectBtn = screen.getByRole("button", { name: /reject candidate/i });
    fireEvent.click(rejectBtn);

    const confirmBtn = await screen.findByRole("button", { name: /^confirm$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(rejectCalled).toBe(true);
    });
  });

  it("hides quick-action menu on other tabs", async () => {
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
    expect(screen.queryByRole("button", { name: /quick actions/i })).not.toBeInTheDocument();
  });
});
