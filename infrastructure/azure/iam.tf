# ── Team access ───────────────────────────────────────────────────────────────
# Read-only access for the team, granted to an Entra ID security group rather than
# to individuals. Onboarding/offboarding is then a directory operation
# (`az ad group member add/remove`) and never needs a Terraform run.
#
# The group itself is deliberately NOT managed here. Creating it would require the
# azuread provider and Directory.ReadWrite permissions on whatever identity runs
# apply — including the CI service principal, which only holds Contributor on the
# resource group. The group is created once by hand and referenced by object ID.

resource "azurerm_role_assignment" "team_readers" {
  # Skipped when no group is configured, which is how prod can be applied before its own
  # reader group exists in Entra. Each environment needs a distinct group — see the
  # variable description in variables.tf for why sharing one would collide.
  count = var.reader_group_object_id != "" ? 1 : 0

  # Subscription scope, not resource-group scope. This was originally scoped to the
  # resource group, which is tighter but breaks the portal for everyone holding it: the
  # default "All resources" blade and the Subscriptions blade both enumerate at
  # subscription scope, so they fail with
  #
  #   "An error occurred when trying to fetch resources ... (Code: AccessDenied)"
  #
  # even though the resource group itself is perfectly readable via a direct link. The
  # subscription holds only this project plus the auto-created NetworkWatcherRG, so
  # widening the scope costs no meaningful isolation and makes the portal usable.
  #
  # This widens *reach*, never *rights* — Reader is still read-only everywhere it lands.
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Reader"
  principal_id         = var.reader_group_object_id

  description = "Control-plane read-only access for the team (liftoff-dev-readers)."
}

# Adding `count` above moves the existing dev assignment from
# azurerm_role_assignment.team_readers to ...[0]. Without this block Terraform reads that as
# "destroy one role assignment, create another" — which briefly revokes the team's portal
# access on the next apply.
moved {
  from = azurerm_role_assignment.team_readers
  to   = azurerm_role_assignment.team_readers[0]
}

# Deliberately NOT granted, so that "Reader" really means read-only:
#
#   Storage Blob Data Reader  — would let members download candidate CVs and
#                               transcripts. Reader alone cannot read blob contents.
#   Key Vault access policy   — Key Vault data plane is governed by the access
#                               policies in secrets.tf, not by RBAC, so Reader
#                               cannot list or get secret values. Leave it that way.
#   Monitoring Reader         — not needed for portal browsing; add only if the team
#                               needs to run KQL against app logs.
#
# Note that Reader also cannot call listSecrets on a Container App or listKeys on the
# storage account — those are actions, and actions are Contributor-and-above only.
