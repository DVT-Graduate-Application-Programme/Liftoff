import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithQueryClient, jsonResponse } from "@/test-utils";
import { ApplicantSearchProvider } from "@/components/providers/applicant-search-provider";
import { ApplicantSelectionProvider } from "@/components/providers/applicant-selection-provider";
import { ApplicantList } from "./applicant-list";
import { isClaimedByActiveRecruiter } from "./candidate-list-utils";
import type { CandidateApplication } from "@/types/candidate";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "phindi@dvtsoftware.com" } } }),
}));

vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({ setOpen: vi.fn() }),
}));

function makeApplication(
  overrides: Partial<CandidateApplication> = {},
): CandidateApplication {
  return {
    applicationId: "app-1",
    candidateName: "Ada Lovelace",
    currentStatus: "PENDING",
    tier: "STRONG",
    hardGatePassed: true,
    hiringAgentTotalScore: 4.5,
    cvSummary: "Great",
    flags: [],
    candidateGitHubUrl: null,
    claimedByRecruiterId: null,
    shortlistedByRecruiterId: null,
    ratedByRecruiterId: null,
    createdAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderList(
  props: { status?: string; emptyTitle: string } = { emptyTitle: "No applicants yet" },
) {
  return renderWithQueryClient(
    <ApplicantSearchProvider>
      <ApplicantSelectionProvider>
        <ApplicantList tabKey="pending" {...props} />
      </ApplicantSelectionProvider>
    </ApplicantSearchProvider>
  );
}

describe("ApplicantList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading skeletons before data resolves", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));

    renderList();

    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("renders applicants on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ applications: [makeApplication()], nextCursor: null }));

    renderList();

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });

  it("appends a second page when 'Load more' is clicked", async () => {
    let call = 0;
    vi.spyOn(global, "fetch").mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve(
          jsonResponse({ applications: [makeApplication({ applicationId: "app-1", candidateName: "Ada Lovelace" })], nextCursor: 1 })
        );
      }
      return Promise.resolve(
        jsonResponse({ applications: [makeApplication({ applicationId: "app-2", candidateName: "Grace Hopper" })], nextCursor: null })
      );
    });

    const { default: userEvent } = await import("@testing-library/user-event");
    renderList();

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    const loadMore = screen.getByText("Load more");

    await userEvent.click(loadMore);

    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ error: "INTERNAL_SERVER_ERROR", message: "boom" }, 500));

    renderList();

    await waitFor(() => {
      expect(screen.getByText(/couldn't load applicants/i)).toBeInTheDocument();
    });
  });

  it("shows the default empty state when there are no applicants and no search", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ applications: [], nextCursor: null }));

    renderList({ emptyTitle: "No pending applicants" });

    expect(await screen.findByText("No pending applicants")).toBeInTheDocument();
  });

  it("only marks a claim as owned when the recruiter ids match", () => {
    const application = makeApplication({
      claimedByRecruiterId: "someone-else@dvtsoftware.com",
    });

    expect(
      isClaimedByActiveRecruiter(application, "phindi@dvtsoftware.com"),
    ).toBe(false);
    expect(
      isClaimedByActiveRecruiter(
        application,
        "someone-else@dvtsoftware.com",
      ),
    ).toBe(true);
  });
});
