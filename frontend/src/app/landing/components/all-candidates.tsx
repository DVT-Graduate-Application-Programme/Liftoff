import React from "react";
import { ListFilter, ListOrdered, X } from "lucide-react";
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
    <>
      <section className="mb-8 flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              All Applicants
            </h2>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-foreground transition-colors hover:bg-muted">
              <ListFilter size={16} />
              Advanced Filters
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-foreground transition-colors hover:bg-muted">
              <ListOrdered size={16} />
              Sort: Higher System Score
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">
            Score: 70+
            <X size={14} />
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground">
            Degree: BSc Computer Science
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground">
            Experience: 2+ Years
          </span>
          <button className="ml-2 text-[12px] font-bold text-primary">
            Clear all
          </button>
        </div>
      </section>
      <div className="flex flex-col gap-2">
        {applications.map((application) => {
          const isClaimedByActiveRecruiter =
            application.claimedByRecruiterId === activeRecruiterId;
          const isClaiming =
            claimingApplicationId === application.applicationId;

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
              isSecondaryActionDisabled={
                isClaimedByActiveRecruiter || isClaiming
              }
              isSecondaryActionLoading={
                !isClaimedByActiveRecruiter && isClaiming
              }
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
    </>
  );
};

export default AllCandidates;
