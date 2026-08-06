#!/usr/bin/env bash
#
# Run a command with an environment loaded from Azure Key Vault.
#
# Replaces the on-disk .env.production that docker-compose.prod.yml would otherwise need.
# Secrets are fetched at run time, held in the process environment, and never written to
# disk — so there is no file to leak, to commit by accident, or to go stale when a value is
# rotated in the vault.
#
#   ./scripts/with-azure-secrets.sh -- docker compose -f docker-compose.prod.yml up -d
#   ./scripts/with-azure-secrets.sh --environment dev -- docker compose -f docker-compose.prod.yml up
#   ./scripts/with-azure-secrets.sh --list        # which variables it would set, no values
#
# What it does NOT protect against: once Compose has the values, they are in the container
# configuration and `docker inspect` shows them, exactly as with an env file. This removes
# the plaintext file on your laptop, not the exposure inside the Docker daemon.
#
# Access: the vault's data plane is governed by the access policies in
# infrastructure/azure/secrets.tf, not by Azure RBAC — a subscription Reader cannot read
# secrets. Whoever runs this needs Get/List, which is what
# var.secrets_operator_object_id grants.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AZURE_DIR="$REPO_ROOT/infrastructure/azure"

# ── Secret map ────────────────────────────────────────────────────────────────
#
# Two of the vault's secrets are JSON documents holding several values each (see
# secrets.tf); the rest are single values.
#
#   <vault secret>:<json key>:<environment variable>     for the JSON documents
#   <vault secret>::<environment variable>               for plain values
#
# Anything not listed is config rather than a credential and belongs in the compose file or
# in a non-secret .env.production — see .env.production.example.
SECRET_MAP=(
  "db-credentials:username:POSTGRES_USER"
  "db-credentials:password:POSTGRES_PASSWORD"
  "db-credentials:host:POSTGRES_HOST"
  "db-credentials:port:POSTGRES_PORT"
  "db-credentials:dbname:POSTGRES_DB"

  "app-secrets:GEMINI_API_KEY:GEMINI_API_KEY"
  "app-secrets:AUTH_SECRET:AUTH_SECRET"
  "app-secrets:AUTH_MICROSOFT_ENTRA_ID_ID:AUTH_MICROSOFT_ENTRA_ID_ID"
  "app-secrets:AUTH_MICROSOFT_ENTRA_ID_SECRET:AUTH_MICROSOFT_ENTRA_ID_SECRET"
  "app-secrets:AUTH_MICROSOFT_ENTRA_ID_ISSUER:AUTH_MICROSOFT_ENTRA_ID_ISSUER"

  "StorageConnectionString::STORAGE_CONNECTION_STRING"
  "ServiceBusConnectionString::SERVICEBUS_CONNECTION_STRING"
  "AppInsightsConnectionString::APPLICATIONINSIGHTS_CONNECTION_STRING"
  "internal-api-key::INTERNAL_API_KEY"
)

# Present only when a key was configured (secrets.tf creates it conditionally), so a
# missing one is not an error.
OPTIONAL_SECRET_MAP=(
  "WorkerAdminApiKey::Worker__AdminApiKey"
)

# ── Options ───────────────────────────────────────────────────────────────────

ENVIRONMENT="prod"
VAULT_NAME=""
LIST_ONLY=false

usage() {
  cat <<'EOF'
Run a command with secrets from Azure Key Vault in its environment.

Usage:
  ./scripts/with-azure-secrets.sh [options] -- <command> [args...]

Options:
  --environment <dev|prod>  Which environment's vault to read. Default: prod
  --vault <name>            Key Vault name. Default: the key_vault_name Terraform output
                            for the selected environment's workspace.
  --list                    Print the variable names that would be set and exit. Never
                            prints values.
  -h, --help                Show this help.

Examples:
  ./scripts/with-azure-secrets.sh -- docker compose -f docker-compose.prod.yml up -d
  ./scripts/with-azure-secrets.sh -- docker compose -f docker-compose.prod.yml run --rm migrations
  ./scripts/with-azure-secrets.sh --environment dev --list

Values are passed to the command through its environment and are never written to disk.
There is deliberately no option to print them or to write an env file.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment) ENVIRONMENT="${2:?--environment needs a value}"; shift 2 ;;
    --vault)       VAULT_NAME="${2:?--vault needs a value}"; shift 2 ;;
    --list)        LIST_ONLY=true; shift ;;
    -h|--help)     usage; exit 0 ;;
    --)            shift; break ;;
    *)
      echo "Unknown option: $1" >&2
      echo >&2
      usage >&2
      exit 2
      ;;
  esac
done

case "$ENVIRONMENT" in
  dev|prod) ;;
  *) echo "--environment must be dev or prod, got '$ENVIRONMENT'" >&2; exit 2 ;;
esac

if [[ "$LIST_ONLY" == true ]]; then
  echo "Variables loaded from Key Vault for '$ENVIRONMENT':"
  for entry in "${SECRET_MAP[@]}"; do
    echo "  ${entry##*:}"
  done
  for entry in "${OPTIONAL_SECRET_MAP[@]}"; do
    echo "  ${entry##*:}   (optional)"
  done
  echo "  ACR_REPOSITORY   (from the acr_login_server output, not a secret)"
  exit 0
