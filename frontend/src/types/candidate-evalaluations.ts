export interface CandidateEvaluation {
  candidateName: string;

  institution: Institution;
  scores: Scores;
  bonusPoints: BonusPoints;
  deductions: Deductions;

  keyStrengths: string[];
  areasForImprovement: string[];
}

export interface Institution {
  name: string;
  degreeName: string;
}

export interface Scores {
  openSource: ScoreCategory;
  selfProjects: ScoreCategory;
  production: ScoreCategory;
  technicalSkills: ScoreCategory;
}

export interface ScoreCategory {
  score: number;
  max: number;
  evidence: string;
}

export interface BonusPoints {
  total: number;
  breakdown: BonusBreakdown;
}

export interface BonusBreakdown {
  linkedinProfile: number;
  technicalCommunication: number;
}

export interface Deductions {
  total: number;
  reasons: string[];
}
