import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithQueryClient, jsonResponse } from "@/test-utils";
import HistoryPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const applications = [
  {
    applicationId: "app-1",
    candidateName: "Ada Lovelace",
    currentStatus: "SHORTLISTED",
    tier: "STRONG",
    hardGatePassed: true,
    hiringAgentTotalScore: 4.5,
    cvSummary: "Great",
    flags: [],
    candidateGitHubUrl: null,
    claimedByRecruiterId: null,
    shortlistedByRecruiterId: null,
    createdAt: new Date().toISOString(),
  },
];

describe("History page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading skeletons before data resolves", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));

    renderWithQueryClient(<HistoryPage />);

    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("renders applications grouped by recency on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ applications }));

    renderWithQueryClient(<HistoryPage />);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Processed Today")).toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ error: "INTERNAL_SERVER_ERROR", message: "boom" }, 500));

    renderWithQueryClient(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load review history/i)).toBeInTheDocument();
    });
  });

  it("shows an empty state when there are no applications", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ applications: [] }));

    renderWithQueryClient(<HistoryPage />);

    expect(await screen.findByText("No applications found")).toBeInTheDocument();
  });
});
