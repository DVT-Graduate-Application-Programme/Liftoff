#!/usr/bin/env bash
#
# Sync one environment's GitHub Actions secrets from its Terraform outputs.
#
# The deploy pipeline (.github/workflows/deploy-azure.yml) reads every resource name from
# secrets scoped to a GitHub Environment — `development` or `production`. Those names are
# all Terraform outputs, so this script reads them from the matching workspace's state and
# writes them to the matching environment. No value is ever copied by hand, and dev's
# resource names cannot end up in prod's environment.
#
#   ./scripts/sync-github-secrets.sh --environment dev  --dry-run
#   ./scripts/sync-github-secrets.sh --environment dev
#   ./scripts/sync-github-secrets.sh --environment prod
#
# It also creates the GitHub Environment itself, with a deployment branch policy that pins
# it to the branch that is allowed to deploy there — `development` for dev, `main` for
# prod. That is the part which actually separates the two on GitHub: a workflow run from
# the wrong branch cannot reach the other environment's secrets, whatever the workflow file
# says.
#
# Re-run it whenever:
#   • Terraform recreates a resource and its name changes (the random suffix in main.tf means
#     ACR, Key Vault and Storage names change on every rebuild).
#   • You point the stack at a different subscription or tenant.
#   • You suspect the secrets have drifted from reality.
#
# Safe to run repeatedly: `gh secret set` overwrites in place, so re-running simply
# reconciles GitHub with whatever Terraform currently says.
#
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AZURE_DIR="$REPO_ROOT/infrastructure/azure"

# GITHUB_SECRET_NAME:terraform_output_name
#
# ACR_REPOSITORY intentionally shares acr_login_server with ACR_LOGIN_SERVER: the workflow
# composes image paths as "${ACR_REPOSITORY}/${component}", so it needs the bare registry
# host, not a full repository path.
SECRETS=(
  "AZURE_RESOURCE_GROUP:resource_group_name"
  "ACR_LOGIN_SERVER:acr_login_server"
  "ACR_REPOSITORY:acr_login_server"
  "MIGRATIONS_JOB:migrations_job_name"
  "BACKEND_CONTAINER_APP:backend_container_app_name"
  "WORKER_CONTAINER_APP:worker_container_app_name"
  "FRONTEND_CONTAINER_APP:frontend_container_app_name"
  "HIRING_AGENT_CONTAINER_APP:hiring_agent_container_app_name"
)

# ── Options ──────────────────────────────────────────────────────────────────

DRY_RUN=false
ROTATE_CREDENTIALS=false
SUBSCRIPTION_ID=""
RESOURCE_GROUP=""
GH_REPO=""
ENVIRONMENT="dev"
PRUNE_REPO_SECRETS=false
ENABLE_PROD_DEPLOYS=false

usage() {
  cat <<'EOF'
Sync one environment's GitHub Actions secrets from its Terraform outputs.

Usage:
  ./scripts/sync-github-secrets.sh --environment <dev|prod> [options]

Options:
  --environment <dev|prod>
                          Which environment to sync. dev writes to the `development`
                          GitHub Environment from the default Terraform workspace; prod
                          writes to `production` from the prod workspace. Default: dev
  --subscription <id>     Azure subscription to scope the service principal to.
                          Default: subscription_id from the environment's secrets tfvars
  --resource-group <name> Resource group to scope the service principal to.
                          Default: the resource_group_name Terraform output
  --repo <owner/name>     Target GitHub repository. Default: inferred from git remote
  --rotate-credentials    Create a new service principal and overwrite AZURE_CREDENTIALS.
                          Required when the subscription or tenant changes.
  --prune-repo-secrets    Delete the repository-level copies of the secrets this script
                          manages, once they exist on the environment. Use after the first
                          --environment dev run, to remove the ambiguity of a value living
                          in two places. Never touches the AWS_*/ECR_*/ECS_* secrets.
  --enable-prod-deploys   Set the PROD_DEPLOY_ENABLED repository variable to true, which is
                          the kill switch production-deploy-azure.yml checks. Only valid
                          with --environment prod, and only once prod really exists.
  --dry-run               Print planned changes without writing anything
  -h, --help              Show this help

Examples:
  ./scripts/sync-github-secrets.sh --environment dev --dry-run
  ./scripts/sync-github-secrets.sh --environment dev
  ./scripts/sync-github-secrets.sh --environment dev --prune-repo-secrets
  ./scripts/sync-github-secrets.sh --environment prod --rotate-credentials
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment)        ENVIRONMENT="${2:?--environment needs a value}"; shift 2 ;;
    --prune-repo-secrets) PRUNE_REPO_SECRETS=true; shift ;;
    --enable-prod-deploys) ENABLE_PROD_DEPLOYS=true; shift ;;
    --subscription)       SUBSCRIPTION_ID="${2:?--subscription needs a value}"; shift 2 ;;
    --resource-group)     RESOURCE_GROUP="${2:?--resource-group needs a value}"; shift 2 ;;
    --repo)               GH_REPO="${2:?--repo needs a value}"; shift 2 ;;
    --rotate-credentials) ROTATE_CREDENTIALS=true; shift ;;
    --dry-run)            DRY_RUN=true; shift ;;
    -h|--help)            usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; echo "Try --help" >&2; exit 2 ;;
  esac
