import React from "react";
import type { CandidateApplication } from "@/types/candidate";
import CandidateCard from "./candidate-card";

//got this from api contract on wiki
const mockApplications: CandidateApplication[] = [
  {
    applicationId: "b7f1d2c4-8f3a-4d2b-9f1a-2c3d4e5f6789",
    candidateName: "Thabo Mokoena",
    currentStatus: "PROCESSING",
    tier: "STRONG",
    hardGatePassed: true,
    hiringAgentTotalScore: 4.2,
    cvSummary:
      "Strong technical candidate with consistent academic performance and an active GitHub history.",
    flags: [],
    candidateGitHubUrl: "https://github.com/thabo-mokoena",
    claimedByRecruiterId: "recruiter1@company.com",
    shortlistedByRecruiterId: null,
    createdAt: "2025-01-15T10:30:00Z",
  },
];

const AllCandidates = () => {
  return (
    <div className="flex flex-col gap-2">
      {mockApplications.map((application) => (
        <CandidateCard key={application.applicationId} {...application} />
      ))}
    </div>
  );
};

export default AllCandidates;
