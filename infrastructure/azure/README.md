# Azure infrastructure — dev and prod

One root module, two environments. Which one you are operating on is decided by the
Terraform **workspace**, and every difference between them is declared in one place:
[`environments.tf`](environments.tf).

| | development | production |
|---|---|---|
| Workspace | `default` | `prod` |
| State | `terraform.tfstate` | `terraform.tfstate.d/prod/terraform.tfstate` |
| Resource group | `rg-liftoff-dev` | `rg-liftoff-prod` |
| Secrets file | `secrets.dev.tfvars` | `secrets.prod.tfvars` |
| Status | live | **not created yet** |

`terraform_data.environment_guard` fails the plan if the workspace and `var.environment`
disagree, so a prod apply cannot be pointed at dev's state — the mistake that would
otherwise rename every dev resource into a prod one.

---

## Running a plan or apply

```bash
cd infrastructure/azure

# development
terraform workspace select default
terraform plan  -var-file=secrets.dev.tfvars
terraform apply -var-file=secrets.dev.tfvars

# production
terraform workspace select prod          # terraform workspace new prod, the first time
terraform plan  -var-file=secrets.prod.tfvars
terraform apply -var-file=secrets.prod.tfvars
```

The secrets files are gitignored. Copy them from the committed templates
(`secrets.dev.tfvars.example`, `secrets.prod.tfvars.example`), which list every variable
each environment needs.

> **If you still have `terraform.tfvars`**, rename it to `secrets.dev.tfvars`. Terraform
> auto-loads `terraform.tfvars` in *every* workspace, so leaving it in place means a prod
> apply silently reads dev's credentials for any variable the prod file happens not to set.

---

## What differs between the environments

All of it lives in the `local.environments` map in `environments.tf`; the resource files
only ever read `local.env.<setting>`. Changing a tier is a one-line diff there.

| | dev | prod | why |
|---|---|---|---|
| App environment name | `Development` | `Production` | `Program.cs` maps the OpenAPI document and the Scalar UI only under `Development`. Prod also stops returning developer exception pages. |
| PostgreSQL | `B_Standard_B1ms`, 32 GB | `GP_Standard_D2s_v3`, 64 GB | Burstable credits run out under sustained load and the server then throttles to a fraction of a vCore. |
| Backups | 7 days, local | 35 days, geo-redundant | 35 is the Flexible Server maximum for point-in-time restore. |
| Blob storage | LRS, no versioning | GRS, versioning on | Candidate documents are POPIA records — not recoverable by re-ingesting. |
| ACR / Service Bus | Basic / Basic | Standard / Standard | Basic Service Bus has no topics and no duplicate detection; the tier change is not free of downtime later. |
| Backend + frontend | 1 replica, 0.25 vCPU | 2–4 replicas, 0.5 vCPU | A revision rollout or a crashed replica should not be an outage. |
| Worker + hiring agent | 1 replica | 1 replica | Not a cost choice. The agent's job queue is in-process and the worker's retry counter is per-process — scaling either needs a code change first. |
| Log retention | 30 days | 90 days | Covers a full intake cycle for audit questions. |
| 5xx alert | > 5 in 5 min | > 3 in 5 min | |
| Key Vault purge protection | off | **on** | Prod vaults stay recoverable; dev stays disposable. Note this is one-way — Azure does not allow it to be turned off again. |
| Resource group lock | none | `CanNotDelete` | `terraform destroy` fails against prod instead of deleting it. |

---

## Creating production for the first time

Nothing exists on Azure for prod yet. The order matters — several values are only knowable
after the first apply.

1. **Secrets.** `cp secrets.prod.tfvars.example secrets.prod.tfvars` and fill it in.
   Generate fresh values; do not copy anything from dev or from `.env.development`, which is
   committed. Leave `reader_group_object_id` empty for now.
2. **Plan as a costing review.** `terraform workspace new prod` then
   `terraform plan -var-file=secrets.prod.tfvars`. This is a General Purpose database, GRS
   storage and doubled replicas — read the plan for what it will cost per month before
   applying it.
3. **Apply.** Expect ~48 resources.
4. **Pin the database zone.** Azure picks an availability zone at creation. Read it off the
   new server and set `db_zone` for `prod` in `environments.tf` to that value. Skipping this
   leaves a permanent diff on every future plan — see the comment in `database.tf`.
5. **Entra app registration.** Register a *separate* production application for recruiter
   sign-in and set its redirect URI to the frontend's `AUTH_URL` (from
   `terraform output frontend_url`) + `/api/auth/callback/microsoft-entra-id`. Put its
   client id and secret in `secrets.prod.tfvars` and apply again.