done

# ── Environment resolution ───────────────────────────────────────────────────
#
# One environment name on the command line drives four things that must agree, and this is
# the only place they are tied together:
#
#   dev  -> Terraform workspace "default", GitHub Environment "development",
#           branch "development", service principal "liftoff-github-actions-dev"
#   prod -> workspace "prod",              environment "production",
#           branch "main",                 "liftoff-github-actions-prod"
#
# Getting one of them wrong is how prod ends up holding dev's resource names, so they are
# never passed separately.

case "$ENVIRONMENT" in
  dev)
    TF_WORKSPACE_NAME="default"
    GH_ENVIRONMENT="development"
    DEPLOY_BRANCH="development"
    SP_NAME="liftoff-github-actions-dev"
    SECRETS_TFVARS="secrets.dev.tfvars"
    ;;
  prod)
    TF_WORKSPACE_NAME="prod"
    GH_ENVIRONMENT="production"
    DEPLOY_BRANCH="main"
    SP_NAME="liftoff-github-actions-prod"
    SECRETS_TFVARS="secrets.prod.tfvars"
    ;;
  *)
    echo "--environment must be dev or prod, got '$ENVIRONMENT'" >&2
    exit 2
    ;;
esac

if [[ "$ENABLE_PROD_DEPLOYS" == true && "$ENVIRONMENT" != "prod" ]]; then
  echo "--enable-prod-deploys only makes sense with --environment prod." >&2
  exit 2
fi

# ── Output helpers ───────────────────────────────────────────────────────────

if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  BOLD=""; RED=""; GREEN=""; YELLOW=""; DIM=""; RESET=""
fi

info() { echo "${BOLD}==>${RESET} $*"; }
ok()   { echo "  ${GREEN}✓${RESET} $*"; }
warn() { echo "  ${YELLOW}!${RESET} $*" >&2; }
die()  { echo "${RED}error:${RESET} $*" >&2; exit 1; }

# Plain counters rather than an array: macOS still ships bash 3.2, where referencing an
# empty array under `set -u` is an unbound-variable error.
FAILED_COUNT=0
FAILED_NAMES=""

# ── Preflight ────────────────────────────────────────────────────────────────

info "Checking prerequisites"

command -v gh        >/dev/null 2>&1 || die "GitHub CLI not found. Install: brew install gh"
command -v az        >/dev/null 2>&1 || die "Azure CLI not found. Install: brew install azure-cli"
command -v terraform >/dev/null 2>&1 || die "Terraform not found. Install: brew install terraform"
ok "gh, az and terraform present"

gh auth status >/dev/null 2>&1 || die "Not logged in to GitHub. Run: gh auth login"
ok "GitHub authenticated"

az account show >/dev/null 2>&1 || die "Not logged in to Azure. Run: az login"
ok "Azure authenticated"

if [[ -z "$GH_REPO" ]]; then
  GH_REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)" \
    || die "Could not infer the GitHub repository. Pass --repo <owner/name>."
fi
ok "Target repository: $GH_REPO"

# ── Resolve the target subscription ───────────────────────────────────────────

# The environment's own secrets file, so a prod sync cannot read dev's subscription. Falls
# back to the legacy terraform.tfvars if the rename has not happened yet.
TFVARS="$AZURE_DIR/$SECRETS_TFVARS"
[[ -f "$TFVARS" ]] || TFVARS="$AZURE_DIR/terraform.tfvars"

if [[ -z "$SUBSCRIPTION_ID" && -f "$TFVARS" ]]; then
  SUBSCRIPTION_ID="$(grep -E '^[[:space:]]*subscription_id[[:space:]]*=' "$TFVARS" \
    | head -1 | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/')" || true
fi

