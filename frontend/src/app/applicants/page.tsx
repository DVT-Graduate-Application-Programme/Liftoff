import ApplicantCard from "./components/applicant-card";
import { ListFilter, ListOrdered } from "lucide-react";

export default function Applicants() {
  return (
    <>
      {/* Heading + Filters */}
      <section className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h2>Applicant Pipeline</h2>
            <p>Manage and screen incoming talent for the Engineering Team</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-white border border-outline-variant rounded-lg">
            <ListFilter size={16}/>
              Advanced Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-white border border-outline-variant rounded-lg">
              <ListOrdered size={16}/>
              Sort: Higher System Score
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[12px] font-bold border border-primary/20 flex items-center gap-1">
            Score: 70+{" "}
            <span className="material-symbols-outlined text-[14px]">close</span>
          </span>
          <span className="px-3 py-1 bg-surface-white text-on-surface-variant rounded-full text-[12px] font-medium border border-outline-variant">
            Degree: BSc Computer Science
          </span>
          <span className="px-3 py-1 bg-surface-white text-on-surface-variant rounded-full text-[12px] font-medium border border-outline-variant">
            Experience: 2+ Years
          </span>
          <button className="text-primary text-[12px] font-bold ml-2">
            Clear all
          </button>
        </div>
      </section>

      <div className="space-y-section-gap">
        {/* Today section */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-on-surface-variant uppercase">Today</h3>
            <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            <span className="text-[12px] text-on-surface-variant font-medium">
              3 New Applicants
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ApplicantCard />
          </div>
        </section>

        {/* Week section */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-on-surface-variant uppercase">This Week</h3>
            <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            <span className="text-[12px] text-on-surface-variant font-medium">
              12 Applicants
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ApplicantCard />
            <div className="flex items-center justify-center py-8 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant font-medium hover:bg-surface-container-low transition-colors cursor-pointer">
              Load 11 More Applicants
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
