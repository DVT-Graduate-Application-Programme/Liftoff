import React from "react";
import ApplicantCard from "@/components/applicant-card/applicant-card";
import type { CandidateApplication } from "@/types/candidate";
import {
  formatDate,
  statusLabels,
  statusTones,
  toScorePercent,
} from "./candidate-list-utils";

type AcceptedCandidatesProps = {
  applications: CandidateApplication[];
  onSelectApplication: (application: CandidateApplication) => void;
};

function AcceptedCandidates({
  applications,
  onSelectApplication,
}: AcceptedCandidatesProps) {
  if (applications.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No accepted candidates yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {applications.map((application) => (
        <ApplicantCard
          key={application.applicationId}
          name={application.candidateName}
          institute={application.cvSummary}
          systemScore={toScorePercent(application.hiringAgentTotalScore)}
          statusLabel={statusLabels[application.currentStatus]}
          statusTone={statusTones[application.currentStatus]}
          reviewedAt={formatDate(application.createdAt)}
          actionLabel="Details"
          onClick={() => {
            onSelectApplication(application);
          }}
        />
      ))}
    </div>
  );
}

export default AcceptedCandidates;
