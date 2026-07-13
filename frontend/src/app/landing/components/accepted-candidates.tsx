"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CandidateApplication } from "@/types/candidate";
import { ApplicantList } from "./applicant-list";
import { toScorePercent } from "./candidate-list-utils";

type ScoreFilter = "all" | "80" | "70" | "60";
type RecruiterFilter = "all" | "assigned" | "unassigned";
type SortOption = "score-desc" | "score-asc" | "newest" | "oldest" | "name-asc";

const scoreFilterLabels: Record<ScoreFilter, string> = {
  all: "Any score",
  "80": "80+",
  "70": "70+",
  "60": "60+",
};

const recruiterFilterLabels: Record<RecruiterFilter, string> = {
  all: "Any recruiter",
  assigned: "Assigned",
  unassigned: "Unassigned",
};

const sortLabels: Record<SortOption, string> = {
  "score-desc": "Highest score",
  "score-asc": "Lowest score",
  newest: "Newest first",
  oldest: "Oldest first",
  "name-asc": "Name A-Z",
};

function AcceptedCandidates() {
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("70");
  const [recruiterFilter, setRecruiterFilter] = useState<RecruiterFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("score-desc");

  const filterApplications = useMemo(
    () => (applications: CandidateApplication[]) =>
      applications.filter((application) => {
        const scorePercent = toScorePercent(application.hiringAgentTotalScore);
        const meetsScoreFilter =
          scoreFilter === "all" ? true : scorePercent >= Number(scoreFilter);
        const isAssigned = Boolean(
          application.shortlistedByRecruiterId ?? application.claimedByRecruiterId,
        );
        const meetsRecruiterFilter =
          recruiterFilter === "all"
            ? true
            : recruiterFilter === "assigned"
              ? isAssigned
              : !isAssigned;

        return meetsScoreFilter && meetsRecruiterFilter;
      }),
    [recruiterFilter, scoreFilter],
  );

  const sortApplications = useMemo(
    () => (applications: CandidateApplication[]) =>
      [...applications].sort((left, right) => {
        switch (sortBy) {
          case "score-asc":
            return left.hiringAgentTotalScore - right.hiringAgentTotalScore;
          case "newest":
            return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
          case "oldest":
            return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
          case "name-asc":
            return left.candidateName.localeCompare(right.candidateName);
          case "score-desc":
          default:
            return right.hiringAgentTotalScore - left.hiringAgentTotalScore;
        }
      }),
    [sortBy],
  );

  const activeFilters = [
    scoreFilter !== "all"
      ? {
          label: `Score: ${scoreFilterLabels[scoreFilter]}`,
          onClear: () => {
            setScoreFilter("all");
          },
        }
      : null,
    recruiterFilter !== "all"
      ? {
          label: `Recruiter: ${recruiterFilterLabels[recruiterFilter]}`,
          onClear: () => {
            setRecruiterFilter("all");
          },
        }
      : null,
    sortBy !== "score-desc"
      ? {
          label: `Sort: ${sortLabels[sortBy]}`,
          onClear: () => {
            setSortBy("score-desc");
          },
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; onClear: () => void }>;

  return (
    <>
      <section className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Accepted Applicants</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Narrow the shortlist and reorder it by the signal that matters most.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-36">
              <Select
                value={scoreFilter}
                onValueChange={(value) => {
                  setScoreFilter(value as ScoreFilter);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Score filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any score</SelectItem>
                  <SelectItem value="80">80+ score</SelectItem>
                  <SelectItem value="70">70+ score</SelectItem>
                  <SelectItem value="60">60+ score</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-40">
              <Select
                value={recruiterFilter}
                onValueChange={(value) => {
                  setRecruiterFilter(value as RecruiterFilter);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Recruiter filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any recruiter</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-40">
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value as SortOption);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort accepted" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score-desc">Highest score</SelectItem>
                  <SelectItem value="score-asc">Lowest score</SelectItem>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge key={filter.label} variant="outline" className="gap-1.5 px-3 py-1">
                {filter.label}
                <button type="button" onClick={filter.onClear} aria-label={`Clear ${filter.label}`}>
                  <X size={12} />
                </button>
              </Badge>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs"
              onClick={() => {
                setScoreFilter("all");
                setRecruiterFilter("all");
                setSortBy("score-desc");
              }}
            >
              Clear all
            </Button>
          </div>
        )}
      </section>
      <ApplicantList
        status="shortlisted"
        emptyTitle="No accepted applicants yet"
        filterApplications={filterApplications}
        sortApplications={sortApplications}
      />
    </>
  );
}

export default AcceptedCandidates;
