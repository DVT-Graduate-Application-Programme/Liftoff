import { Check, X } from "lucide-react";

type ApplicantCardProps = {
  name: string;
  institute: string;
  academicAverage: number;
  systemScore: number;
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-chart-4";
  return "text-destructive";
}

function getScoreBorderColor(score: number) {
  if (score >= 80) return "border-primary";
  if (score >= 60) return "border-chart-4";
  return "border-destructive";
}

export default function ApplicantCard({
  name,
  institute,
  academicAverage,
  systemScore,
}: ApplicantCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`group flex items-center gap-6 p-6 bg-card rounded-xl border border-border border-l-4 shadow-sm transition-all hover:shadow-md cursor-pointer ${getScoreBorderColor(
        systemScore,
      )}`}
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
        {initials}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-foreground">{name}</h4>
        <p className="text-sm text-muted-foreground">{institute}</p>
      </div>
      <div className="flex w-28 justify-center px-8 border-x border-border">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Acad. Avg
          </p>
          <p
            className={`text-[24px] font-black leading-none tabular-nums ${getScoreColor(
              academicAverage,
            )}`}
          >
            {academicAverage}%
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 min-w-30 justify-end">
        <div className="text-right mr-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            System Score
          </p>
          <p className={`text-[24px] font-black ${getScoreColor(systemScore)}`}>
            {systemScore}
          </p>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center">
            <Check size={18} />
          </button>
          <button className="w-10 h-10 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
