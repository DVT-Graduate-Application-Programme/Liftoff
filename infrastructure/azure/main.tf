# ── Global Resources ──────────────────────────────────────────────────────────
# Azure requires several resource names to be globally unique (Storage Accounts,
# Key Vaults, ACR). This generates a short random string appended to those names.

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  prefix = "${var.project_name}-${var.environment}"
  suffix = random_string.suffix.result

  frontend_app_name = "ca-${var.project_name}-${var.environment}-frontend"

  common_tags = {
    environment = var.environment
    project     = var.project_name
    managed_by  = "terraform"
  }
}

# ── Resource Group ────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.prefix}"
  location = var.location
  tags     = local.common_tags
}

# Production only. A CanNotDelete lock makes `terraform destroy`, and any accidental portal
# delete, fail on the resource group and everything in it. Removing it is a deliberate
# two-step: flip resource_group_lock_enabled in environments.tf, apply, then destroy.
resource "azurerm_management_lock" "resource_group" {
  count      = local.env.resource_group_lock_enabled ? 1 : 0
  name       = "lock-${local.prefix}"
  scope      = azurerm_resource_group.main.id
  lock_level = "CanNotDelete"
  notes      = "Production environment — delete protection. Managed by Terraform (environments.tf)."
}

# ── Blob Storage ───────────────────────────────────────────────────────────────
# Stores uploaded CVs and transcripts.
# Replication is per-environment (environments.tf): LRS in dev, GRS in prod.

resource "azurerm_storage_account" "main" {
  name                     = "st${substr(replace(local.prefix, "-", ""), 0, 14)}${local.suffix}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = local.env.storage_replication_type
  tags                     = local.common_tags

  # Candidate documents are POPIA records: no anonymous access, TLS only.
  allow_nested_items_to_be_public = false
  min_tls_version                 = "TLS1_2"

  blob_properties {
    # A deleted blob stays recoverable for this many days. The application deletes nothing
    # today, so this only ever guards against an operator or a script.
    delete_retention_policy {
      days = local.env.storage_blob_retention_days
    }

    container_delete_retention_policy {
      days = local.env.storage_blob_retention_days
    }

    # Prod keeps prior versions of an overwritten blob; dev does not, to keep the bill flat.
    versioning_enabled = local.env.storage_versioning_enabled
  }
}

resource "azurerm_storage_container" "cvs" {
  name                  = "cvs"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "transcripts" {
  name                  = "transcripts"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# ── Service Bus ───────────────────────────────────────────────────────────────
# Application ingest queue for async processing. The backend publishes a
# CvProcessingMessage on ingest and the worker consumes it.
#
# Basic tier is sufficient in dev: it supports queues, dead-lettering, and scheduled
# messages (used by the worker's delayed re-enqueue retry). It does NOT support
# topics/subscriptions or duplicate detection — prod runs Standard for that headroom
# (environments.tf).

resource "azurerm_servicebus_namespace" "main" {
  name                = "sb-${local.prefix}-${local.suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = local.env.servicebus_sku
  tags                = local.common_tags
}

resource "azurerm_servicebus_queue" "application_ingest" {
  name         = "application-ingest"
  namespace_id = azurerm_servicebus_namespace.main.id

  # Mirrors servicebus-emulator/Config.json so local and cloud behave identically.
  # The worker tracks its own delayed-retry counter, but max_delivery_count stays the
  # backstop that moves genuinely stuck messages to the dead-letter sub-queue; enabling
  # dead-lettering on TTL expiry ensures expired messages surface there too, never silently lost.
  max_delivery_count                   = 10
  lock_duration                        = "PT1M"
  default_message_ttl                  = "PT1H"
  dead_lettering_on_message_expiration = true
}
