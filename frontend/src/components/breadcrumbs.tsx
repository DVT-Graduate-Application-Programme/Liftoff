"use client"

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
}

function ApplicantCrumb() {
  const params = useParams<{ applicantId: string }>()
  const applicantQuery = useApplicant(params.applicantId)
  const label = applicantQuery.data?.candidateName ?? "Applicant"

  return <BreadcrumbPage>{label}</BreadcrumbPage>
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  let trailing: React.ReactNode = null
  let tabCrumb: React.ReactNode = null
  if (pathname === "/history") {
    trailing = <BreadcrumbPage>History</BreadcrumbPage>
  } else if (pathname.startsWith("/applicants/")) {
    trailing = <ApplicantCrumb />
    const from = searchParams.get("from")
    const tabLabel = from ? TAB_LABELS[from] : undefined
    if (from && tabLabel) {
      tabCrumb = (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/landing?tab=${from}`}>{tabLabel}</Link>
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
    <Breadcrumb className="border-b px-4 py-2 sm:px-6 lg:px-8">
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
