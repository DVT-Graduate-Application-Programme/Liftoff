import React from "react";
import ApplicantCard from "@/components/applicant-card/applicant-card";
import type { CandidateApplication } from "@/types/candidate";

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

const statusLabels: Record<CandidateApplication["currentStatus"], string> = {
  PROCESSING: "Pending",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
};

const statusTones: Record<
  CandidateApplication["currentStatus"],
  "positive" | "warning" | "negative" | "neutral"
> = {
  PROCESSING: "warning",
  SHORTLISTED: "positive",
  REJECTED: "negative",
  HIRED: "positive",
};

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const AllCandidates = () => {
  return (
    <div className="flex flex-col gap-2">
      {mockApplications.map((application) => (
        <ApplicantCard
          key={application.applicationId}
          name={application.candidateName}
          institute={application.cvSummary}
          systemScore={Math.round(application.hiringAgentTotalScore * 20)}
          statusLabel={statusLabels[application.currentStatus]}
          statusTone={statusTones[application.currentStatus]}
          reviewedAt={formatDate(application.createdAt)}
          actionLabel="Details"
        />
      ))}
    </div>
  );
};

export default AllCandidates;
