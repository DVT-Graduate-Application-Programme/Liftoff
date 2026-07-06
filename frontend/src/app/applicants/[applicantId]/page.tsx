import { Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
    <>
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Applicant Name
      </h1>
      <div className="w-full flex justify-center gap-10 pt-10">
        {/* Document Viewer Container */}
        <section className="flex w-full max-w-xl flex-col gap-3">
         
          <div className="flex gap-2 items-center justify-center">
            <Button variant="default">CV</Button>
            <Button variant="outline">Transcript</Button>
          </div>
          <Card className="flex-1 items-center justify-center">
            <CardContent className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                View Selected Document
              </p>
            </CardContent>
          </Card>
        </section>

        {/*Candidate INFO Container*/}
        <div className="flex w-full max-w-xl flex-col gap-4">
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
                <Label htmlFor="strength-select">Candidate Strength</Label>
                <Select name="strength">
                  <SelectTrigger id="strength-select" className="w-full">
                    <SelectValue placeholder="Weigh strength of candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strong">Strong</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Weak">Weak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                />
              </div>

              <Button className="self-end">Submit</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
