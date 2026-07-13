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

export interface EvaluationCategoryScores {
  education: EvaluationScore;
  open_source: EvaluationScore;
  self_projects: EvaluationScore;
  production: EvaluationScore;
  technical_skills: EvaluationScore;
}

export interface Evaluation {
  id: string;
  applicationRecordId: string;
  institutionJson: { name: string; degreeName: string } | null;
  categoryScoresJson: EvaluationCategoryScores;
  evidenceJson: Record<string, string> | null;
  bonusPointsJson: { total: number; breakdown: string } | null;
  deductionsJson: { promptInjectionDetected: boolean; promptInjectionEvidence: string } | null;
  keyStrengthsJson: string[] | null;
  areasForImprovementJson: string[] | null;
  gitHubProfileDataJson: Record<string, unknown> | null;
  projectClassificationsJson: Record<string, unknown> | null;
  processedAt: string;
  applicationRecord: Record<string, unknown> | null;
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
