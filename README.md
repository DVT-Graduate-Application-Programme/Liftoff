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

Environment is loaded from `.env.development`, referenced by every Compose service. The
production counterpart is `.env.production`, which is never committed — see
`.env.production.example` for the variables it needs and the [Environments](#environments)
section for how the two stacks differ.

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

## Environments

Two deployment environments, separated end to end. Production is defined but **not yet
created on Azure** — the configuration is complete and waiting on the first apply.

| | development | production |
|---|---|---|
| Branch | `development` | `main` |
| Azure | `rg-liftoff-dev` (live) | `rg-liftoff-prod` (not created) |
| Terraform workspace | `default` | `prod` |
| Image target | `development` | `production` |
| Image tag | `dev-<sha>` | `prod-<sha>` |
| Deploy workflow | [development-deploy-azure.yml](.github/workflows/development-deploy-azure.yml) | [production-deploy-azure.yml](.github/workflows/production-deploy-azure.yml) (gated) |
| Local stack | `docker-compose.yml` | `docker-compose.prod.yml` |
| Config | `.env.development` (committed) | Azure Key Vault, at run time |

**Dockerfiles.** Each service's Dockerfile has a `development` and a `production` target off
a shared build stage, so the two can only differ in how they run — not in what they compile:

| | development | production |
|---|---|---|
| backend / worker | `ASPNETCORE_ENVIRONMENT=Development` — Scalar UI, OpenAPI document, developer exception page | `Production` — none of those, diagnostics off |
| frontend | `next dev`, hot reload | standalone build, non-root, `NODE_ENV=production` |
| hiring agent | `uvicorn --reload`, `DEVELOPMENT_MODE=True` (evaluation CSV + extraction cache) | no reload, non-root, `DEVELOPMENT_MODE=False` |

`production` is the last stage in every file, so a bare `docker build` is prod-safe by
default. `docker compose up` is unaffected — it names the `development` target explicitly.

**Infrastructure.** Every dev/prod difference — database tier, replica counts, backup
retention, storage redundancy, Key Vault purge protection, the resource group lock — is
declared in one map in
[`infrastructure/azure/environments.tf`](infrastructure/azure/environments.tf). The resource
files read `local.env.<setting>` and are otherwise environment-agnostic.

**Deploys.** Both environments run the same pipeline
([deploy-azure.yml](.github/workflows/deploy-azure.yml)); the callers differ only in which
GitHub Environment supplies the secrets, which image target is built, and how images are
tagged. Production is skipped entirely until the `PROD_DEPLOY_ENABLED` repository variable
is set to `true`, so this can land ahead of the infrastructure.

**GitHub Environments.** Each environment's secrets are scoped to a GitHub Environment —
`development` and `production` — rather than shared at repository level, and each is pinned
by a deployment branch policy to the only branch allowed to deploy there. A run from the
wrong branch cannot read the other environment's secrets; that is enforced on the runner,
not by convention in a workflow file. `scripts/sync-github-secrets.sh` creates the
environment, applies the branch policy and fills it from the matching Terraform workspace:

```bash
./scripts/sync-github-secrets.sh --environment dev --dry-run
./scripts/sync-github-secrets.sh --environment dev
./scripts/sync-github-secrets.sh --environment dev --prune-repo-secrets   # remove the old shared copies
./scripts/sync-github-secrets.sh --environment prod --enable-prod-deploys # once prod exists
```

Required reviewers on `production` are deliberately left to the UI — approving a production
deploy is a human decision, not something a script should switch on.

**Secrets.** The production stack reads its credentials from Azure Key Vault at run time —
there is no `.env.production` to create, leak, or leave stale when a value is rotated:

```bash
./scripts/with-azure-secrets.sh -- docker compose -f docker-compose.prod.yml up -d
./scripts/with-azure-secrets.sh -- docker compose -f docker-compose.prod.yml run --rm migrations
./scripts/with-azure-secrets.sh --environment dev --list   # variable names, never values
```

The script fetches the vault's secrets into the command's environment and nothing else —
it cannot print them and cannot write an env file. Reading the vault needs a Key Vault
access policy (`secrets_operator_object_id`); a subscription Reader deliberately cannot,
because Key Vault's data plane is governed by access policies rather than RBAC.

A local `.env.production` still works as a fallback for anyone who cannot reach the vault —
`docker compose --env-file .env.production -f docker-compose.prod.yml up` — see
`.env.production.example`. Neither route hides values from `docker inspect`; what the vault
removes is the file on disk.

---

## Infrastructure

Terraform for two clouds under `infrastructure/`:

```
infrastructure/
├── azure/   environments (dev/prod matrix), main, compute, networking, database, secrets, monitoring
└── aws/     compute, networking, database, secrets, monitoring, IAM policy
```

Per-environment commands, the full dev/prod comparison and the production bootstrap
checklist are in [infrastructure/azure/README.md](infrastructure/azure/README.md). Working
notes on the cloud build-out are in
[cloud-infrastructure-session-notes.md](cloud-infrastructure-session-notes.md).

> State is still local to whoever last ran `apply`, and it stores `db_password`,
> `auth_secret` and the Entra client secret in cleartext. Move to remote state (Azure
> Storage / S3 + DynamoDB) before more than one person applies against either stack — and
> before production carries real candidate data.

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
