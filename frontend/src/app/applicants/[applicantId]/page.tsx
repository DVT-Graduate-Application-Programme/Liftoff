import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  Code2,
  GitBranch,
  MinusCircle,
  Rocket,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { findApplication } from "@/app/api/_lib/mockData";
import { notFound } from "next/navigation";

type Evaluation = NonNullable<ReturnType<typeof findApplication>>["evaluation"];
type Scores = NonNullable<Evaluation>["scores"];
type ScoreCategory = Scores[keyof Scores];

const scoreCategoryMeta: Record<
  keyof Scores,
  { label: string; icon: typeof GitBranch }
> = {
  open_source: { label: "Open Source", icon: GitBranch },
  self_projects: { label: "Self Projects", icon: Rocket },
  production: { label: "Production Experience", icon: Building2 },
  technical_skills: { label: "Technical Skills", icon: Code2 },
};

function formatBreakdownLabel(key: string) {
  return key
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function ScoreCategoryRow({
  label,
  icon: Icon,
  category,
}: {
  label: string;
  icon: typeof GitBranch;
  category: ScoreCategory;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </span>
        <span className="text-sm font-semibold">
          {category.score.toFixed(1)}
          <span className="text-muted-foreground"> / {category.max}</span>
        </span>
      </div>
      <Progress value={(category.score / category.max) * 100} />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {category.evidence}
      </p>
    </div>
  );
}

export default async function DetailedApplicantInfo({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const { applicantId } = await params;
  const application = findApplication(applicantId);

  if (!application) {
    notFound();
  }

  const { applicant, evaluation } = application;

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          {applicant.candidateName}
        </h1>
        <p className="text-sm text-muted-foreground">
          No AI evaluation is available for this applicant yet.
        </p>
      </div>
    );
  }

  const totalScore = Object.values(evaluation.scores).reduce(
    (sum, category) => sum + category.score,
    0,
  );
  const maxScore = Object.values(evaluation.scores).reduce(
    (sum, category) => sum + category.max,
    0,
  );
  const overallScore = Math.max(
    0,
    totalScore + evaluation.bonusPoints.total - evaluation.deductions.total,
  );

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground">
        {applicant.candidateName}
      </h1>
      <p className="text-sm text-muted-foreground">
        {evaluation.institution.degreeName} · {evaluation.institution.name}
      </p>
      <div className="w-full flex flex-col md:flex-row justify-center gap-10 pt-10">
        {/* Document Viewer Container */}
        <section className="flex w-full md:max-w-xl flex-col gap-3">
          <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-2">
            Applicant documents
          </h2>
          <Tabs defaultValue="cv" className="flex-1 gap-3">
            <TabsList className="self-center">
              <TabsTrigger value="cv">CV</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>
            <TabsContent value="cv" className="flex-1">
              <Card className="h-full items-center justify-center">
                <CardContent className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-muted-foreground">CV</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transcript" className="flex-1">
              <Card className="h-full items-center justify-center">
                <CardContent className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-muted-foreground">Transcript</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/*Candidate INFO Container*/}
        <div className="flex w-full md:max-w-xl flex-col gap-4">
          {/* Canidate Summary Section */}
          <section className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4" />
                  AI Summary
                </CardTitle>
                <CardAction className="flex flex-col items-end gap-1">
                  Overall Score
                  <span className="text-base font-semibold text-foreground">
                    {overallScore.toFixed(1)}
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      / {maxScore}
                    </span>
                  </span>
                </CardAction>
              </CardHeader>
              <Separator />
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-col gap-4">
                  {(Object.keys(evaluation.scores) as Array<keyof Scores>).map(
                    (key) => (
                      <ScoreCategoryRow
                        key={key}
                        label={scoreCategoryMeta[key].label}
                        icon={scoreCategoryMeta[key].icon}
                        category={evaluation.scores[key]}
                      />
                    ),
                  )}
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Award className="size-4 text-muted-foreground" />
                    Bonus Points
                    <Badge variant="secondary" className="ml-auto">
                      +{evaluation.bonusPoints.total.toFixed(1)}
                    </Badge>
                  </span>
                  <ul className="flex flex-col gap-1 pl-6 text-xs text-muted-foreground">
                    {Object.entries(evaluation.bonusPoints.breakdown).map(
                      ([key, value]) => (
                        <li key={key}>
                          {formatBreakdownLabel(key)}: +{value}
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {evaluation.deductions.reasons.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <MinusCircle className="size-4 text-muted-foreground" />
                      Deductions
                      <Badge variant="secondary" className="ml-auto">
                        -{evaluation.deductions.total.toFixed(1)}
                      </Badge>
                    </span>
                    <ul className="flex flex-col gap-1 pl-6 text-xs text-muted-foreground">
                      {evaluation.deductions.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Key Strengths</span>
                  <ul className="flex flex-col gap-2">
                    {evaluation.keyStrengths.map((strength) => (
                      <li
                        key={strength}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">
                    Areas for Improvement
                  </span>
                  <ul className="flex flex-col gap-2">
                    {evaluation.areasForImprovement.map((area) => (
                      <li
                        key={area}
                        className="flex items-center gap-2 text-sm"
                      >
                        <AlertTriangle className="size-4 shrink-0 text-muted-foreground" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Candidate Rating section*/}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Review</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="potential-select">Potential Candidate</Label>
                  <Select name="potential">
                    <SelectTrigger id="potential-select" className="w-full">
                      <SelectValue placeholder="Is this a potential candidate?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="Maybe">Maybe</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="tier-select">Candidate Tier</Label>
                  <Select name="tier">
                    <SelectTrigger id="tier-select" className="w-full">
                      <SelectValue placeholder="Weigh the candidate by tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Strong">Strong</SelectItem>
                      <SelectItem value="Borderline">Borderline</SelectItem>
                      <SelectItem value="Weak">Weak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button>Submit</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
