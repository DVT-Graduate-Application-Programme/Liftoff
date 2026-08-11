#!/usr/bin/env bash
#
# Invite people to the Azure read-only group.
#
# The team's read access to Azure comes from one Entra ID security group
# (liftoff-dev-readers) that holds the built-in Reader role on rg-liftoff-dev.
#
# For each email it will:
#   1. Look the person up in the tenant. Teammates on their own company accounts are not
#      in this tenant, so they must first be invited as B2B guests.
#   2. Send a guest invitation if they are not there yet.
#   3. Add them to the group, which is what actually grants Reader.
#
# Safe to run repeatedly: people already in the tenant are not re-invited (no duplicate
# emails), and people already in the group are skipped.
#
# Access granted is control plane only — browsing resources, config and metrics in the
# portal. It does NOT include reading blob contents (candidate CVs/transcripts), Key Vault
# secret values, or Container App secrets. See infrastructure/azure/iam.tf for why.
#
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────

# Must match reader_group_object_id in infrastructure/azure/terraform.tfvars — that is the
# group iam.tf assigns Reader to. Passing a different --group grants nothing by itself.
GROUP="liftoff-dev-readers"

# Where the invitation email's "Accept" button lands them. The portal is the useful
# destination since control-plane read access is a portal/CLI activity.
REDIRECT_URL="https://portal.azure.com"

# ── Options ──────────────────────────────────────────────────────────────────

DRY_RUN=false
SEND_EMAIL=true
FROM_FILE=""
EMAILS=""

usage() {
  cat <<'EOF'
Invite people to the Azure read-only group (liftoff-dev-readers).

Usage:
  ./scripts/invite-readers.sh <email> [email...]
  ./scripts/invite-readers.sh --from-file <path>
  cat emails.txt | ./scripts/invite-readers.sh

Options:
  --from-file <path>    Read addresses from a file. One per line; blank lines and
                        lines starting with # are ignored. Commas also separate.
  --group <name|id>     Target group. Default: liftoff-dev-readers
  --redirect-url <url>  Where the invite's Accept link lands. Default: https://portal.azure.com
  --no-email            Create the guest account without sending an invitation email.
                        Use when you would rather share the redeem link yourself.
  --dry-run             Print what would happen without inviting or adding anyone
  -h, --help            Show this help

Examples:
  ./scripts/invite-readers.sh thabo@dvt.co.za
  ./scripts/invite-readers.sh thabo@dvt.co.za naledi@dvt.co.za sipho@dvt.co.za
  ./scripts/invite-readers.sh --from-file team-emails.txt --dry-run
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-file)    FROM_FILE="${2:?--from-file needs a value}"; shift 2 ;;
    --group)        GROUP="${2:?--group needs a value}"; shift 2 ;;
    --redirect-url) REDIRECT_URL="${2:?--redirect-url needs a value}"; shift 2 ;;
    --no-email)     SEND_EMAIL=false; shift ;;
    --dry-run)      DRY_RUN=true; shift ;;
    -h|--help)      usage; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; echo "Try --help" >&2; exit 2 ;;
    *)  EMAILS="$EMAILS $1"; shift ;;
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
skip() { echo "  ${DIM}·${RESET} $*"; }
warn() { echo "  ${YELLOW}!${RESET} $*" >&2; }
die()  { echo "${RED}error:${RESET} $*" >&2; exit 1; }

# Plain counters rather than arrays: macOS still ships bash 3.2, where referencing an
# empty array under `set -u` is an unbound-variable error.
INVITED_COUNT=0
ADDED_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0
FAILED_NAMES=""

fail() {
  warn "$1"
  FAILED_COUNT=$((FAILED_COUNT + 1))
  FAILED_NAMES="$FAILED_NAMES $2"
}

# ── Collect addresses ────────────────────────────────────────────────────────

if [[ -n "$FROM_FILE" ]]; then
  [[ -f "$FROM_FILE" ]] || die "No such file: $FROM_FILE"
  EMAILS="$EMAILS $(sed -e 's/#.*//' -e 's/,/ /g' "$FROM_FILE" | tr '\n' ' ')"
