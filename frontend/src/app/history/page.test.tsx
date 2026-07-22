import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithQueryClient, jsonResponse } from "@/test-utils";
import HistoryPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function makeApplication(overrides: Partial<Record<string, unknown>> = {}) {
  return {
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
    ...overrides,
  };
}

describe("History page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading spinner before data resolves", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));

    renderWithQueryClient(<HistoryPage />);

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("only exposes pending, shortlisted, and rejected in the status filter", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ applications: [], nextCursor: null }));

    renderWithQueryClient(<HistoryPage />);

    const { default: userEvent } = await import("@testing-library/user-event");
    await userEvent.click(screen.getByRole("button", { name: "Advanced Filters" }));
    const options = Array.from(screen.getAllByRole("option")).map((option) => option.textContent);
    expect(options).toEqual(["All statuses", "Pending", "Shortlisted", "Rejected"]);
  });

  it("renders applications grouped by recency on success", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.includes("/api/applications?")) {
        return Promise.resolve(jsonResponse({ applications: [makeApplication()], nextCursor: null }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    renderWithQueryClient(<HistoryPage />);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Processed Today")).toBeInTheDocument();
    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ error: "INTERNAL_SERVER_ERROR", message: "boom" }, 500));

    renderWithQueryClient(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText("Error loading history.")).toBeInTheDocument();
    });
  });

  it("shows an empty state when there are no applications", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ applications: [], nextCursor: null }));

    renderWithQueryClient(<HistoryPage />);

    expect(await screen.findByText("No candidate history matches your filters.")).toBeInTheDocument();
  });

  it("appends a second page when 'Load more' is clicked", async () => {
    let listCall = 0;
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.includes("/api/applications?")) {
        listCall += 1;
        if (listCall === 1) {
          return Promise.resolve(
            jsonResponse({ applications: [makeApplication({ applicationId: "app-1", candidateName: "Ada Lovelace" })], nextCursor: 12 }),
          );
        }
        return Promise.resolve(
          jsonResponse({ applications: [makeApplication({ applicationId: "app-2", candidateName: "Grace Hopper" })], nextCursor: null }),
        );
      }
      // Per-card evaluation lookups: treat every candidate as "not yet evaluated".
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    const { default: userEvent } = await import("@testing-library/user-event");
    renderWithQueryClient(<HistoryPage />);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    const loadMore = screen.getByText("Load more");

    await userEvent.click(loadMore);

    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });
});
