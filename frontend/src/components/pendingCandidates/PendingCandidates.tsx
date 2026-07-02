import ApplicantCard from "@/app/applicants/components/applicant-card";
import { ListFilter, ListOrdered, X } from "lucide-react";
import React from "react";

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

      <div className="space-y-10">
        {/* Today section */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Today
            </h3>
            <div className="h-[1px] flex-1 bg-border"></div>
            <span className="text-[12px] text-muted-foreground font-medium">
              3 New Applicants
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ApplicantCard
              name="Sarah Jenkins"
              institute="BSc Computer Science • 3 Years Exp"
              grades={[
                { subject: "Maths", mark: 88 },
                { subject: "Prog", mark: 92 },
                { subject: "IT", mark: 79 },
              ]}
              systemScore={86.3}
            />
            <ApplicantCard
              name="Neo Rankapole"
              institute="BSc Computer Science • 1 Years Exp"
              grades={[
                { subject: "Maths", mark: 97 },
                { subject: "Prog", mark: 99 },
                { subject: "IT", mark: 99 },
              ]}
              systemScore={99.65}
            />
            <ApplicantCard
              name="Jake Benkins"
              institute="BSc Computer Science • 3 Years Exp"
              grades={[
                { subject: "Maths", mark: 83 },
                { subject: "Prog", mark: 78 },
                { subject: "IT", mark: 60 },
              ]}
              systemScore={86.3}
            />
          </div>
        </section>

        {/* Week section */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              This Week
            </h3>
            <div className="h-[1px] flex-1 bg-border"></div>
            <span className="text-[12px] text-muted-foreground font-medium">
              12 Applicants
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ApplicantCard
              name="Sarah Jenkins"
              institute="BSc Computer Science • 3 Years Exp"
              grades={[
                { subject: "Maths", mark: 88 },
                { subject: "Prog", mark: 92 },
                { subject: "IT", mark: 79 },
              ]}
              systemScore={86.3}
            />
            <div className="flex items-center justify-center py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground font-medium hover:bg-muted transition-colors cursor-pointer">
              Load 11 More Applicants
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PendingCandidates;
