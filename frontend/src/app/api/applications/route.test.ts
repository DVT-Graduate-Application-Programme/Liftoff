import { NextRequest } from "next/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CandidateApplication } from "@/types/candidate";
import { GET } from "./route";

const fixtures: CandidateApplication[] = [
  {
    applicationId: "app-1",
    candidateName: "Thabo Nkosi",
    currentStatus: "PENDING",
    tier: "STRONG",
    hardGatePassed: true,
    hiringAgentTotalScore: 4,
    cvSummary: "Strong candidate",
    flags: [],
    candidateGitHubUrl: null,
    claimedByRecruiterId: null,
    shortlistedByRecruiterId: null,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    applicationId: "app-2",
    candidateName: "Andile Ngwenya",
    currentStatus: "evaluated",
    tier: "BORDERLINE",
    hardGatePassed: true,
    hiringAgentTotalScore: 2,
    cvSummary: "Borderline candidate",
    flags: [],
    candidateGitHubUrl: null,
    claimedByRecruiterId: null,
    shortlistedByRecruiterId: null,
    createdAt: "2024-01-02T00:00:00.000Z",
  },
  {
    applicationId: "app-3",
    candidateName: "Sarah Adams",
    currentStatus: "shortlisted",
    tier: "STRONG",
    hardGatePassed: true,
    hiringAgentTotalScore: 5,
    cvSummary: "Shortlisted candidate",
    flags: [],
    candidateGitHubUrl: null,
    claimedByRecruiterId: "rose@dvtsoftware.com",
    shortlistedByRecruiterId: "rose@dvtsoftware.com",
    createdAt: "2024-01-03T00:00:00.000Z",
  },
  {
    applicationId: "app-4",
    candidateName: "Katlego Sebola",
    currentStatus: "rejected",
    tier: "WEAK",
    hardGatePassed: true,
    hiringAgentTotalScore: 1,
    cvSummary: "Weak candidate",
    flags: [],
    candidateGitHubUrl: null,
    claimedByRecruiterId: null,
    shortlistedByRecruiterId: null,
    createdAt: "2024-01-04T00:00:00.000Z",
  },
];

function request(query: string) {
  return new NextRequest(`http://localhost/api/applications${query}`);
}

describe("GET /api/applications", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        statusText: "OK",
        json: async () => ({ applications: fixtures }),
      })),
    );
  });

  it("filters by a case-insensitive candidateName search", async () => {
    const response = await GET(request("?search=thabo"));
    const body = (await response.json()) as {
      applications: { candidateName: string }[];
    };

    expect(body.applications.length).toBeGreaterThan(0);
    expect(
      body.applications.every((a) =>
        a.candidateName.toLowerCase().includes("thabo"),
      ),
    ).toBe(true);
  });

  it("matches any status in a comma-separated status list", async () => {
    const response = await GET(request("?status=PENDING,evaluated"));
    const body = (await response.json()) as {
      applications: { currentStatus: string }[];
    };

    expect(body.applications.length).toBeGreaterThan(0);
    expect(
      body.applications.every((a) =>
        ["PENDING", "evaluated"].includes(a.currentStatus),
      ),
    ).toBe(true);
  });

  it("filters by minimum score and sorts by score", async () => {
    const response = await GET(request("?minScore=2&sort=score_desc"));
    const body = (await response.json()) as {
      applications: { hiringAgentTotalScore: number }[];
    };

    expect(body.applications.length).toBeGreaterThan(0);
    expect(body.applications.every((a) => a.hiringAgentTotalScore >= 2)).toBe(
      true,
    );
    expect(body.applications.map((a) => a.hiringAgentTotalScore)).toEqual(
      [...body.applications.map((a) => a.hiringAgentTotalScore)].sort(
        (a, b) => b - a,
      ),
    );
  });

  it("sorts applications by applied date", async () => {
    const response = await GET(request("?sort=date_asc"));
    const body = (await response.json()) as {
      applications: { createdAt: string }[];
    };

    expect(body.applications.map((a) => a.createdAt)).toEqual(
      [...body.applications.map((a) => a.createdAt)].sort(),
    );
  });

  it("paginates via limit/cursor and reports nextCursor", async () => {
    const first = await GET(request("?limit=2&cursor=0"));
    const firstBody = (await first.json()) as {
      applications: unknown[];
      nextCursor: number | null;
    };

    expect(firstBody.applications).toHaveLength(2);
    expect(firstBody.nextCursor).toBe(2);

    const second = await GET(request("?limit=2&cursor=2"));
    const secondBody = (await second.json()) as {
      applications: unknown[];
      nextCursor: number | null;
    };

    expect(secondBody.applications).toHaveLength(2);
    expect(secondBody.applications).not.toEqual(firstBody.applications);
    expect(secondBody.nextCursor).toBeNull();
  });

  it("returns nextCursor null once results are exhausted", async () => {
    const response = await GET(request("?search=thabo-mokoena-does-not-exist"));
    const body = (await response.json()) as {
      applications: unknown[];
      nextCursor: number | null;
    };

    expect(body.applications).toHaveLength(0);
    expect(body.nextCursor).toBeNull();
  });
});