[[ -n "$SUBSCRIPTION_ID" ]] \
  || die "No subscription id. Set subscription_id in $SECRETS_TFVARS or pass --subscription."

CURRENT_SUB="$(az account show --query id -o tsv 2>/dev/null || true)"
if [[ "$CURRENT_SUB" != "$SUBSCRIPTION_ID" ]]; then
  warn "Azure CLI default subscription ($CURRENT_SUB) differs from the target ($SUBSCRIPTION_ID)."
  warn "That is fine — the az calls below are explicitly scoped."
fi
ok "Target subscription: $SUBSCRIPTION_ID"

# ── Read Terraform outputs ───────────────────────────────────────────────────

# Reads one output, failing with a useful message rather than writing an empty secret.
# TF_WORKSPACE selects the workspace for the duration of one command without persisting
# it, so reading prod's outputs never leaves the caller's own selection pointed at prod.
read_output() {
  local name="$1" value
  value="$(TF_WORKSPACE="$TF_WORKSPACE_NAME" terraform -chdir="$AZURE_DIR" output -raw "$name" 2>/dev/null)" || return 1
  [[ -n "$value" && "$value" != "null" ]] || return 1
  printf '%s' "$value"
}

info "Reading Terraform outputs from ${DIM}$AZURE_DIR${RESET} ${DIM}(workspace: $TF_WORKSPACE_NAME)${RESET}"

[[ -d "$AZURE_DIR/.terraform" ]] \
  || die "Terraform not initialised. Run: terraform -chdir=$AZURE_DIR init"

# Probes one known output rather than checking whether `terraform output` printed
# anything: with no outputs it prints a "No outputs found" *warning on stdout*, so an
# emptiness check silently passes on a workspace that has never been applied — and the run
# then goes on to create a service principal for an environment that does not exist.
# `output -raw <name>` exits non-zero, which is unambiguous.
if ! read_output resource_group_name >/dev/null 2>&1; then
  die "No Terraform outputs in the '$TF_WORKSPACE_NAME' workspace — '$ENVIRONMENT' has not
       been applied yet. Secrets can only be synced after 'terraform apply' has created the
       resources. First deploy is: apply -> sync secrets -> push.

       For production that is expected until the environment is created; see
       infrastructure/azure/README.md."
fi

# ── GitHub Environment ───────────────────────────────────────────────────────
#
# The environment must exist before secrets can be scoped to it. Creating it is idempotent:
# PUT on an existing environment updates it rather than failing.
#
# The deployment branch policy is the actual separation. Without it, any branch can run a
# workflow that names this environment and read its secrets; with it, only $DEPLOY_BRANCH
# can. That is a rule GitHub enforces on the runner, not a convention in a workflow file.
#
# Protection rules on private repositories need a paid plan. If this repo is private on the
# free plan the calls below fail — the environment and its secrets still work, only the
# branch restriction and reviewers are unavailable, so those failures warn rather than stop.

info "Configuring the '$GH_ENVIRONMENT' environment"

if [[ "$DRY_RUN" == true ]]; then
  echo "  ${DIM}would create/update environment${RESET} $GH_ENVIRONMENT"
  echo "  ${DIM}would restrict deployments to branch${RESET} $DEPLOY_BRANCH"
  [[ "$ENVIRONMENT" == "prod" ]] && \
    echo "  ${DIM}would leave required reviewers for you to set in the UI${RESET}"
