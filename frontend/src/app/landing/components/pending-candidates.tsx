import ApplicantCard from "@/components/applicant-card/applicant-card";
import type { CandidateApplication } from "@/types/candidate";
import { ListFilter, ListOrdered, X } from "lucide-react";
import React from "react";
import {
  formatDate,
  statusLabels,
  statusTones,
  toScorePercent,
} from "./candidate-list-utils";

type PendingCandidatesProps = {
  applications: CandidateApplication[];
  onSelectApplication: (application: CandidateApplication) => void;
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};
const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const daysSinceMonday = (day + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

type DateBucket = "today" | "thisWeek" | "lastWeek" | "older";

const getDateBucket = (createdAt: string): DateBucket => {
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return "older";

  const today = startOfToday();
  const startOfThisWeek = getStartOfWeek(today);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  if (createdDate >= today) return "today";
  if (createdDate >= startOfThisWeek) return "thisWeek";
  if (createdDate >= startOfLastWeek) return "lastWeek";
  return "older";
};

const renderCandidate = (
  application: CandidateApplication,
  onSelectApplication: (application: CandidateApplication) => void,
) => (
  <ApplicantCard
    key={application.applicationId}
    name={application.candidateName}
    institute={application.cvSummary}
    systemScore={toScorePercent(application.hiringAgentTotalScore)}
    statusLabel={statusLabels[application.currentStatus]}
    statusTone={statusTones[application.currentStatus]}
    reviewedAt={formatDate(application.createdAt)}
    showReviewedAt={false}
    createdAt={application.createdAt}
    onClick={() => {
      onSelectApplication(application);
    }}
  />
);

const PendingCandidates = ({
  applications,
  onSelectApplication,
}: PendingCandidatesProps) => {
  const groupedCandidates = applications.reduce(
    (groups, application) => {
      groups[getDateBucket(application.createdAt)].push(application);
      return groups;
    },
    {
      today: [] as CandidateApplication[],
      thisWeek: [] as CandidateApplication[],
      lastWeek: [] as CandidateApplication[],
      older: [] as CandidateApplication[],
    },
  );

  return (
    <>
      <section className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Applicant Pipeline
            </h2>
            <p className="text-muted-foreground">
              Manage and screen incoming talent for the Engineering Team
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors">
              <ListFilter size={16} />
              Advanced Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors">
              <ListOrdered size={16} />
              Sort: Higher System Score
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[12px] font-bold border border-primary/20 flex items-center gap-1">
            Score: 70+
            <X size={14} />
          </span>
          <span className="px-3 py-1 bg-card text-muted-foreground rounded-full text-[12px] font-medium border border-border">
            Degree: BSc Computer Science
          </span>
          <span className="px-3 py-1 bg-card text-muted-foreground rounded-full text-[12px] font-medium border border-border">
            Experience: 2+ Years
          </span>
          <button className="text-primary text-[12px] font-bold ml-2">
            Clear all
          </button>
        </div>
      </section>

      <div className="space-y-10">
        {/* Today section */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Today
            </h3>
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-[12px] text-muted-foreground font-medium">
              {groupedCandidates.today.length} New Applicants
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {groupedCandidates.today.length > 0 ? (
              groupedCandidates.today.map((application) =>
                renderCandidate(application, onSelectApplication),
              )
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No pending applicants received today.
              </p>
            )}
          </div>
        </section>

        {/* Week section */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              This Week
            </h3>
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-[12px] text-muted-foreground font-medium">
              {groupedCandidates.thisWeek.length} Applicants
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {groupedCandidates.thisWeek.length > 0 ? (
              groupedCandidates.thisWeek.map((application) =>
                renderCandidate(application, onSelectApplication),
              )
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No pending applicants from earlier this week.
              </p>
            )}
          </div>
        </section>

        {/* Last week section */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Last Week
            </h3>
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-[12px] text-muted-foreground font-medium">
              {groupedCandidates.lastWeek.length} Applicants
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {groupedCandidates.lastWeek.length > 0 ? (
              groupedCandidates.lastWeek.map((application) =>
                renderCandidate(application, onSelectApplication),
              )
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No pending applicants from last week.
              </p>
            )}
          </div>
        </section>

        {/* Older section */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Older
            </h3>
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-[12px] text-muted-foreground font-medium">
              {groupedCandidates.older.length} Applicants
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {groupedCandidates.older.length > 0 ? (
              groupedCandidates.older.map((application) =>
                renderCandidate(application, onSelectApplication),
              )
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No older pending applicants.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default PendingCandidates;
