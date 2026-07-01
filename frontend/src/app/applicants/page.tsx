export default function Applicants() {
  return (
    <>
      <section className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h2>Applicant Pipeline</h2>
            <p>Manage and screen incoming talent for the Engineering Team</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-white border border-outline-variant rounded-lg">
              <span className="text-sm">filter_icon</span>
              Advanced Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-white border border-outline-variant rounded-lg">
              <span className="text-sm">sort_icon</span>
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
    </>
  );
}
