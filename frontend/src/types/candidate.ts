export type CandidateTier = "STRONG" | "MODERATE" | "WEAK";

export type CandidateStatus =
  | "PROCESSING"
  | "SHORTLISTED"
  | "REJECTED"
  | "HIRED";

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