else
  # -F, not -f: the API rejects the branch-policy flags as strings ("false" is not of type
  # boolean). -F sends them typed.
  if gh api -X PUT "repos/$GH_REPO/environments/$GH_ENVIRONMENT" \
       -F "deployment_branch_policy[protected_branches]=false" \
       -F "deployment_branch_policy[custom_branch_policies]=true" \
       --silent 2>/dev/null; then
    ok "environment $GH_ENVIRONMENT"

    # Replace any existing policies so re-runs converge instead of accumulating.
    existing="$(gh api "repos/$GH_REPO/environments/$GH_ENVIRONMENT/deployment-branch-policies" \
      --jq '.branch_policies[]? | "\(.id)\t\(.name)"' 2>/dev/null || true)"

    while IFS=$'\t' read -r policy_id policy_name; do
      [[ -z "${policy_id:-}" ]] && continue
      if [[ "$policy_name" != "$DEPLOY_BRANCH" ]]; then
        gh api -X DELETE \
          "repos/$GH_REPO/environments/$GH_ENVIRONMENT/deployment-branch-policies/$policy_id" \
          --silent 2>/dev/null || true
        warn "removed stale branch policy '$policy_name'"
      fi
    done <<< "$existing"

    if ! grep -q "	$DEPLOY_BRANCH\$" <<< "$existing"; then
      if gh api -X POST "repos/$GH_REPO/environments/$GH_ENVIRONMENT/deployment-branch-policies" \
           -f "name=$DEPLOY_BRANCH" -f "type=branch" --silent 2>/dev/null; then
        ok "deployments restricted to the '$DEPLOY_BRANCH' branch"
      else
        warn "could not set the branch policy — needs a paid plan on a private repo."
        warn "Set it by hand: Settings -> Environments -> $GH_ENVIRONMENT -> deployment branches."
      fi
    else
      ok "deployments already restricted to '$DEPLOY_BRANCH'"
    fi
  else
    warn "could not create the '$GH_ENVIRONMENT' environment via the API."
    warn "Create it by hand: Settings -> Environments -> New environment."
  fi

  if [[ "$ENVIRONMENT" == "prod" ]]; then
    warn "Required reviewers are NOT set by this script — approving a production deploy is a"
    warn "human decision, so it is configured deliberately in the UI:"
    warn "  Settings -> Environments -> production -> Required reviewers."
  fi
fi

# ── Sync secrets ─────────────────────────────────────────────────────────────

set_secret() {
  local name="$1" value="$2"
  if [[ "$DRY_RUN" == true ]]; then
    echo "  ${DIM}would set${RESET} $name ${DIM}= $value${RESET}"
  else
    gh secret set "$name" --repo "$GH_REPO" --env "$GH_ENVIRONMENT" --body "$value"
    ok "$name ${DIM}= $value${RESET}"
  fi
}

info "Syncing secrets into the '$GH_ENVIRONMENT' environment"

for entry in "${SECRETS[@]}"; do
  secret="${entry%%:*}"
  output="${entry##*:}"
  if value="$(read_output "$output")"; then
    set_secret "$secret" "$value"
    if [[ "$secret" == "AZURE_RESOURCE_GROUP" && -z "$RESOURCE_GROUP" ]]; then
      RESOURCE_GROUP="$value"
    fi
  else
    warn "skipped $secret — Terraform output '$output' is missing or empty"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    FAILED_NAMES="$FAILED_NAMES $secret"
  fi
done

# ── AZURE_CREDENTIALS ────────────────────────────────────────────────────────
#
# Deliberately not refreshed on every run. `az ad sp create-for-rbac --name <existing>`
# does not create a second app registration — it reuses the one with that display name and
# *replaces* its password. Every consumer still holding the old value breaks silently, and
# GitHub cannot hand a secret back to compare, so the only signal is a failed deploy.
#
# That is why this runs once per environment and is otherwise gated behind
# --rotate-credentials.

info "Checking AZURE_CREDENTIALS"

HAS_CREDENTIALS=false
if gh secret list --repo "$GH_REPO" --env "$GH_ENVIRONMENT" 2>/dev/null \
     | awk '{print $1}' | grep -qx "AZURE_CREDENTIALS"; then
  HAS_CREDENTIALS=true
fi

if [[ "$ROTATE_CREDENTIALS" == true || "$HAS_CREDENTIALS" == false ]]; then
  if [[ "$HAS_CREDENTIALS" == false ]]; then
    warn "AZURE_CREDENTIALS is not set on the '$GH_ENVIRONMENT' environment."

    # GitHub never returns a secret's value, so a repository-level credential cannot be
    # copied into an environment by any script. Minting a fresh one is the only automated
    # path — and it is the better one anyway, since each environment should hold a
    # principal scoped to its own resource group rather than sharing one.
    if gh secret list --repo "$GH_REPO" --json name --jq '.[].name' 2>/dev/null \
         | grep -qx "AZURE_CREDENTIALS"; then
      warn "A repository-level AZURE_CREDENTIALS exists, but GitHub does not return secret"
      warn "values, so it cannot be copied across — a fresh credential has to be minted."
      warn ""
      warn "That ROTATES the '$SP_NAME' password: the repository-level copy stops"
      warn "working the moment this finishes. Nothing else uses it, but delete it so it is"
      warn "not mistaken for a fallback:"
      warn "  gh secret delete AZURE_CREDENTIALS --repo $GH_REPO"
    fi

    warn "Creating a service principal."
  else
    warn "Rotating AZURE_CREDENTIALS (--rotate-credentials)."
  fi

  SCOPE="/subscriptions/$SUBSCRIPTION_ID"
  [[ -n "$RESOURCE_GROUP" ]] && SCOPE="$SCOPE/resourceGroups/$RESOURCE_GROUP"

  if [[ "$DRY_RUN" == true ]]; then
    echo "  ${DIM}would create service principal '$SP_NAME' scoped to $SCOPE${RESET}"
    echo "  ${DIM}would set AZURE_CREDENTIALS = <service principal json>${RESET}"
  else
    # --sdk-auth emits the JSON shape azure/login@v2's `creds:` input expects. It is
    # deprecated in newer az CLI versions but has no replacement for that input.
    CREDS="$(az ad sp create-for-rbac \
      --name "$SP_NAME" \
      --role contributor \
      --scopes "$SCOPE" \
      --sdk-auth 2>/dev/null)" \
      || die "Failed to create the service principal. You need Owner or User Access
       Administrator on $SCOPE to assign roles."

    gh secret set AZURE_CREDENTIALS --repo "$GH_REPO" --env "$GH_ENVIRONMENT" --body "$CREDS"
    unset CREDS
    ok "AZURE_CREDENTIALS ${DIM}(service principal '$SP_NAME' scoped to $SCOPE)${RESET}"
    warn "The SP also needs AcrPush on the registry for 'az acr login' to succeed."
  fi
