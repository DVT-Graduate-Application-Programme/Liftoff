import { ApplicantList } from "./applicant-list";

function AcceptedCandidates() {
  return <ApplicantList status="SHORTLISTED" emptyTitle="No accepted applicants yet" />;
}

export default AcceptedCandidates;
