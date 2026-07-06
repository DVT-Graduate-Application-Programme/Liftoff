import { Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function DetailedApplicantInfo() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground">
        Applicant Name
      </h1>
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
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Rerum fugit enim tempore, quibusdam ad facere officiis quas,
                  sint explicabo eum voluptatem placeat esse in dolor tempora et
                  velit vero consectetur!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {["Skill 1", "Skill 2", "Skill 3", "Skill 4"].map((skill) => (
                    <li key={skill} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-primary" />
                      {skill}
                    </li>
                  ))}
                </ul>
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
