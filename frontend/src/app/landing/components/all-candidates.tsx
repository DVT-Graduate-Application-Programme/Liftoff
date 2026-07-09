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
  onClaimApplication: (application: CandidateApplication) => Promise<void>;
  claimingApplicationId: string | null;
  activeRecruiterId: string;
};

const AllCandidates = ({
  applications,
  onSelectApplication,
  onClaimApplication,
  claimingApplicationId,
  activeRecruiterId,
}: AllCandidatesProps) => {
  return (
    <div className="flex flex-col gap-2">
      {applications.map((application) => {
        const isClaimedByActiveRecruiter =
          application.claimedByRecruiterId === activeRecruiterId;
        const isClaiming = claimingApplicationId === application.applicationId;

        return (
          <ApplicantCard
            key={application.applicationId}
            name={application.candidateName}
            institute={application.cvSummary}
            showInstitute={false}
            systemScore={toScorePercent(application.hiringAgentTotalScore)}
            scoreLabel="System Score"
            statusLabel={statusLabels[application.currentStatus]}
            statusTone={statusTones[application.currentStatus]}
            reviewedAt={formatDate(application.createdAt)}
            recruiterLabel="Recruiter:"
            recruiterName={getRecruiterLabel(application)}
            actionLabel="Show AI Review"
            secondaryActionLabel={
              isClaimedByActiveRecruiter ? "Claimed" : "Claim for review"
            }
            isSecondaryActionDisabled={isClaimedByActiveRecruiter || isClaiming}
            isSecondaryActionLoading={!isClaimedByActiveRecruiter && isClaiming}
            onSecondaryActionClick={
              isClaimedByActiveRecruiter
                ? undefined
                : () => {
                    void onClaimApplication(application);
                  }
            }
            onClick={() => {
              onSelectApplication(application);
            }}
          />
        );
      })}
    </div>
  );
};

export default AllCandidates;
