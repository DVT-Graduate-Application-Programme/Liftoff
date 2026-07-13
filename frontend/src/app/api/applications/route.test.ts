import { NextRequest } from "next/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

function request(query: string) {
  return new NextRequest(`http://localhost/api/applications${query}`);
}

describe("GET /api/applications", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK_API_DELAY_MS", "0");
  });

  it("filters by a case-insensitive candidateName search", async () => {
    const response = await GET(request("?search=thabo"));
    const body = (await response.json()) as { applications: { candidateName: string }[] };

    expect(body.applications.length).toBeGreaterThan(0);
    expect(body.applications.every((a) => a.candidateName.toLowerCase().includes("thabo"))).toBe(true);
  });

  it("matches any status in a comma-separated status list", async () => {
    const response = await GET(request("?status=PENDING,PROCESSING"));
    const body = (await response.json()) as { applications: { currentStatus: string }[] };

    expect(body.applications.length).toBeGreaterThan(0);
    expect(body.applications.every((a) => ["PENDING", "PROCESSING"].includes(a.currentStatus))).toBe(true);
  });

  it("filters by minimum score and sorts by score", async () => {
    const response = await GET(request("?status=PENDING,PROCESSING&minScore=3&sort=score_desc"));
    const body = (await response.json()) as { applications: { hiringAgentTotalScore: number }[] };

    expect(body.applications.length).toBeGreaterThan(0);
    expect(body.applications.every((a) => a.hiringAgentTotalScore >= 3)).toBe(true);
    expect(body.applications.map((a) => a.hiringAgentTotalScore)).toEqual(
      [...body.applications.map((a) => a.hiringAgentTotalScore)].sort((a, b) => b - a)
    );
  });

  it("paginates via limit/cursor and reports nextCursor", async () => {
    const first = await GET(request("?limit=2&cursor=0"));
    const firstBody = (await first.json()) as { applications: unknown[]; nextCursor: number | null };

    expect(firstBody.applications).toHaveLength(2);
    expect(firstBody.nextCursor).toBe(2);

    const second = await GET(request("?limit=2&cursor=2"));
    const secondBody = (await second.json()) as { applications: unknown[]; nextCursor: number | null };

    expect(secondBody.applications).toHaveLength(2);
    expect(secondBody.applications).not.toEqual(firstBody.applications);
  });

  it("returns nextCursor null once results are exhausted", async () => {
    const response = await GET(request("?search=thabo-mokoena-does-not-exist"));
    const body = (await response.json()) as { applications: unknown[]; nextCursor: number | null };

    expect(body.applications).toHaveLength(0);
    expect(body.nextCursor).toBeNull();
  });
});