else
  ok "AZURE_CREDENTIALS already set ${DIM}(pass --rotate-credentials to replace it)${RESET}"
  warn "If you changed subscription or tenant, the existing credential is for the old one."
  warn "Re-run with --rotate-credentials."
fi

# ── PROD_DEPLOY_ENABLED ──────────────────────────────────────────────────────
#
# The kill switch production-deploy-azure.yml checks. Deliberately opt-in: syncing prod
# secrets is preparation, turning on automatic production deploys is a separate decision.

if [[ "$ENABLE_PROD_DEPLOYS" == true ]]; then
  info "Enabling production deploys"
  if [[ "$DRY_RUN" == true ]]; then
    echo "  ${DIM}would set repository variable${RESET} PROD_DEPLOY_ENABLED = true"
  else
    gh variable set PROD_DEPLOY_ENABLED --repo "$GH_REPO" --body "true"
    ok "PROD_DEPLOY_ENABLED = true ${DIM}(pushes to main now deploy to production)${RESET}"
  fi
fi

# ── Prune repository-level copies ────────────────────────────────────────────
#
# Before environments existed these secrets lived at repository level, where every workflow
# and every branch could read them. Once the environment holds them, the repository copy is
# a stale duplicate that silently wins nothing but confuses everyone: environment secrets
# take precedence, so the old value lingers unused until someone deletes the environment
# and it quietly comes back.
#
# Only the secrets this script manages are removed. AWS_*, ECR_* and ECS_* belong to the
# AWS deploy workflow and are left alone.

if [[ "$PRUNE_REPO_SECRETS" == true ]]; then
  info "Pruning repository-level copies"

  PRUNE_LIST="AZURE_CREDENTIALS"
  for entry in "${SECRETS[@]}"; do
    PRUNE_LIST="$PRUNE_LIST ${entry%%:*}"
  done

  REPO_LEVEL="$(gh secret list --repo "$GH_REPO" --json name --jq '.[].name' 2>/dev/null || true)"

  for name in $PRUNE_LIST; do
    if ! grep -qx "$name" <<< "$REPO_LEVEL"; then
      continue
    fi
    if [[ "$DRY_RUN" == true ]]; then
      echo "  ${DIM}would delete repository secret${RESET} $name"
    else
      gh secret delete "$name" --repo "$GH_REPO" 2>/dev/null \
        && ok "deleted repository secret $name" \
        || warn "could not delete repository secret $name"
    fi
  done

  warn "The AWS deploy workflow still uses repository-level AWS_*/ECR_*/ECS_* secrets."
  warn "Those were left untouched — it has no environment of its own yet."
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo
if [[ "$DRY_RUN" == true ]]; then
  info "Dry run — nothing was written. Re-run without --dry-run to apply."
elif [[ "$FAILED_COUNT" -gt 0 ]]; then
  die "Finished with $FAILED_COUNT unset secret(s):$FAILED_NAMES
       The deploy workflow will fail until these resolve. Has 'terraform apply' completed?"
else
  info "${GREEN}All secrets synced to the '$GH_ENVIRONMENT' environment.${RESET}"
  echo "  Verify with: gh secret list --repo $GH_REPO --env $GH_ENVIRONMENT"
fi
