import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { CloseApplicantDetailsSidebarButton } from "./applicant-details-sidebar-controls";

export function ApplicantDetailsSidebar() {
  return (
    <Sidebar side="right" collapsible="offcanvas" className="top-16 h-auto">
      <SidebarContent>
        <SidebarGroup>
          <CloseApplicantDetailsSidebarButton />
          <div className="mb-2 flex flex-col items-center justify-around gap-4">
            <p className="text-sm font-semibold">
              RESUME EVALUATION RESULTS FOR: Name
            </p>
            <p className="text-sm font-semibold">Overall Score : 71.0/100</p>
            <p className="text-sm font-semibold">Open Source: 10.0/35</p>
            <p className="text-sm font-semibold">Self Projects: 28.0/30</p>
            <p className="text-sm font-semibold">
              Production Experience: 20.0/25
            </p>
            <p className="text-sm font-semibold">Technical Skills: 8.0/10</p>
            <p className="text-sm font-semibold">BONUS POINTS: 5.0</p>
            <ol type="1">
              <li>Full-Stack Development Skills</li>
              <li>Agile Development Experience</li>
              <li>Database Design and API Development</li>
              <li>React.js Expertise</li>
            </ol>
            <button>View CV and Transcript</button>
          </div>
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
