import React from "react";
import CandidateCard from "../candidateCard/CandidateCard";

const AllCandidates = () => {
  return (
    <div className="flex flex-col gap-2">
      <CandidateCard />
      <CandidateCard />
      <CandidateCard />
      <CandidateCard />
      <CandidateCard />
    </div>
  );
};

export default AllCandidates;
