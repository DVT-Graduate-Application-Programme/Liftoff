export type CandidateTier = "A" | "B" | "C" | "D";

export type CandidateStatus =
  | "PENDING"
  | "evaluated"
  | "forwarded"
  | "rejected"
  | "shortlisted";

export interface CandidateApplication {
  applicationId: string;
  candidateName: string;
  currentStatus: CandidateStatus;
  tier: CandidateTier;
  hardGatePassed: boolean;
  hiringAgentTotalScore: number;
  cvSummary: string;
  flags: string[];
  candidateGitHubUrl: string | null;
  claimedByRecruiterId: string | null;
  shortlistedByRecruiterId: string | null;
  createdAt: string;
}
