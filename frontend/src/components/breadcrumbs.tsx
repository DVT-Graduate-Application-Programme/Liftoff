"use client"

import { usePathname, useParams } from "next/navigation"
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

function ApplicantCrumb() {
  const params = useParams<{ applicantId: string }>()
  const applicantQuery = useApplicant(params.applicantId)
  const label = applicantQuery.data?.candidateName ?? "Applicant"

  return <BreadcrumbPage>{label}</BreadcrumbPage>
}

export function Breadcrumbs() {
  const pathname = usePathname()

  let trailing: React.ReactNode = null
  if (pathname === "/history") {
    trailing = <BreadcrumbPage>History</BreadcrumbPage>
  } else if (pathname.startsWith("/applicants/")) {
    trailing = <ApplicantCrumb />
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
        <BreadcrumbItem>{trailing}</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
