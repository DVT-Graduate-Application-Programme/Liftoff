import type { CandidateApplication } from "@/types/candidate";

export interface ApplicationDetail {
  applicationId: string;
  currentStatus: string;
  tier: string;
  createdAt: string;
  updatedAt: string;
}

export interface Applicant {
  candidateName: string;
  candidateEmail: string;
  candidateGitHubUrl: string | null;
}

export interface EvaluationScore {
  score: number;
  max: number;
  evidence: string;
}

export interface Evaluation {
  institution: { name: string; degreeName: string };
  scores: {
    open_source: EvaluationScore;
    self_projects: EvaluationScore;
    production: EvaluationScore;
    technical_skills: EvaluationScore;
  };
  bonusPoints: { total: number; breakdown: Record<string, number> };
  deductions: { total: number; reasons: string[] };
  keyStrengths: string[];
  areasForImprovement: string[];
  hiringAgentTotalScore: number;
}

export interface DocumentFile {
  url: string;
  filename: string;
  uploadedDate: string;
  sizeKb: number;
}

export interface Documents {
  cvDocument: DocumentFile;
  transcriptDocument: DocumentFile | null;
}

export interface ApplicationFilters {
  status?: string;
  tier?: string;
  hardGatePassed?: boolean;
  claimed?: boolean;
  shortlisted?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  cursor?: number;
}

export interface PaginatedApplications {
  applications: CandidateApplication[];
  nextCursor: number | null;
}
