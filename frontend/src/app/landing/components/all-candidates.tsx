import React from "react";
import ApplicantCard from "@/components/applicant-card/applicant-card";
import type { CandidateApplication } from "@/types/candidate";
import {
  getRecruiterLabel,
  formatDate,
  statusLabels,
  statusTones,
  toScorePercent,
} from "./candidate-list-utils";

type AllCandidatesProps = {
  applications: CandidateApplication[];
  onSelectApplication: (application: CandidateApplication) => void;
};

const AllCandidates = ({
  applications,
  onSelectApplication,
}: AllCandidatesProps) => {
  return (
    <div className="flex flex-col gap-2">
      {applications.map((application) => (
        <ApplicantCard
          key={application.applicationId}
          name={application.candidateName}
          institute={application.cvSummary}
          systemScore={toScorePercent(application.hiringAgentTotalScore)}
          scoreLabel="System Score"
          statusLabel={statusLabels[application.currentStatus]}
          statusTone={statusTones[application.currentStatus]}
          reviewedAt={formatDate(application.createdAt)}
          recruiterLabel="Recruiter"
          recruiterName={getRecruiterLabel(application)}
          candidateGitHubUrl={application.candidateGitHubUrl ?? undefined}
          actionLabel="Show AI Review"
          onClick={() => {
            onSelectApplication(application);
          }}
        />
      ))}
    </div>
  );
};

export default AllCandidates;
