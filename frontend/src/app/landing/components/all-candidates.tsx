"use client";

import { ListFilter, ListOrdered, X } from "lucide-react";
import { ApplicantList } from "./applicant-list";

const AllCandidates = () => {
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
      <ApplicantList emptyTitle="No applicants yet" enableClaim />
    </>
  );
};

export default AllCandidates;