fi

# Accept a piped list so this composes with other tooling. Only when stdin is not a
# terminal, otherwise an argument-less run would hang waiting for input instead of
# printing usage.
if [[ -z "${EMAILS// /}" && ! -t 0 ]]; then
  EMAILS="$(sed -e 's/#.*//' -e 's/,/ /g' | tr '\n' ' ')"
fi

if [[ -z "${EMAILS// /}" ]]; then
  usage
  exit 2
fi

# ── Preflight ────────────────────────────────────────────────────────────────

info "Checking prerequisites"

command -v az >/dev/null 2>&1 || die "Azure CLI not found. Install: brew install azure-cli"
az account show >/dev/null 2>&1 || die "Not logged in to Azure. Run: az login"
ok "Azure authenticated as $(az account show --query user.name -o tsv)"

GROUP_ID="$(az ad group show --group "$GROUP" --query id -o tsv 2>/dev/null)" \
  || die "Group '$GROUP' not found in this tenant.
       Create it first:
         az ad group create --display-name '$GROUP' --mail-nickname '$GROUP'
       then set reader_group_object_id in infrastructure/azure/terraform.tfvars and apply."

GROUP_NAME="$(az ad group show --group "$GROUP_ID" --query displayName -o tsv)"
ok "Target group: $GROUP_NAME ${DIM}($GROUP_ID)${RESET}"

# Needed to reconstruct guest UPNs in find_user_id below.
TENANT_DOMAIN="$(az rest --method GET --url "https://graph.microsoft.com/v1.0/domains" \
  --query "value[?isDefault].id" -o tsv 2>/dev/null | head -1)" \
  || die "Could not read the tenant's default domain from Microsoft Graph."
[[ -n "$TENANT_DOMAIN" ]] || die "Tenant has no default domain — cannot resolve guest accounts."
ok "Tenant domain: $TENANT_DOMAIN"

# A group only grants access if something assigns it a role. Checking here turns a silent
# no-op ("I added everyone and they still see nothing") into an explicit warning.
SCOPE_ROLES="$(az role assignment list --assignee "$GROUP_ID" --all \
  --query "[].roleDefinitionName" -o tsv 2>/dev/null || true)"
if [[ -z "$SCOPE_ROLES" ]]; then
  warn "This group holds no Azure role assignments — members will see nothing."
  warn "Expected 'Reader' on rg-liftoff-dev from infrastructure/azure/iam.tf. Has it been applied?"
else
  ok "Group roles: $(echo "$SCOPE_ROLES" | tr '\n' ' ')"
fi

if [[ "$DRY_RUN" == true ]]; then
  info "${YELLOW}Dry run${RESET} — nothing will be invited or added"
fi

# ── Invite and add ───────────────────────────────────────────────────────────

# Turns thabo.mokoena@dvt.co.za into "Thabo Mokoena" so the directory is not a wall of
# raw addresses. Purely cosmetic; the person can change it once they redeem.
display_name_from() {
  echo "${1%%@*}" | tr '._-' '   ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1'
}

# Finding an existing person by email needs three attempts, because there is no single
# attribute that reliably holds it:
#
#   mail                 populated for most users, but null for guests invited without a
#                        mail attribute — so this alone silently misses real members and
#                        the script would re-invite someone who is already here.
#   userPrincipalName    equals the email for native tenant members.
#   mangled UPN          guests get thabo@dvt.co.za rewritten as
#                        thabo_dvt.co.za#EXT#@<tenant default domain>. Reconstructing it
#                        is what catches guests whose mail attribute is empty.
find_user_id() {
  local email="$1" id mangled

  id="$(az ad user list --filter "mail eq '$email'" --query "[0].id" -o tsv 2>/dev/null || true)"
  [[ -n "$id" ]] && { printf '%s' "$id"; return; }

  id="$(az ad user list --filter "userPrincipalName eq '$email'" --query "[0].id" -o tsv 2>/dev/null || true)"
  [[ -n "$id" ]] && { printf '%s' "$id"; return; }

  mangled="$(echo "$email" | tr '@' '_')#EXT#@${TENANT_DOMAIN}"
  az ad user list --filter "userPrincipalName eq '$mangled'" --query "[0].id" -o tsv 2>/dev/null || true
}

