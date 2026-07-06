import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { CloseApplicantDetailsSidebarButton } from "./applicant-details-sidebar-controls";

export function ApplicantDetailsSidebar() {
  return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      className="top-16 h-auto font-sans text-sidebar-foreground"
    >
      <SidebarContent className="py-2">
        <SidebarGroup className="flex h-full min-h-0 flex-1 flex-col p-5">
          <div className="flex flex-1 flex-col justify-evenly gap-8">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-heading text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Resume evaluation results for
                </p>
                <p className="font-heading text-2xl font-semibold text-sidebar-foreground leading-tight">
                  Name
                </p>
              </div>
              <CloseApplicantDetailsSidebarButton />
            </div>
            <div className="space-y-4 rounded-md border border-sidebar-border bg-sidebar-accent/20 p-5 text-base">
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium">Overall Score</span>
                <span className="font-mono text-lg font-semibold">71.0/100</span>
              </p>
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium">Open Source</span>
                <span className="font-mono">10.0/35</span>
              </p>
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium">Self Projects</span>
                <span className="font-mono">28.0/30</span>
              </p>
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium">Production Experience</span>
                <span className="font-mono">20.0/25</span>
              </p>
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium">Technical Skills</span>
                <span className="font-mono">8.0/10</span>
              </p>
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium">Bonus Points</span>
                <span className="font-mono">5.0</span>
              </p>
            </div>
            <div className="space-y-3">
              <p className="font-heading text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Key strengths
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-base leading-7">
                <li>Full-Stack Development Skills</li>
                <li>Agile Development Experience</li>
                <li>Database Design and API Development</li>
                <li>React.js Expertise</li>
              </ol>
            </div>
          </div>
          <Button type="button" className="mt-6 h-11 w-full text-base font-medium">
            View CV and Transcript
          </Button>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

// ================================================================================

// 📊 RESUME EVALUATION RESULTS FOR: Alex Morgan

// ================================================================================

// 🎯 OVERALL SCORE: 71.0/100

// 📈 DETAILED SCORES:

// ------------------------------------------------------------

// 🌐 Open Source:          10.0/35

//    Evidence: Contributed to personal GitHub projects (taskflow, weatherwise, budgetbuddy). No evidence of contributions to other people's open source projects.

// 🚀 Self Projects:        28.0/30

//    Evidence: Developed three complex projects: TaskFlow (collaborative task board with REST API and PostgreSQL), WeatherWise (responsive weather app consuming a public API), and Budget Buddy (personal finance tracker with command-line and web interfaces).  All projects have active GitHub links.

// 🏢 Production Experience: 20.0/25

//    Evidence: Internship at Brightleaf Technologies involved building and shipping features for an internal inventory management tool, fixing bugs, writing tests, and participating in Agile development practices.

// 💻 Technical Skills:     8.0/10

//    Evidence: Proficient in Python, JavaScript (ES6+), TypeScript, SQL, React, Node.js, Django, REST APIs, Git/GitHub, Docker (basic), CI/CD (GitHub Actions). Demonstrated knowledge of databases like PostgreSQL and MySQL.

// ⭐ BONUS POINTS: 5.0

// ------------------------------

//    GSoC participation + GitHub portfolio

// ✅ KEY STRENGTHS:

// ------------------------------

//   1. Full-Stack Development Skills

//   2. Agile Development Experience

//   3. Database Design and API Development

//   4. React.js Expertise

// 🔧 AREAS FOR IMPROVEMENT:

// ------------------------------

//   1. Limited Open Source Contributions

//   2. Lack of Formal Certifications
