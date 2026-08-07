# ── Environment matrix ────────────────────────────────────────────────────────
# Every difference between dev and prod lives in this one map. The rest of the stack reads
# `local.env.<setting>` and is otherwise environment-agnostic, so a change of tier or size
# is a one-line diff here and a reviewer can see both columns side by side.
#
# Secrets are NOT here — they come from the per-environment tfvars file
# (secrets.dev.tfvars / secrets.prod.tfvars, both gitignored). This file is committed and
# must stay free of credentials.
#
# ── State separation ─────────────────────────────────────────────────────────
# One root module, one state file per environment, selected by Terraform workspace:
#
#   dev   →  workspace "default"  (the existing terraform.tfstate — unchanged)
#   prod  →  workspace "prod"     (terraform.tfstate.d/prod/terraform.tfstate)
#
# `terraform_data.environment_guard` below fails the plan when the workspace and
# var.environment disagree, so a prod apply cannot be pointed at dev's state.
#
# See README.md in this directory for the commands.

locals {
  # Which environment the current workspace deploys. "default" is dev for the same reason
  # dev keeps the default workspace: it is the environment that already exists, and
  # renaming its workspace would mean migrating live state for no benefit.
  workspace_environment = terraform.workspace == "default" ? "dev" : terraform.workspace

  environments = {
    # ── Development ───────────────────────────────────────────────────────────
    # Cheapest tier that runs the whole stack. Disposable: purge-on-destroy is on and
    # nothing is locked, so the resource group can be torn down and rebuilt at will.
    dev = {
      # ASPNETCORE_ENVIRONMENT / DOTNET_ENVIRONMENT for the .NET apps. Development also
      # exposes the OpenAPI document and Scalar UI (Program.cs gates them on this name),
      # which is why the deployed dev API serves /scalar.
      app_environment_name = "Development"

      # Database
      db_sku_name                     = "B_Standard_B1ms"
      db_storage_mb                   = 32768
      db_backup_retention_days        = 7
      db_geo_redundant_backup_enabled = false
      # Pinned to the zone this server actually landed in — see database.tf. Changing it
      # forces a replacement of the server, and with it the database.
      db_zone = "2"

      # Storage — locally redundant is enough for documents that can be re-ingested.
      storage_replication_type    = "LRS"
      storage_blob_retention_days = 7
      storage_versioning_enabled  = false

      # Registry / messaging
      acr_sku        = "Basic"
      servicebus_sku = "Basic"

      # Compute. One replica each: cheapest, and enough for a POC's traffic.
      backend_min_replicas  = 1
      backend_max_replicas  = 1
      backend_cpu           = 0.25
      backend_memory        = "0.5Gi"
      frontend_min_replicas = 1
      frontend_max_replicas = 1
      frontend_cpu          = 0.25
      frontend_memory       = "0.5Gi"
      worker_cpu            = 0.25
      worker_memory         = "0.5Gi"
      hiring_agent_cpu      = 0.5
      hiring_agent_memory   = "1Gi"

      # Observability
      log_retention_days  = 30
      alert_5xx_threshold = 5

      # Safety rails, all off: dev is meant to be destroyable.
      key_vault_purge_protection_enabled = false
      key_vault_purge_on_destroy         = true
      resource_group_lock_enabled        = false
    }

    # ── Production ────────────────────────────────────────────────────────────
    # NOT YET APPLIED — no prod resource group exists on Azure. These values are the
    # intended shape of that environment; treat the first `terraform plan -var-file=...` against
    # workspace "prod" as a costing review before anyone applies it.
    prod = {
      # Production hides the OpenAPI document and the Scalar UI, and turns off the
      # developer exception page, so stack traces stop reaching callers.
      app_environment_name = "Production"

      # Database — General Purpose rather than Burstable: burstable credits run out under
      # sustained load and the server then throttles to a fraction of one vCore.
      # 35 days is the Flexible Server maximum for point-in-time restore.
      db_sku_name                     = "GP_Standard_D2s_v3"
      db_storage_mb                   = 65536
      db_backup_retention_days        = 35
      db_geo_redundant_backup_enabled = true
      # Unpinned: let Azure place the server, then pin this to the zone it chose, exactly
      # as dev is pinned. Leaving it unset permanently would make every later plan try to
      # reset the zone to "" — the diff described in database.tf.
      db_zone = null

      # Storage — GRS replicates candidate documents to the paired region. These are POPIA
      # records; losing them to a regional failure is not recoverable by re-ingesting.
      storage_replication_type    = "GRS"
      storage_blob_retention_days = 30
      storage_versioning_enabled  = true

      # Standard ACR: 100 GB included storage and higher throughput than Basic, which
      # matters once every merge to main pushes five images.
      acr_sku = "Standard"
      # Standard Service Bus: Basic has no topics/subscriptions and no duplicate detection.
      # The queue in use today works on Basic, but prod is where a second consumer or a
      # dead-letter topic gets added, and the tier change is not in-place free of downtime.
      servicebus_sku = "Standard"

      # Compute. Two replicas for the request-serving apps so a revision rollout or a
      # crashed replica is not an outage.
      #
      # The worker and the hiring agent stay single-replica — see compute.tf. The agent's
      # job queue is in-process, and the worker's delayed-retry bookkeeping assumes one
      # consumer. Scaling either needs a code change first, not a Terraform change.
      backend_min_replicas  = 2
      backend_max_replicas  = 4
      backend_cpu           = 0.5
      backend_memory        = "1Gi"
      frontend_min_replicas = 2
      frontend_max_replicas = 4
      frontend_cpu          = 0.5
      frontend_memory       = "1Gi"
      worker_cpu            = 0.5
      worker_memory         = "1Gi"
      hiring_agent_cpu      = 1.0
      hiring_agent_memory   = "2Gi"

      # Observability — 90 days of logs covers a full intake cycle for audit questions.
      log_retention_days = 90
      # Tighter than dev: in prod a handful of 5xx is already worth waking someone for.
      alert_5xx_threshold = 3

      # Safety rails on. purge_protection_enabled cannot be turned off once enabled and
      # blocks permanent deletion of the vault for the soft-delete window; the resource
      # group lock makes `terraform destroy` fail rather than delete production.
      key_vault_purge_protection_enabled = true
      key_vault_purge_on_destroy         = false
      resource_group_lock_enabled        = true
    }
  }

  env = local.environments[var.environment]
}

# ── Workspace guard ───────────────────────────────────────────────────────────
# Without this, `terraform apply -var-file=secrets.prod.tfvars` from the default workspace would
# read dev's state, see resources named rg-liftoff-dev, and plan to rename or replace every
# one of them — i.e. destroy the running dev environment while believing it was creating
# prod. The precondition is evaluated during plan, so the mistake fails before it can be
# confirmed.
resource "terraform_data" "environment_guard" {
  input = var.environment

  lifecycle {
    precondition {
      condition     = var.environment == local.workspace_environment
      error_message = <<-EOT
        Workspace/environment mismatch: workspace "${terraform.workspace}" deploys "${local.workspace_environment}", but var.environment is "${var.environment}".

        Select the matching workspace first:
          dev   ->  terraform workspace select default
          prod  ->  terraform workspace select prod   (terraform workspace new prod, the first time)
      EOT
    }
  }
}