info "Processing $(echo "$EMAILS" | wc -w | tr -d ' ') address(es)"

for email in $EMAILS; do
  # Validate before interpolating into the JSON body below. This regex admits no quotes or
  # backslashes, which is what makes the inline JSON safe to build with printf.
  if ! echo "$email" | grep -qE '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'; then
    fail "skipped '$email' — not a valid email address" "$email"
    continue
  fi

  user_id="$(find_user_id "$email")"

  # ── Step 1: invite as a guest if not already in the tenant ──
  if [[ -z "$user_id" ]]; then
    if [[ "$DRY_RUN" == true ]]; then
      echo "  ${DIM}would invite${RESET} $email ${DIM}as \"$(display_name_from "$email")\"${RESET}"
    else
      body="$(printf '{"invitedUserEmailAddress":"%s","invitedUserDisplayName":"%s","inviteRedirectUrl":"%s","sendInvitationMessage":%s}' \
        "$email" "$(display_name_from "$email")" "$REDIRECT_URL" "$SEND_EMAIL")"

      user_id="$(az rest --method POST \
        --url "https://graph.microsoft.com/v1.0/invitations" \
        --headers "Content-Type=application/json" \
        --body "$body" \
        --query "invitedUser.id" -o tsv 2>/dev/null)" || user_id=""

      if [[ -z "$user_id" ]]; then
        fail "could not invite $email — check you have permission to invite guests" "$email"
        continue
      fi

      INVITED_COUNT=$((INVITED_COUNT + 1))
      if [[ "$SEND_EMAIL" == true ]]; then
        ok "invited $email ${DIM}(invitation email sent)${RESET}"
      else
        ok "invited $email ${DIM}(no email sent — share the redeem link yourself)${RESET}"
      fi
    fi
  else
    skip "$email already in the tenant"
  fi

  # In a dry run an uninvited person has no object id yet, so there is nothing further to
  # report for them beyond the "would invite" line above.
  if [[ "$DRY_RUN" == true && -z "$user_id" ]]; then
    continue
  fi

  # ── Step 2: add to the group — this is what actually grants Reader ──
  is_member="$(az ad group member check --group "$GROUP_ID" --member-id "$user_id" \
    --query value -o tsv 2>/dev/null || echo "false")"

  if [[ "$is_member" == "true" ]]; then
    skip "$email already in $GROUP_NAME"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "  ${DIM}would add${RESET} $email ${DIM}to $GROUP_NAME${RESET}"
    continue
  fi

  if az ad group member add --group "$GROUP_ID" --member-id "$user_id" >/dev/null 2>&1; then
    ADDED_COUNT=$((ADDED_COUNT + 1))
    ok "added $email to $GROUP_NAME"
  else
    fail "could not add $email to $GROUP_NAME" "$email"
  fi
done

# ── Summary ──────────────────────────────────────────────────────────────────

echo
if [[ "$DRY_RUN" == true ]]; then
  info "Dry run complete — no changes made"
  exit 0
fi

info "Done: ${INVITED_COUNT} invited, ${ADDED_COUNT} added to $GROUP_NAME, ${SKIPPED_COUNT} already members"

if [[ "$FAILED_COUNT" -gt 0 ]]; then
  warn "$FAILED_COUNT address(es) failed:${FAILED_NAMES}"
  exit 1
fi

if [[ "$ADDED_COUNT" -gt 0 ]]; then
  cat <<EOF

  ${BOLD}Tell the people you just added:${RESET}
    • Accept the emailed invitation first — access does nothing until they redeem it.
    • In the portal, switch directory (top-right account menu) to this tenant.
      They land in their own company tenant by default and will see none of your resources.
    • Role assignments take a few minutes to propagate. If the subscription looks
      empty right after redeeming, sign out and back in before debugging.

  Verify membership any time:
    az ad group member list --group $GROUP_NAME -o table
EOF
fi
