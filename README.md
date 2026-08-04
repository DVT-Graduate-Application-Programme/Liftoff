# Liftoff

AI-assisted screening layer for DVT's annual graduate intake programme.

Applications arrive as emails with PDF attachments (CV + academic transcript) to a shared
recruitment mailbox. Liftoff intercepts them, extracts and evaluates the documents against
DVT's eligibility criteria, scores each candidate, and routes the result — qualified
candidates are summarised for the recruiter, clearly ineligible ones are auto-responded to,
and borderline cases are held for human review in a dashboard.

Built by the DVT Graduate Cohort 2026. See [BRD-graduate-recruitment-tool.md](BRD-graduate-recruitment-tool.md)
for the full business case and [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for the REST contract.

---

## Architecture

Four services, orchestrated by `docker-compose.yml`:

| Service | Stack | Port | Role |
|---|---|---|---|
| `frontend` | Next.js 16, React 19, Tailwind 4, shadcn/ui | 3000 | Recruiter dashboard, applicant review, manual application capture |
| `backend` | .NET 10 (Clean Architecture: Domain / Application / Infrastructure / Api) | 5000 | REST API, email polling worker, persistence, audit logging |
| `hiring-agent` | Python 3.11+, FastAPI | 8001 | Resume-to-score pipeline: PDF → structured JSON → LLM evaluation |
| `db` | PostgreSQL 16 | 5432 | Application, evaluation, recruiter-action and audit-log storage |

```
inbound email ──▶ EmailPollingWorker (backend)
                        │
                        ├──▶ POST /notify (hiring-agent) ──▶ PDF parse ──▶ LLM ──▶ score
                        │                                        │
                        │                                   GitHub signals
                        ▼
                   PostgreSQL ◀────── recruiter actions ────── frontend dashboard
```

### Backend layout

```
backend/
├── LiftOff.slnx
├── src/
│   ├── Domain/           # entities, value objects
│   ├── Application/      # use cases, DTOs
│   ├── Infrastructure/   # EF Core, repositories, external clients
│   ├── Api/
│   │   ├── EndPoints/{Applications,Dashboard}
│   │   └── BackgroundServices/EmailPollingWorker.cs
│   └── AI/
│       ├── hiring-agent/ # FastAPI evaluation service
│       └── models/
└── tests/Api.IntegrationTests
```

### Frontend layout

```
frontend/src/
├── app/{applicants,apply,history,logs,login,landing,api}
├── components/  hooks/  lib/  types/
├── auth.ts, auth.config.ts   # NextAuth v5 + Microsoft Entra ID
└── proxy.ts                  # server-side calls to the backend
```

---

## Getting started

### Prerequisites

- Docker + Docker Compose
- .NET 10 SDK (for running the backend outside Docker)
- Node.js 20+ (for running the frontend outside Docker)
- Python 3.11+ (for the hiring agent outside Docker)
- An LLM provider — either a local [Ollama](https://ollama.com) install or a Google Gemini API key

### Run everything

```bash
docker compose up --build
```

- Dashboard — http://localhost:3000
- API — http://localhost:5000
- Hiring agent — http://localhost:8001

### Run just the database and API

```bash
docker compose up --build db backend
docker compose up --build -d db backend   # detached
```

### Frontend on its own

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run test         # vitest
npm run lint
```

### Hiring agent on its own

```bash
cd backend/src/AI/hiring-agent
pip install -r requirements.txt
uvicorn main:app --port 8001
```

---

## Configuration

Environment is loaded from `.env.development`, referenced by every Compose service.

| Variable | Purpose |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials |
| `POSTGRES_HOST` / `POSTGRES_PORT` | `db` / `5432` inside Compose; `localhost` when running natively |
| `LLM_PROVIDER` | `ollama` or `gemini` |
| `DEFAULT_MODEL` | e.g. `gemma3:4b`, `qwen3:4b` (Ollama) or `gemini-2.5-flash` (Gemini) |
| `GEMINI_API_KEY` | Required when `LLM_PROVIDER=gemini` |
| `OLLAMA_HOST` / `Ollama__BaseUrl` | Ollama endpoint; defaults to `http://host.docker.internal:11434` |
| `BACKEND_BASE_URL` / `NEXT_PUBLIC_BACKEND_URL` | Service-to-service and browser-facing API URLs |
| `STORAGE_CONNECTION_STRING` | Blob storage holding uploaded CVs and transcripts. Compose defaults it to the Azurite emulator; the backend refuses to start without it |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_ISSUER` | Microsoft Entra ID OAuth app |
| `AUTH_SECRET` / `AUTH_TRUST_HOST` | NextAuth session signing |

Ollama can also run as a Compose service — the `ollama` and `ollama-init` definitions are
present in `docker-compose.yml`, currently commented out in favour of a host install.

### Document storage

Uploaded CVs and transcripts go to Azure Blob Storage, in the `cvs` and `transcripts`
containers — never to the container filesystem, which is ephemeral and loses every upload
when a replica restarts. The application record stores a `blob://{container}/{id}.pdf`
reference; `GET /api/applications/{id}/cv` resolves it and streams the file back.

Compose runs [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite)
as the local stand-in, so uploads behave the same locally as in Azure and survive
`docker compose down`. Running the API natively against it needs the emulator reachable on
localhost:

```bash
docker compose up -d azurite
export STORAGE_CONNECTION_STRING='DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;'
```

> **Secrets:** `.env.development` is committed and contains live-looking Entra ID and NextAuth
> values. Rotate them and move real credentials out of version control before this goes near
> production.

---

## API surface

Base path `/api/applications` — full request/response shapes in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

**Reads**

```
GET  /                     list all applications with tier + summary
GET  /{id}                 full application detail
GET  /{id}/applicant       applicant profile
GET  /{id}/screening       screening outcome
GET  /{id}/evaluation      AI evaluation with category scores
GET  /{id}/ownership       current recruiter ownership
GET  /{id}/cv              CV PDF (falls back to local disk)
GET  /{id}/transcript      transcript PDF (falls back to local disk)
GET  /logs                 all recruiter action logs
GET  /{id}/logs            logs for one application
```

**Recruiter actions**

```
POST /{id}/ownership/claim
POST /{id}/ownership/shortlist
POST /{id}/ownership/accept
POST /{id}/ownership/reject
POST /{id}/ownership/rate
POST /{id}/ownership/notes
```

**Hiring agent**

```
POST /notify               enqueue an application for evaluation (202 Accepted)
```

---

## Infrastructure

Terraform for two clouds under `infrastructure/`:

```
infrastructure/
├── azure/   main, compute, networking, database, secrets, monitoring
└── aws/     compute, networking, database, secrets, monitoring, IAM policy
```

Working notes on the cloud build-out are in [cloud-infrastructure-session-notes.md](cloud-infrastructure-session-notes.md).

> `terraform.tfstate` files are currently checked into the repo. Move to remote state
> (Azure Storage / S3 + DynamoDB) before multiple people apply against these stacks.

---

## Testing

```bash
cd frontend && npm run test                    # vitest + Testing Library
cd backend  && dotnet test                     # Api.IntegrationTests
cd backend/src/AI/hiring-agent && pytest       # agent tests
```

---

## Project documents

| Document | Contents |
|---|---|
| [BRD-graduate-recruitment-tool.md](BRD-graduate-recruitment-tool.md) | Business requirements, scope, NFRs, POPIA/compliance, risks |
| [sprint-plan-graduate-recruitment-tool.md](sprint-plan-graduate-recruitment-tool.md) | Sprint breakdown and delivery plan |
| [graduate-recruitment-tool-research.md](graduate-recruitment-tool-research.md) | Research compendium behind the BRD |
| [graduate-recruitment-research-feedback.md](graduate-recruitment-research-feedback.md) | Review feedback on the research |
| [cloud-infrastructure-session-notes.md](cloud-infrastructure-session-notes.md) | Terraform / cloud provisioning notes |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | REST endpoint reference |
| [frontend/AGENTS.md](frontend/AGENTS.md) | Frontend conventions |

---

## Contributing

Work branches off `development`; `main` is the release branch. Commits follow Conventional
Commits (`feat:`, `fix:`, `chore:`, `style:`, `config:`), optionally scoped
(`feat(frontend):`, `fix(backend):`). Changes land on `development` via pull request.
