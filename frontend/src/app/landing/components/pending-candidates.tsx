import { ListFilter, ListOrdered, X } from "lucide-react";
import { ApplicantList } from "./applicant-list";

const PendingCandidates = () => {
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

      <ApplicantList status="PENDING,PROCESSING" emptyTitle="No pending applicants" showReviewedAt={false} />
    </>
  );
};

export default PendingCandidates;
