import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface Recruiter {
  id: string;
  identityId: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  fullName: string;
}

export function useRecruiters() {
  return useQuery({
    queryKey: queryKeys.recruiters(),
    queryFn: () => apiFetch<Recruiter[]>("/api/applications/recruiter"),
  });
}
