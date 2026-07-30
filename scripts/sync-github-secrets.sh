#!/usr/bin/env bash
#
# Sync GitHub Actions secrets from Terraform outputs.
#
# The deploy workflow (.github/workflows/development-deploy-azure.yml) reads every resource
# name from repository secrets. Those names are all Terraform outputs, so this script reads
# them from state and writes them to GitHub — no copying values by hand.
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
)

SP_NAME="liftoff-github-actions-dev"

# ── Options ──────────────────────────────────────────────────────────────────

DRY_RUN=false
ROTATE_CREDENTIALS=false
SUBSCRIPTION_ID=""
RESOURCE_GROUP=""
GH_REPO=""

usage() {
  cat <<'EOF'
Sync GitHub Actions secrets from Terraform outputs.

Usage:
  ./scripts/sync-github-secrets.sh [options]

Options:
  --subscription <id>     Azure subscription to scope the service principal to.
                          Default: subscription_id from infrastructure/azure/terraform.tfvars
  --resource-group <name> Resource group to scope the service principal to.
                          Default: the resource_group_name Terraform output
  --repo <owner/name>     Target GitHub repository. Default: inferred from git remote
  --rotate-credentials    Create a new service principal and overwrite AZURE_CREDENTIALS.
                          Required when the subscription or tenant changes.
  --dry-run               Print planned changes without writing anything
  -h, --help              Show this help

Examples:
  ./scripts/sync-github-secrets.sh --dry-run
  ./scripts/sync-github-secrets.sh
  ./scripts/sync-github-secrets.sh --rotate-credentials
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --subscription)       SUBSCRIPTION_ID="${2:?--subscription needs a value}"; shift 2 ;;
    --resource-group)     RESOURCE_GROUP="${2:?--resource-group needs a value}"; shift 2 ;;
    --repo)               GH_REPO="${2:?--repo needs a value}"; shift 2 ;;
    --rotate-credentials) ROTATE_CREDENTIALS=true; shift ;;
    --dry-run)            DRY_RUN=true; shift ;;
    -h|--help)            usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; echo "Try --help" >&2; exit 2 ;;
  esac
done

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

TFVARS="$AZURE_DIR/terraform.tfvars"

if [[ -z "$SUBSCRIPTION_ID" && -f "$TFVARS" ]]; then
  SUBSCRIPTION_ID="$(grep -E '^[[:space:]]*subscription_id[[:space:]]*=' "$TFVARS" \
    | head -1 | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/')" || true
fi

[[ -n "$SUBSCRIPTION_ID" ]] \
  || die "No subscription id. Set subscription_id in terraform.tfvars or pass --subscription."

CURRENT_SUB="$(az account show --query id -o tsv 2>/dev/null || true)"
if [[ "$CURRENT_SUB" != "$SUBSCRIPTION_ID" ]]; then
  warn "Azure CLI default subscription ($CURRENT_SUB) differs from the target ($SUBSCRIPTION_ID)."
  warn "That is fine — the az calls below are explicitly scoped."
fi
ok "Target subscription: $SUBSCRIPTION_ID"

# ── Read Terraform outputs ───────────────────────────────────────────────────

# Reads one output, failing with a useful message rather than writing an empty secret.
read_output() {
  local name="$1" value
  value="$(terraform -chdir="$AZURE_DIR" output -raw "$name" 2>/dev/null)" || return 1
  [[ -n "$value" && "$value" != "null" ]] || return 1
  printf '%s' "$value"
}

info "Reading Terraform outputs from ${DIM}$AZURE_DIR${RESET}"

[[ -d "$AZURE_DIR/.terraform" ]] \
  || die "Terraform not initialised. Run: terraform -chdir=$AZURE_DIR init"

if [[ -z "$(terraform -chdir="$AZURE_DIR" output 2>/dev/null)" ]]; then
  die "No Terraform outputs found — the stack has not been applied yet.
       Secrets can only be synced after 'terraform apply' has created the resources.
       First deploy is: apply -> sync secrets -> push."
fi

# ── Sync secrets ─────────────────────────────────────────────────────────────

set_secret() {
  local name="$1" value="$2"
  if [[ "$DRY_RUN" == true ]]; then
    echo "  ${DIM}would set${RESET} $name ${DIM}= $value${RESET}"
  else
    gh secret set "$name" --repo "$GH_REPO" --body "$value"
    ok "$name ${DIM}= $value${RESET}"
  fi
}

info "Syncing secrets"

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
# Deliberately not refreshed on every run: `az ad sp create-for-rbac` mints a *new* secret
# each time it is called, and display names are not unique, so an unconditional call would
# litter the tenant with duplicate app registrations on every sync.

info "Checking AZURE_CREDENTIALS"

HAS_CREDENTIALS=false
if gh secret list --repo "$GH_REPO" 2>/dev/null | awk '{print $1}' | grep -qx "AZURE_CREDENTIALS"; then
  HAS_CREDENTIALS=true
fi

if [[ "$ROTATE_CREDENTIALS" == true || "$HAS_CREDENTIALS" == false ]]; then
  if [[ "$HAS_CREDENTIALS" == false ]]; then
    warn "AZURE_CREDENTIALS is not set — creating a service principal."
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

    gh secret set AZURE_CREDENTIALS --repo "$GH_REPO" --body "$CREDS"
    unset CREDS
    ok "AZURE_CREDENTIALS ${DIM}(service principal '$SP_NAME' scoped to $SCOPE)${RESET}"
    warn "The SP also needs AcrPush on the registry for 'az acr login' to succeed."
  fi
else
  ok "AZURE_CREDENTIALS already set ${DIM}(pass --rotate-credentials to replace it)${RESET}"
  warn "If you changed subscription or tenant, the existing credential is for the old one."
  warn "Re-run with --rotate-credentials."
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo
if [[ "$DRY_RUN" == true ]]; then
  info "Dry run — nothing was written. Re-run without --dry-run to apply."
elif [[ "$FAILED_COUNT" -gt 0 ]]; then
  die "Finished with $FAILED_COUNT unset secret(s):$FAILED_NAMES
       The deploy workflow will fail until these resolve. Has 'terraform apply' completed?"
else
  info "${GREEN}All secrets synced.${RESET}"
  echo "  Verify with: gh secret list --repo $GH_REPO"
fi
