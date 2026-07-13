import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithQueryClient, jsonResponse } from "@/test-utils";
import DetailedApplicantInfo from "./page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ applicantId: "app-1" }),
}));

const detail = { applicationId: "app-1", currentStatus: "VALID", tier: "STRONG", createdAt: "", updatedAt: "" };
const applicant = { candidateName: "Ada Lovelace", candidateEmail: "ada@example.com", candidateGitHubUrl: null };
const evaluation = {
  id: "eval-1",
  applicationRecordId: "app-1",
  institutionJson: { name: "MIT", degreeName: "BSc" },
  categoryScoresJson: {
    education: { score: 1, max: 5, evidence: "" },
    open_source: { score: 1, max: 5, evidence: "" },
    self_projects: { score: 1, max: 5, evidence: "" },
    production: { score: 1, max: 5, evidence: "" },
    technical_skills: { score: 1, max: 5, evidence: "" },
  },
  evidenceJson: null,
  bonusPointsJson: { total: 0, breakdown: "" },
  deductionsJson: { promptInjectionDetected: false, promptInjectionEvidence: "" },
  keyStrengthsJson: ["Great communicator"],
  areasForImprovementJson: ["More testing"],
  gitHubProfileDataJson: null,
  projectClassificationsJson: null,
  processedAt: "",
  applicationRecord: null,
  hiringAgentTotalScore: 4,
};
const documents = { cvDocument: { url: "https://x/cv.pdf", filename: "cv.pdf", uploadedDate: "", sizeKb: 1 }, transcriptDocument: null };

function mockFetchFor(routes: Record<string, Response | (() => Response)>) {
  vi.spyOn(global, "fetch").mockImplementation((input) => {
    const url = input as string;
    for (const [path, res] of Object.entries(routes)) {
      if (url.endsWith(path)) return Promise.resolve(typeof res === "function" ? res() : res);
    }
    throw new Error(`Unhandled fetch: ${url}`);
  });
}

describe("Applicant detail page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders applicant details on success", async () => {
    mockFetchFor({
      "/api/applications/app-1": jsonResponse(detail),
      "/api/applications/app-1/applicant": jsonResponse(applicant),
      "/api/applications/app-1/evaluation": jsonResponse(evaluation),
      "/api/applications/app-1/documents": jsonResponse(documents),
    });

    renderWithQueryClient(<DetailedApplicantInfo />);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Great communicator")).toBeInTheDocument();
  });

  it("shows a not-found state for a 404 detail response", async () => {
    mockFetchFor({
      "/api/applications/app-1": jsonResponse({ error: "NOT_FOUND", message: "Application not found" }, 404),
    });

    renderWithQueryClient(<DetailedApplicantInfo />);

    expect(await screen.findByText("Applicant not found")).toBeInTheDocument();
  });

  it("shows an error state for a 500 detail response", async () => {
    mockFetchFor({
      "/api/applications/app-1": jsonResponse({ error: "INTERNAL_SERVER_ERROR", message: "boom" }, 500),
    });

    renderWithQueryClient(<DetailedApplicantInfo />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load this applicant/i)).toBeInTheDocument();
    });
  });

  it("shows a not-yet-evaluated empty state when evaluation 404s", async () => {
    mockFetchFor({
      "/api/applications/app-1": jsonResponse(detail),
      "/api/applications/app-1/applicant": jsonResponse(applicant),
      "/api/applications/app-1/evaluation": jsonResponse({ error: "NOT_FOUND", message: "not evaluated" }, 404),
      "/api/applications/app-1/documents": jsonResponse(documents),
    });

    renderWithQueryClient(<DetailedApplicantInfo />);

    expect(await screen.findByText("Not yet evaluated")).toBeInTheDocument();
  });
});