fi

if [[ $# -eq 0 ]]; then
  echo "No command given. Put it after --, e.g." >&2
  echo "  ./scripts/with-azure-secrets.sh -- docker compose -f docker-compose.prod.yml up -d" >&2
  exit 2
fi

for tool in az jq; do
  command -v "$tool" >/dev/null 2>&1 || { echo "$tool is required but not installed." >&2; exit 1; }
done

az account show >/dev/null 2>&1 || { echo "Not signed in to Azure. Run: az login" >&2; exit 1; }

# ── Resolve the vault ─────────────────────────────────────────────────────────
# TF_WORKSPACE selects the workspace for this one command without persisting the
# selection, so reading prod's outputs cannot leave the caller pointed at prod.

terraform_output() {
  local name="$1" workspace
  workspace=$([[ "$ENVIRONMENT" == "dev" ]] && echo "default" || echo "$ENVIRONMENT")
  TF_WORKSPACE="$workspace" terraform -chdir="$AZURE_DIR" output -raw "$name" 2>/dev/null || true
}

if [[ -z "$VAULT_NAME" ]]; then
  VAULT_NAME="$(terraform_output key_vault_name)"
fi

# Fallback: ask Azure. Terraform only writes outputs on apply, so key_vault_name is absent
# from a state applied before that output existed — the vault is there, the output is not.
# The resource group holds exactly one vault, so this resolves to the same name.
if [[ -z "$VAULT_NAME" ]]; then
  resource_group="$(terraform_output resource_group_name)"
  if [[ -n "$resource_group" ]]; then
    VAULT_NAME="$(az keyvault list \
      --resource-group "$resource_group" \
      --query "[0].name" -o tsv 2>/dev/null || true)"
  fi
fi

if [[ -z "$VAULT_NAME" ]]; then
  cat >&2 <<EOF
Could not determine the Key Vault name for '$ENVIRONMENT'.

It is read from that environment's Terraform state, then from the resource group itself.
Both come up empty when the environment has not been applied — production has not been
created on Azure yet.

Pass the vault explicitly if you know it:
  ./scripts/with-azure-secrets.sh --vault kv-liftoffprod-xxxxxx -- <command>
EOF
  exit 1
fi

echo "Loading secrets from $VAULT_NAME ($ENVIRONMENT)..." >&2

# ── Fetch ─────────────────────────────────────────────────────────────────────
# Each vault secret is fetched once even when it carries several values. Values go
# straight into the environment: never into a variable that is echoed, never into argv
# (which is world-readable in `ps`), never into a file.

# Parallel indexed arrays rather than an associative array: macOS ships bash 3.2, where
# `declare -A` does not exist. Seven entries, so a linear scan costs nothing.
CACHE_KEYS=()
CACHE_VALUES=()

fetch_secret() {
  local name="$1" i

  for i in "${!CACHE_KEYS[@]}"; do
    if [[ "${CACHE_KEYS[$i]}" == "$name" ]]; then
      printf '%s' "${CACHE_VALUES[$i]}"
      return 0
    fi
  done

  local value
  value="$(az keyvault secret show \
    --vault-name "$VAULT_NAME" \
    --name "$name" \
    --query value -o tsv 2>/dev/null || true)"

  CACHE_KEYS+=("$name")
  CACHE_VALUES+=("$value")
  printf '%s' "$value"
}

load() {
  local entry="$1" required="$2"
  local secret_name json_key var_name raw value

  secret_name="${entry%%:*}"
  var_name="${entry##*:}"
  json_key="${entry#*:}"
  json_key="${json_key%:*}"

  raw="$(fetch_secret "$secret_name")"

  if [[ -z "$raw" ]]; then
    if [[ "$required" == "required" ]]; then
      echo "Secret '$secret_name' is missing from $VAULT_NAME, or you lack Get on it." >&2
      echo "Data-plane access comes from the access policies in secrets.tf, not from Reader." >&2
      exit 1
    fi
    return 0
  fi

  if [[ -n "$json_key" ]]; then
    value="$(printf '%s' "$raw" | jq -r --arg k "$json_key" '.[$k] // empty')"
    if [[ -z "$value" && "$required" == "required" ]]; then
      echo "Key '$json_key' is missing from the '$secret_name' document in $VAULT_NAME." >&2
      exit 1
    fi
  else
    value="$raw"
  fi

  [[ -n "$value" ]] && export "$var_name=$value"
}

for entry in "${SECRET_MAP[@]}"; do
  load "$entry" required
done

for entry in "${OPTIONAL_SECRET_MAP[@]}"; do
  load "$entry" optional
done

# Not a secret, but it identifies the environment and the compose file needs it. Only set
# when the caller has not already chosen a registry.
if [[ -z "${ACR_REPOSITORY:-}" ]]; then
  acr="$(terraform_output acr_login_server)"
  [[ -n "$acr" ]] && export ACR_REPOSITORY="$acr"
fi

echo "Loaded $(( ${#SECRET_MAP[@]} + ${#OPTIONAL_SECRET_MAP[@]} )) values. Running: $*" >&2

exec "$@"
