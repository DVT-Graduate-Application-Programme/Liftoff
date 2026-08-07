"use client"

import { useSyncExternalStore } from "react"
import { usePathname, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useApplicant } from "@/hooks/use-applicant"

const TAB_LABELS: Record<string, string> = {
  pending: "Pending Candidates",
  all: "All Candidates",
  accepted: "Accepted Candidates",
  history: "History",
  logs: "Recruiter Logs",
}

const TAB_HREFS: Record<string, string> = {
  history: "/history",
  logs: "/logs",
}

function tabHref(from: string) {
  return TAB_HREFS[from] ?? `/landing?tab=${from}`
}

function subscribeNever() {
  return () => {}
}

// Cached query data can already be available on the client's first render (e.g. after a
// client-side navigation) while the server has no way to know about it, which would
// mismatch the server-rendered fallback. useSyncExternalStore's getServerSnapshot forces
// the first client render to agree with the server; the real value follows right after.
function useHasMounted() {
  return useSyncExternalStore(subscribeNever, () => true, () => false)
}

function ApplicantCrumb() {
  const params = useParams<{ applicantId: string }>()
  const applicantQuery = useApplicant(params.applicantId)
  const hasMounted = useHasMounted()

  const label = hasMounted ? (applicantQuery.data?.candidateName ?? "Applicant") : "Applicant"

  return <BreadcrumbPage>{label}</BreadcrumbPage>
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  let trailing: React.ReactNode = null
  let tabCrumb: React.ReactNode = null
  if (pathname === "/history") {
    trailing = <BreadcrumbPage>History</BreadcrumbPage>
  } else if (pathname === "/logs") {
    trailing = <BreadcrumbPage>Recruiter Logs</BreadcrumbPage>
  } else if (pathname.startsWith("/applicants/")) {
    trailing = <ApplicantCrumb />
    const from = searchParams.get("from")
    const tabLabel = from ? TAB_LABELS[from] : undefined
    if (from && tabLabel) {
      tabCrumb = (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={tabHref(from)}>{tabLabel}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </>
      )
    }
  } else {
    return null
  }

  return (
    <Breadcrumb className="sticky top-16 z-20 border-b bg-background px-4 py-2 sm:px-6 lg:px-8">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/landing">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {tabCrumb}
        <BreadcrumbItem>{trailing}</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
