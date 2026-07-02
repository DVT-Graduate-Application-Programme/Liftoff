/**
 * Mock dataset for the Graduate Recruitment Automation Tool API (contract v4).
 *
 * How to use these IDs while building/testing the dashboard:
 *
 *  - b7f1d2c4-8f3a-4d2b-9f1a-2c3d4e5f6789  STRONG, PROCESSING, fully populated (the contract's own example)
 *  - 3a2b1c9d-6e5f-4a3b-8c2d-1e2f3a4b5c6d  BORDERLINE, VALID, fully populated
 *  - 5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b  WEAK, VALID, fully populated
 *  - 9c8d7e6f-5a4b-4c3d-9e2f-1a2b3c4d5e6f  INVALID, hard gate failed, no evaluation yet
 *  - 2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e  VALID but sparse: no transcript, no GitHub, no bonus/deductions
 *  - 7f8e9d0c-1b2a-4c3d-8e9f-0a1b2c3d4e5f  SHORTLISTED, fully populated, claimed + shortlisted
 *  - c1a1c1a1-0000-0000-0000-000000000000  PENDING, still awaiting processing (no child resources ready)
 *  - 00000000-0000-0000-0000-000000000000  Always returns 404 Not Found (use to test empty/not-found UI states)
 *  - 11111111-1111-1111-1111-111111111111  Always returns 500 Internal Server Error (use to test error states)
 *
 * Every GET route reads from `applications` below. Every action route (claim, shortlist,
 * status override) mutates it in-memory for the lifetime of the dev server process, so
 * refreshing the page will keep state but restarting `next dev` resets everything.
 */

export type CurrentStatus =
  | "PENDING"
  | "PROCESSING"
  | "VALID"
  | "INVALID"
  | "MANUAL_REVIEW"
  | "SHORTLISTED"
  | "ERROR";

export type Tier = "STRONG" | "BORDERLINE" | "WEAK" | "INVALID";

export interface MockApplication {
  applicationId: string;
  currentStatus: CurrentStatus;
  tier: Tier;
  createdAt: string;
  updatedAt: string;

  applicant: {
    candidateName: string;
    candidateEmail: string;
    candidateGitHubUrl: string | null;
  };

  screening: {
    hardGatePassed: boolean;
    hardGateReason: string | null;
  };

  // null until the Hiring Agent has actually evaluated the application
  // (e.g. still PENDING, or failed the hard gate and was never evaluated).
  evaluation: {
    institution: { name: string; degreeName: string };
    scores: {
      open_source: { score: number; max: number; evidence: string };
      self_projects: { score: number; max: number; evidence: string };
      production: { score: number; max: number; evidence: string };
      technical_skills: { score: number; max: number; evidence: string };
    };
    bonusPoints: { total: number; breakdown: Record<string, number> };
    deductions: { total: number; reasons: string[] };
    keyStrengths: string[];
    areasForImprovement: string[];
    hiringAgentTotalScore: number;
  } | null;

  documents: {
    cvDocument: { url: string; filename: string; uploadedDate: string; sizeKb: number };
    transcriptDocument: { url: string; filename: string; uploadedDate: string; sizeKb: number } | null;
  };

  ownership: {
    claimedByRecruiterId: string | null;
    claimedAt: string | null;
    shortlistedByRecruiterId: string | null;
    shortlistedAt: string | null;
  };

  cvSummary: string;
  flags: string[];
}

export const NOT_FOUND_ID = "00000000-0000-0000-0000-000000000000";
export const SERVER_ERROR_ID = "11111111-1111-1111-1111-111111111111";

