export type CandidateTier = "STRONG" | "BORDERLINE" | "WEAK";

export type CandidateStatus =
  | "PENDING"
  | "PROCESSING"
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
  ratedByRecruiterId: string | null;
  createdAt: string;
  academicAverage?: number;
}
