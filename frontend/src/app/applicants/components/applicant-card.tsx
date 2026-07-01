export default function ApplicantCard() {
  return (
    <>
      <div
        className="flex items-center gap-6 p-card-padding bg-surface-white rounded-xl custom-shadow card-hover transition-soft cursor-pointer border-l-4 border-status-success"
      >
        <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center text-primary font-bold text-xl">
          SJ
        </div>
        <div className="flex-1">
          <h4 className="text-card-heading">Sarah Jenkins</h4>
          <p className="text-sm">
            BSc Computer Science • 3 Years Exp
          </p>
        </div>
        <div className="flex gap-8 px-8 border-x border-outline-variant/20">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant mb-1">
              Maths
            </p>
            <p className="font-bold text-grade-strong">88</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant mb-1">
              Prog
            </p>
            <p className="font-bold text-grade-strong">92</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant mb-1">
              IT
            </p>
            <p className="font-bold text-grade-strong">79</p>
          </div>
        </div>
        <div className="flex items-center gap-4 min-w-[120px] justify-end">
          <div className="text-right mr-4">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              System Score
            </p>
            <p className="text-[24px] font-black text-primary">
              86.3
            </p>
          </div>
          <div className="flex gap-2 ">
            <button className="w-10 h-10 rounded-full flex items-center justify-center">
              <span className="">accept</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center">
              <span className="">close</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