export const applications: MockApplication[] = [
  {
    applicationId: "b7f1d2c4-8f3a-4d2b-9f1a-2c3d4e5f6789",
    currentStatus: "PROCESSING",
    tier: "STRONG",
    createdAt: "2025-01-15T10:30:00Z",
    updatedAt: "2025-01-15T10:45:00Z",
    applicant: {
      candidateName: "Thabo Mokoena",
      candidateEmail: "thabo.mokoena@email.com",
      candidateGitHubUrl: "https://github.com/thabo-mokoena",
    },
    screening: { hardGatePassed: true, hardGateReason: null },
    evaluation: {
      institution: { name: "University of South Africa", degreeName: "BSc Information Technology" },
      scores: {
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
            "Three distinct and highly complex self-initiated projects: ElevatorSim (SOLID, TDD, Clean Architecture), Reactive Music Discovery Feature Set (Angular Signals, API integration), Parallel Algorithm Replication & Forensic Sentiment Analysis.",
        },
        production: {
          score: 18,
          max: 25,
          evidence:
            "Software Developer Intern at DVT. Experience in an agile team delivering enterprise software using .NET Core, code reviews, CI/CD exposure.",
        },
        technical_skills: {
          score: 9,
          max: 10,
          evidence:
            "Backend: .NET Core, C#, Web API. Frontend: Angular 21, React, TypeScript. Testing: xUnit, Moq, TDD. Strong emphasis on SOLID principles.",
        },
      },
      bonusPoints: { total: 3, breakdown: { linkedin_profile: 1, technical_communication: 2 } },
      deductions: { total: 0, reasons: [] },
      keyStrengths: [
        "Deep understanding of software architecture principles (SOLID, Clean Architecture)",
        "Proven ability to build complex full-stack applications",
        "Experience in enterprise development environments and agile methodologies",
        "Strong commitment to quality assurance through TDD and code reviews",
      ],
      areasForImprovement: [
        "Contribute to established open-source projects to demonstrate community involvement.",
        "Provide live demos or deployed versions of self-projects where possible.",
        "Expand professional experience beyond internships.",
      ],
      hiringAgentTotalScore: 4.2,
    },
    documents: {
      cvDocument: {
        url: "https://storageaccount.blob.core.windows.net/cvs/thabo-mokoena-cv.pdf",
        filename: "thabo-mokoena-cv.pdf",
        uploadedDate: "2025-01-15T10:30:00Z",
        sizeKb: 1200,
      },
      transcriptDocument: {
        url: "https://storageaccount.blob.core.windows.net/transcripts/thabo-mokoena-transcript.pdf",
        filename: "thabo-mokoena-transcript.pdf",
        uploadedDate: "2025-01-15T10:30:00Z",
        sizeKb: 800,
      },
    },
    ownership: {
      claimedByRecruiterId: "recruiter1@company.com",
      claimedAt: "2025-01-15T11:00:00Z",
      shortlistedByRecruiterId: null,
      shortlistedAt: null,
    },
    cvSummary: "Strong technical candidate with consistent academic performance and an active GitHub history.",
    flags: ["No GitHub found"],
  },

  {
    applicationId: "3a2b1c9d-6e5f-4a3b-8c2d-1e2f3a4b5c6d",
    currentStatus: "VALID",
    tier: "BORDERLINE",
    createdAt: "2025-02-03T08:12:00Z",
    updatedAt: "2025-02-03T08:40:00Z",
    applicant: {
      candidateName: "Naledi Dlamini",
      candidateEmail: "naledi.dlamini@email.com",
      candidateGitHubUrl: "https://github.com/naledi-dlamini",
    },
    screening: { hardGatePassed: true, hardGateReason: null },
    evaluation: {
      institution: { name: "University of Pretoria", degreeName: "BEng Computer Engineering" },
      scores: {
        open_source: { score: 15, max: 35, evidence: "A handful of forked repos, one small merged PR to a community project." },
        self_projects: { score: 14, max: 30, evidence: "One IoT dashboard project, moderate complexity, no tests." },
        production: { score: 10, max: 25, evidence: "Part-time freelance work, no formal internship experience." },
        technical_skills: { score: 6, max: 10, evidence: "Solid grasp of JavaScript/Node, limited backend exposure." },
      },
      bonusPoints: { total: 1, breakdown: { linkedin_profile: 1 } },
      deductions: { total: 2, reasons: ["Late submission of transcript"] },
      keyStrengths: ["Comfortable across the JS ecosystem", "Good written communication in CV"],
      areasForImprovement: ["Needs more depth in backend/production experience", "Should contribute to larger codebases"],
      hiringAgentTotalScore: 2.6,
    },
    documents: {
      cvDocument: {
        url: "https://storageaccount.blob.core.windows.net/cvs/naledi-dlamini-cv.pdf",
        filename: "naledi-dlamini-cv.pdf",
        uploadedDate: "2025-02-03T08:12:00Z",
        sizeKb: 950,
      },
      transcriptDocument: {
        url: "https://storageaccount.blob.core.windows.net/transcripts/naledi-dlamini-transcript.pdf",
        filename: "naledi-dlamini-transcript.pdf",
        uploadedDate: "2025-02-04T09:00:00Z",
        sizeKb: 610,
      },
    },
    ownership: {
      claimedByRecruiterId: null,
      claimedAt: null,
      shortlistedByRecruiterId: null,
      shortlistedAt: null,
    },
    cvSummary: "Borderline candidate with promising JS skills but limited production experience.",
    flags: ["Late transcript"],
  },

  {
    applicationId: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
    currentStatus: "VALID",
    tier: "WEAK",
    createdAt: "2025-02-10T14:05:00Z",
    updatedAt: "2025-02-10T14:20:00Z",
    applicant: {
      candidateName: "Sipho Nkosi",
      candidateEmail: "sipho.nkosi@email.com",
      candidateGitHubUrl: null,
    },
    screening: { hardGatePassed: true, hardGateReason: null },
    evaluation: {
      institution: { name: "Vaal University of Technology", degreeName: "National Diploma IT" },
      scores: {
        open_source: { score: 0, max: 35, evidence: "No GitHub profile found." },
        self_projects: { score: 5, max: 30, evidence: "One coursework group project, minimal individual contribution visible." },
        production: { score: 0, max: 25, evidence: "No production or internship experience listed." },
        technical_skills: { score: 3, max: 10, evidence: "Introductory-level HTML/CSS/JS only." },
      },
      bonusPoints: { total: 0, breakdown: {} },
      deductions: { total: 5, reasons: ["No GitHub found", "CV formatting issues"] },
      keyStrengths: ["Completed diploma coursework on schedule"],
      areasForImprovement: ["Build and publish personal projects", "Create a GitHub profile", "Seek internship experience"],
      hiringAgentTotalScore: 0.4,
    },
    documents: {
      cvDocument: {
        url: "https://storageaccount.blob.core.windows.net/cvs/sipho-nkosi-cv.pdf",
        filename: "sipho-nkosi-cv.pdf",
        uploadedDate: "2025-02-10T14:05:00Z",
        sizeKb: 480,
      },
      transcriptDocument: null,
    },
    ownership: {
      claimedByRecruiterId: null,
      claimedAt: null,
      shortlistedByRecruiterId: null,
      shortlistedAt: null,
    },
    cvSummary: "Entry-level candidate with limited demonstrable technical evidence.",
    flags: ["No GitHub found", "No transcript"],
  },

  {
    applicationId: "9c8d7e6f-5a4b-4c3d-9e2f-1a2b3c4d5e6f",
    currentStatus: "INVALID",
    tier: "INVALID",
    createdAt: "2025-02-12T09:00:00Z",
    updatedAt: "2025-02-12T09:02:00Z",
    applicant: {
      candidateName: "Unknown Candidate",
      candidateEmail: "bounced@email.com",
      candidateGitHubUrl: null,
    },
    screening: {
      hardGatePassed: false,
      hardGateReason: "CV could not be parsed — file appears to be corrupted or password-protected.",
    },
    // Never reached the Hiring Agent because it failed the hard gate.
    evaluation: null,
    documents: {
      cvDocument: {
        url: "https://storageaccount.blob.core.windows.net/cvs/corrupted-cv.pdf",
        filename: "corrupted-cv.pdf",
        uploadedDate: "2025-02-12T09:00:00Z",
        sizeKb: 12,
      },
      transcriptDocument: null,
    },
    ownership: {
      claimedByRecruiterId: null,
      claimedAt: null,
      shortlistedByRecruiterId: null,
      shortlistedAt: null,
    },
    cvSummary: "Failed hard gate screening — CV unreadable.",
    flags: ["Hard gate failed", "Unreadable CV"],
  },

  {
    applicationId: "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
    currentStatus: "VALID",
    tier: "BORDERLINE",
    createdAt: "2025-02-14T11:30:00Z",
    updatedAt: "2025-02-14T11:50:00Z",
    applicant: {
      candidateName: "Given Mahlangu",
      candidateEmail: "given.mahlangu@email.com",
      candidateGitHubUrl: null,
    },
    screening: { hardGatePassed: true, hardGateReason: null },
    evaluation: {
      institution: { name: "North-West University", degreeName: "BSc Computer Science" },
      scores: {
        open_source: { score: 8, max: 35, evidence: "Minimal open-source footprint." },
        self_projects: { score: 16, max: 30, evidence: "Two self-projects of moderate complexity." },
        production: { score: 8, max: 25, evidence: "Short-term vacation work, limited scope." },
        technical_skills: { score: 5, max: 10, evidence: "Reasonable coverage of core CS fundamentals." },
      },
      // Deliberately sparse: no bonus points earned, no deductions applied — tests empty-state rendering.
      bonusPoints: { total: 0, breakdown: {} },
      deductions: { total: 0, reasons: [] },
      keyStrengths: ["Solid CS fundamentals"],
      areasForImprovement: ["Needs a GitHub presence", "More production exposure"],
      hiringAgentTotalScore: 1.9,
    },
    documents: {
      cvDocument: {
        url: "https://storageaccount.blob.core.windows.net/cvs/given-mahlangu-cv.pdf",
        filename: "given-mahlangu-cv.pdf",
        uploadedDate: "2025-02-14T11:30:00Z",
        sizeKb: 700,
      },
      // No transcript received for this candidate — tests null/optional document handling.
      transcriptDocument: null,
    },
    ownership: {
      claimedByRecruiterId: null,
      claimedAt: null,
      shortlistedByRecruiterId: null,
      shortlistedAt: null,
    },
    cvSummary: "Candidate with sparse supporting data — good case for testing empty/optional fields.",
    flags: [],
  },

  {
    applicationId: "7f8e9d0c-1b2a-4c3d-8e9f-0a1b2c3d4e5f",
    currentStatus: "SHORTLISTED",
    tier: "STRONG",
    createdAt: "2025-01-20T09:00:00Z",
    updatedAt: "2025-01-22T16:10:00Z",
    applicant: {
      candidateName: "Lerato Khumalo",
      candidateEmail: "lerato.khumalo@email.com",
      candidateGitHubUrl: "https://github.com/lerato-khumalo",
    },
    screening: { hardGatePassed: true, hardGateReason: null },
    evaluation: {
      institution: { name: "University of Cape Town", degreeName: "BSc Computer Science" },
      scores: {
        open_source: { score: 28, max: 35, evidence: "Active contributor to two open-source libraries, 40+ merged PRs." },
        self_projects: { score: 27, max: 30, evidence: "Well-documented, deployed self-projects with CI pipelines." },
        production: { score: 22, max: 25, evidence: "Two internships, one at a scaling fintech startup." },
        technical_skills: { score: 10, max: 10, evidence: "Broad, deep stack across frontend, backend, and DevOps." },
      },
      bonusPoints: { total: 5, breakdown: { linkedin_profile: 1, technical_communication: 2, open_source_maintainer: 2 } },
      deductions: { total: 0, reasons: [] },
      keyStrengths: [
        "Exceptional open-source track record",
        "Demonstrated production ownership at scale",
        "Excellent technical communication",
      ],
      areasForImprovement: ["None significant"],
      hiringAgentTotalScore: 4.9,
    },
    documents: {
      cvDocument: {
        url: "https://storageaccount.blob.core.windows.net/cvs/lerato-khumalo-cv.pdf",
        filename: "lerato-khumalo-cv.pdf",
        uploadedDate: "2025-01-20T09:00:00Z",
        sizeKb: 1100,
      },
      transcriptDocument: {
        url: "https://storageaccount.blob.core.windows.net/transcripts/lerato-khumalo-transcript.pdf",
        filename: "lerato-khumalo-transcript.pdf",
        uploadedDate: "2025-01-20T09:00:00Z",
        sizeKb: 730,
      },
    },
    ownership: {
      claimedByRecruiterId: "recruiter1@company.com",
      claimedAt: "2025-01-21T10:00:00Z",
      shortlistedByRecruiterId: "recruiter1@company.com",
      shortlistedAt: "2025-01-22T16:10:00Z",
    },
    cvSummary: "Exceptional candidate — already shortlisted. Use to test the shortlisted UI state.",
    flags: [],
  },

  {
    applicationId: "c1a1c1a1-0000-0000-0000-000000000000",
    currentStatus: "PENDING",
    tier: "INVALID",
    createdAt: "2025-02-20T07:45:00Z",
    updatedAt: "2025-02-20T07:45:00Z",
    applicant: {
      candidateName: "Pending Candidate",
      candidateEmail: "pending.candidate@email.com",
      candidateGitHubUrl: null,
    },
    screening: { hardGatePassed: false, hardGateReason: null },
    // Nothing has run yet — tests the "still processing" UI state.
    evaluation: null,
    documents: {
      cvDocument: {
        url: "https://storageaccount.blob.core.windows.net/cvs/pending-candidate-cv.pdf",
        filename: "pending-candidate-cv.pdf",
        uploadedDate: "2025-02-20T07:45:00Z",
        sizeKb: 900,
      },
      transcriptDocument: null,
    },
    ownership: {
      claimedByRecruiterId: null,
      claimedAt: null,
      shortlistedByRecruiterId: null,
      shortlistedAt: null,
    },
    cvSummary: "Just received, not yet processed.",
    flags: [],
  },
];

export function findApplication(applicationId: string): MockApplication | undefined {
  return applications.find((a) => a.applicationId === applicationId);
}
