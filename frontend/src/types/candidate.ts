export type CandidateTier = "STRONG" | "BORDERLINE" | "WEAK" | "INVALID";

export type CandidateStatus =
  | "PENDING"
  | "PROCESSING"
  | "VALID"
  | "INVALID"
  | "MANUAL_REVIEW"
  | "SHORTLISTED"
  | "ERROR";

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
