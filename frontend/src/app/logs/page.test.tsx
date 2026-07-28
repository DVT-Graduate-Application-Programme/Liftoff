import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithQueryClient, jsonResponse } from "@/test-utils";
import { ApplicantSearchProvider } from "@/components/providers/applicant-search-provider";
import LogsPage from "./page";

function renderLogsPage() {
  return renderWithQueryClient(
    <ApplicantSearchProvider>
      <LogsPage />
    </ApplicantSearchProvider>
  );
}

function makeLog(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "log-1",
    applicationRecordId: "app-1",
    recruiterIdentity: "recruiter-seed-001",
    actionType: "SHORTLIST",
    previousStatus: "evaluated",
    newStatus: "shortlisted",
    reason: "Strong candidate.",
    ratingValue: null,
    actionedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Logs page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading skeletons before data resolves", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));

    renderLogsPage();

    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("renders logs on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse({ logs: [makeLog()], nextCursor: null }),
    );

    renderLogsPage();

    expect(await screen.findByText("recruiter-seed-001")).toBeInTheDocument();
    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 500 }));

    renderLogsPage();

    await waitFor(() => {
      expect(screen.getByText("Failed to load logs")).toBeInTheDocument();
    });
  });

  it("shows an empty state when there are no logs", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ logs: [], nextCursor: null }));

    renderLogsPage();

    expect(await screen.findByText("No logs found")).toBeInTheDocument();
  });

  it("appends a second page when 'Load more' is clicked", async () => {
    let call = 0;
    vi.spyOn(global, "fetch").mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve(
          jsonResponse({ logs: [makeLog({ id: "log-1", recruiterIdentity: "recruiter-seed-001" })], nextCursor: 10 }),
        );
      }
      return Promise.resolve(
        jsonResponse({ logs: [makeLog({ id: "log-2", recruiterIdentity: "recruiter-seed-002" })], nextCursor: null }),
      );
    });

    const { default: userEvent } = await import("@testing-library/user-event");
    renderLogsPage();

    expect(await screen.findByText("recruiter-seed-001")).toBeInTheDocument();
    const loadMore = screen.getByText("Load more");

    await userEvent.click(loadMore);

    expect(await screen.findByText("recruiter-seed-002")).toBeInTheDocument();
    expect(screen.getByText("recruiter-seed-001")).toBeInTheDocument();
    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });

  it("includes ?from=logs on each row's View link", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse({ logs: [makeLog()], nextCursor: null }),
    );

    renderLogsPage();

    const link = await screen.findByRole("link", { name: /view/i });
    expect(link).toHaveAttribute("href", "/applicants/app-1?from=logs");
  });
});
