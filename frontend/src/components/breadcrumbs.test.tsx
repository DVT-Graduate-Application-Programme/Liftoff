import { screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithQueryClient, jsonResponse } from "@/test-utils";
import { Breadcrumbs } from "./breadcrumbs";

const usePathnameMock = vi.fn<() => string>();
const useSearchParamsMock = vi.fn<() => { get: (key: string) => string | null }>();
const useParamsMock = vi.fn<() => Record<string, string>>();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
  useParams: () => useParamsMock(),
}));

function withSearchParams(entries: Record<string, string> = {}) {
  return { get: (key: string) => entries[key] ?? null };
}

describe("Breadcrumbs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSearchParamsMock.mockReturnValue(withSearchParams());
    useParamsMock.mockReturnValue({});
  });

  it("shows 'Home > Recruiter Logs' on the /logs page", () => {
    usePathnameMock.mockReturnValue("/logs");

    renderWithQueryClient(<Breadcrumbs />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Recruiter Logs")).toBeInTheDocument();
  });

  it("shows 'Home > History' on the /history page", () => {
    usePathnameMock.mockReturnValue("/history");

    renderWithQueryClient(<Breadcrumbs />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("shows 'Home > Recruiter Logs > <name>' when navigating from Logs to an applicant", async () => {
    usePathnameMock.mockReturnValue("/applicants/app-1");
    useSearchParamsMock.mockReturnValue(withSearchParams({ from: "logs" }));
    useParamsMock.mockReturnValue({ applicantId: "app-1" });
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ candidateName: "Joseph" }));

    renderWithQueryClient(<Breadcrumbs />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    const logsCrumb = screen.getByText("Recruiter Logs");
    expect(logsCrumb.closest("a")).toHaveAttribute("href", "/logs");
    expect(await screen.findByText("Joseph")).toBeInTheDocument();
  });

  it("shows only 'Home > <name>' for an unrecognized 'from' origin", async () => {
    usePathnameMock.mockReturnValue("/applicants/app-1");
    useSearchParamsMock.mockReturnValue(withSearchParams({ from: "unknown-origin" }));
    useParamsMock.mockReturnValue({ applicantId: "app-1" });
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ candidateName: "Joseph" }));

    renderWithQueryClient(<Breadcrumbs />);

    expect(await screen.findByText("Joseph")).toBeInTheDocument();
    expect(screen.queryByText("Recruiter Logs")).not.toBeInTheDocument();
  });

  it("renders nothing on an unrelated page", () => {
    usePathnameMock.mockReturnValue("/landing");

    const { container } = renderWithQueryClient(<Breadcrumbs />);

    expect(container).toBeEmptyDOMElement();
  });
});