6. **Reader group.** `az ad group create` a `liftoff-prod-readers` group, set
   `reader_group_object_id`, apply. It must be a different group from dev's: the assignment
   is subscription-scoped, so the same group id in both environments is the same assignment
   and the second apply fails on the duplicate.
7. **GitHub.** Create the `production` environment with required reviewers, add its secrets,
   and set the `PROD_DEPLOY_ENABLED` repository variable to `true`. The full list is in the
   header of [`.github/workflows/production-deploy-azure.yml`](../../.github/workflows/production-deploy-azure.yml).
8. **First deploy.** Merge to `main`, or run the production workflow manually. The Container
   Apps sit on `:latest` in an empty registry until then, so they will not start before the
   first deploy — that is expected, not a broken apply.

---

## GitHub Environments

Each environment's deploy secrets live in a GitHub Environment rather than at repository
level, pinned to the one branch allowed to deploy there:

| | development | production |
|---|---|---|
| GitHub Environment | `development` | `production` |
| Deployment branch | `development` | `main` |
| Service principal | `liftoff-github-actions-dev` | `liftoff-github-actions-prod` |
| Scope | Contributor on `rg-liftoff-dev` | Contributor on `rg-liftoff-prod` |

```bash
./scripts/sync-github-secrets.sh --environment dev --dry-run
./scripts/sync-github-secrets.sh --environment prod --enable-prod-deploys
```

The script creates the environment, applies the branch policy, and fills it from the
matching Terraform workspace — so dev's resource names cannot end up in prod's environment.
Required reviewers on `production` are set in the UI, deliberately: approving a production
deploy is a human decision.

One sharp edge worth knowing before running it against a new environment:
`az ad sp create-for-rbac --name <existing>` **replaces** that principal's password rather
than adding one. Any consumer still holding the old value breaks, and GitHub cannot hand a
secret back for comparison, so the failure only shows up as a failed deploy.

---

## Reading secrets out of the vault

Each environment's Key Vault holds the full application configuration (`db-credentials` and
`app-secrets` are JSON documents; the connection strings and API keys are plain values).
`scripts/with-azure-secrets.sh` loads them into a command's environment, which is how the
production Compose stack runs without a `.env.production` on anyone's disk:

```bash
./scripts/with-azure-secrets.sh -- docker compose -f docker-compose.prod.yml up -d
./scripts/with-azure-secrets.sh --environment dev --list
```

Key Vault's data plane is governed by the access policies in `secrets.tf`, **not** by Azure
RBAC — which is why the team's subscription-scoped Reader role cannot read a secret value,
by design. Whoever needs to run the script must be granted Get/List through
`secrets_operator_object_id`. Point it at a group, keep prod membership short, and remember
that it is read access to every production credential at once.

### Secrets still land in Terraform state

The vault removes the file on the laptop, not the copy in state: `db_password`,
`auth_secret` and the Entra client secret are passed in as variables, so they sit in
cleartext in `terraform.tfstate` regardless of `sensitive = true`. Two ways to close that,
in increasing order of effort:

1. **Container Apps Key Vault references.** Replace the inline `secret { name, value }`
   blocks in `compute.tf` with `secret { name, key_vault_secret_id, identity }`. The app
   resolves the secret at run time through its managed identity, so only the *URI* is
   stored — nothing sensitive reaches state, and rotating a value in the vault no longer
   needs a `terraform apply`.
2. **Create the secrets out of band.** `az keyvault secret set` them once, drop the
   corresponding variables, and let the Container Apps read them by reference. Terraform
   then never sees a credential at all.

Neither is done yet. (1) is the one worth doing first, and it applies to both environments.

---

## Known gaps

- **State is local.** Both environments keep state on whoever ran `apply` last. Prod state
  in particular holds `db_password`, `auth_secret` and the Entra client secret in cleartext,
  and only one person can hold the authoritative copy. Move to an `azurerm` backend
  (Storage Account + blob lease locking) before more than one person applies against prod —
  `terraform init -migrate-state` moves an existing workspace across without recreating
  anything.
- **No CI plan.** Applies are run by hand from a laptop. A `terraform plan` on pull requests
  would catch drift and unreviewed changes before they reach either environment.
- **The dev database is reachable by any Azure service.** `AllowAzureServices` on the
  Flexible Server firewall admits every Azure tenant's outbound traffic, not just ours. Prod
  inherits the same rule today; VNet integration with a private endpoint would close it.
