import type { Evaluation, EvaluationScore } from "@/types/api";

export type ApplicantDetailsEvaluation = Evaluation;
export type ApplicantDetailsScoreCategory = EvaluationScore;

export const mockApplicantDetails: ApplicantDetailsEvaluation = {
  id: "mock-evaluation",
  applicationRecordId: "mock-application",
  institutionJson: null,
  categoryScoresJson: {
    education: {
      score: 23,
      max: 25,
      evidence:
        "BSc Information Technology coursework demonstrates strong formal technical foundations.",
    },
    open_source: {
      score: 10,
      max: 35,
      evidence:
        "The GitHub data shows only personal repositories (7 total) with no evidence of contributions to other people's projects or community involvement. This limits the score significantly.",
    },
    self_projects: {
      score: 24,
      max: 30,
      evidence:
        "Three distinct and highly complex self-initiated projects: ElevatorSim (SOLID principles, TDD, Clean Architecture), Reactive Music Discovery Feature Set (Angular Signals, API integration, peer review workflow simulation), and Parallel Algorithm Replication & Forensic Sentiment Analysis (advanced algorithms, system forensics, data mining). The complexity and real-world architectural focus are exceptional.",
    },
    production: {
      score: 18,
      max: 25,
      evidence:
        "Software Developer Intern at DVT. Experience in an agile team delivering enterprise software using .NET Core. Key achievements include participating in technical code reviews, gaining exposure to CI/CD pipelines, and working with scaled delivery practices.",
    },
    technical_skills: {
      score: 9,
      max: 10,
      evidence:
        "Demonstrated breadth across multiple modern stacks: Backend (.NET Core, C#, Web API), Frontend (Angular 21, React, TypeScript), Testing (xUnit, Moq, TDD), and Algorithms & Forensics (Python, Autopsy). Strong emphasis on SOLID principles and software architecture.",
    },
  },
  evidenceJson: null,
  bonusPointsJson: {
    total: 3,
    breakdown: "LinkedIn profile: +1; technical communication: +2",
  },
  deductionsJson: null,
  keyStrengthsJson: [
    "Deep understanding of software architecture principles (SOLID, Clean Architecture)",
    "Proven ability to build complex full-stack applications demonstrating high technical proficiency",
    "Experience in enterprise development environments and agile methodologies",
    "Strong commitment to quality assurance through Test-Driven Development (TDD) and code reviews",
  ],
  areasForImprovementJson: [
    "Contribute to established open-source projects to demonstrate community involvement.",
    "Provide live demos or deployed versions of self-projects where possible.",
    "Expand professional experience beyond internships to demonstrate sustained industry impact.",
  ],
  gitHubProfileDataJson: null,
  projectClassificationsJson: null,
  aiSummary: "Strong technical candidate with consistent academic performance and an active GitHub history.",
  processedAt: new Date().toISOString(),
};
