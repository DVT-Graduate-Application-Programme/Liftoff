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

  common_tags = {
    environment = var.environment
    project     = var.project_name
    managed_by  = "opentofu"
  }
}

# ── Resource Group ────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.prefix}"
  location = var.location
  tags     = local.common_tags
}

# ── Blob Storage ───────────────────────────────────────────────────────────────
# Stores uploaded CVs and transcripts.
# Standard LRS = locally redundant, cheapest option.

resource "azurerm_storage_account" "main" {
  name                     = "st${substr(replace(local.prefix, "-", ""), 0, 14)}${local.suffix}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = local.common_tags
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
# Basic tier is sufficient: it supports queues, dead-lettering, and scheduled
# messages (used by the worker's delayed re-enqueue retry). It does NOT support
# topics/subscriptions or duplicate detection — move to Standard if those are needed.

resource "azurerm_servicebus_namespace" "main" {
  name                = "sb-${local.prefix}-${local.suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
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
