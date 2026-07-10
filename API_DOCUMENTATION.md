# Graduate Recruitment API Documentation

This document outlines the REST API endpoints available for the Graduate Recruitment Dashboard POC. The backend is running on `http://localhost:8080` (or `http://localhost:5000` via local dotnet run). also run the databse container if testing on local machine

docker compose up --build db backend
docker compose up --build -d db backend (to build with detached terminal)
## Base URL
`/api/applications`

---

## 1. Get All Applications
**Endpoint:** `GET /`

Returns a list of all parsed candidate applications, including their evaluation tier and summary data.

**Response:**
```json
[
  {
    "id": "a1000000-0000-0000-0000-000000000001",
    "emailMessageId": "seed-msg-001",
    "candidateName": "Sarah Chen",
    "candidateEmail": "sarah.chen@example.com",
    "candidateGitHubUrl": "https://github.com/sarahc",
    "status": "evaluated",
    "tier": "Strong",
    "hardGatePassed": true,
    "hiringAgentTotalScore": 92.5,
    "hiringAgentExplanation": "Exceptional full-stack candidate...",
    "cvSummary": "BSc Computer Science, Imperial College London...",
    "flagsJson": ["Strong cloud experience", "Internship at AWS"],
    "createdAt": "2026-07-06T10:00:00Z",
    "updatedAt": "2026-07-06T10:00:00Z"
  }
]
```

---

## 2. Get Application Details
**Endpoint:** `GET /{id}`

Returns the high-level status and details of a specific application.

**Response:**
```json
{
  "id": "a1000000-0000-0000-0000-000000000001",
  "status": "evaluated",
  "tier": "Strong",
  "createdAt": "2026-07-06T10:00:00Z",
  "updatedAt": "2026-07-06T10:00:00Z"
}
```

---

## 3. Get Applicant Information
**Endpoint:** `GET /{id}/applicant`

Returns the applicant's personal and contact information.

**Response:**
```json
{
  "candidateName": "Sarah Chen",
  "candidateEmail": "sarah.chen@example.com",
  "candidateGitHubUrl": "https://github.com/sarahc"
}
```

---

## 4. Get Hard Gate Screening Results
**Endpoint:** `GET /{id}/screening`

Returns the automated screening result (whether they passed the minimum requirements) and the reason.

**Response:**
```json
{
  "hardGatePassed": true,
  "hardGateReason": "Meets 2:1 degree requirement."
}
```

---

## 5. Get Hiring Agent Evaluation
**Endpoint:** `GET /{id}/evaluation`

Returns the detailed breakdown of the AI agent's evaluation, including specific scores, project analysis, and feedback.

**Response:**
```json
{
  "id": "e1000000-...",
  "applicationRecordId": "a1000000-...",
  "tier": "Strong",
  "totalScore": 92.5,
  "explanation": "Exceptional full-stack candidate...",
  "aiSummary": "AI Summary: The candidate demonstrates clear strengths in technical execution...",
  "cvSummary": "BSc Computer Science...",
  "flagsJson": ["Strong cloud experience", "Internship at AWS"],
  "educationJson": { "degree": "BSc", "university": "Imperial College London" },
  "experienceJson": { "roles": ["Intern at AWS"] },
  "projectsJson": { "self_projects": "Built chat app" },
  "keyStrengthsJson": ["AWS", "React"],
  "areasForImprovementJson": ["No Angular"],
  "processedAt": "2026-07-06T10:00:00Z"
}
```

---

## 6. Get Application Ownership
**Endpoint:** `GET /{id}/ownership`

Returns the recruiter ownership state, shortlist status, and rating details.

**Response:**
```json
{
  "claimedByRecruiterId": "recruiter-123",
  "claimedAt": "2026-07-06T10:00:00Z",
  "shortlistedByRecruiterId": "recruiter-123",
  "shortlistedAt": "2026-07-07T10:00:00Z",
  "recruiterRating": 5,
  "recruiterRatingNote": "Great cultural fit",
  "ratedByRecruiterId": "recruiter-123",
  "ratedAt": "2026-07-07T10:00:00Z"
}
```

---

## 7. Claim Application Ownership
**Endpoint:** `POST /{id}/ownership/claim`

Allows a recruiter to take ownership of reviewing an application.

**Request Body:**
```json
{
  "recruiterIdentity": "recruiter-123"
}
```

**Response:**
```json
{
  "claimedByRecruiterId": "recruiter-123",
  "claimedAt": "2026-07-10T10:00:00Z"
}
```

---

## 8. Shortlist Application
**Endpoint:** `POST /{id}/ownership/shortlist`

Allows a recruiter to shortlist an application for the next phase.

**Request Body:**
```json
{
  "recruiterIdentity": "recruiter-123",
  "reason": "Strong interview performance"
}
```

**Response:**
```json
{
  "shortlistedByRecruiterId": "recruiter-123",
  "shortlistedAt": "2026-07-10T10:00:00Z",
  "updatedStatus": "shortlisted"
}
```

---

## 9. Accept Application
**Endpoint:** `POST /{id}/ownership/accept`

Allows a recruiter to formally accept an application.

**Request Body:**
```json
{
  "recruiterIdentity": "recruiter-123",
  "reason": "Passed final review"
}
```

**Response:**
```json
{
  "actionedByRecruiterId": "recruiter-123",
  "actionedAt": "2026-07-10T10:00:00Z",
  "updatedStatus": "ACCEPTED"
}
```

---

## 10. Reject Application
**Endpoint:** `POST /{id}/ownership/reject`

Allows a recruiter to reject an application.

**Request Body:**
```json
{
  "recruiterIdentity": "recruiter-123",
  "reason": "Lacks required experience"
}
```

**Response:**
```json
{
  "actionedByRecruiterId": "recruiter-123",
  "actionedAt": "2026-07-10T10:00:00Z",
  "updatedStatus": "REJECTED"
}
```

---

## 11. Rate Application
**Endpoint:** `POST /{id}/ownership/rate`

Allows a recruiter to leave a 1-5 star rating and notes on a candidate.

**Request Body:**
```json
{
  "recruiterIdentity": "recruiter-123",
  "rating": 5,
  "notes": "Excellent communication skills"
}
```

**Response:**
```json
{
  "recruiterRating": 5,
  "recruiterRatingNote": "Excellent communication skills",
  "ratedByRecruiterId": "recruiter-123",
  "ratedAt": "2026-07-10T10:00:00Z"
}
```

---

## 12. Add Recruiter Notes
**Endpoint:** `POST /{id}/ownership/notes`

Allows a recruiter to add notes to an application without changing the 1-5 star rating.

**Request Body:**
```json
{
  "recruiterIdentity": "recruiter-123",
  "notes": "Candidate requested relocation assistance."
}
```

**Response:**
```json
{
  "recruiterRating": null,
  "recruiterRatingNote": "Candidate requested relocation assistance.",
  "ratedByRecruiterId": "recruiter-123",
  "ratedAt": "2026-07-10T10:00:00Z"
}
```

---

## 13. View Candidate CV (PDF)
**Endpoint:** `GET /{id}/cv`

Returns the original PDF file of the candidate's Resume/CV. 

> [!NOTE]
> This endpoint serves the raw binary `application/pdf` file, so it should be used as the `src` for `<embed>`, `<iframe>`, or object tags in the frontend, or opened in a new tab.

---

## 14. View Candidate Transcript (PDF)
**Endpoint:** `GET /{id}/transcript`

Returns the original PDF file of the candidate's Academic Transcript.

> [!NOTE]
> This endpoint serves the raw binary `application/pdf` file.
