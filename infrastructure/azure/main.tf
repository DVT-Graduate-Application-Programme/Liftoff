# ==============================================================
# Random suffix
# Azure requires several resource names to be globally unique
# (Storage Accounts, Key Vaults, Service Bus, Web Apps).
# This generates a short random string appended to those names.
# ==============================================================
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

# ==============================================================
# Resource Group
# All resources for this project live inside a single group,
# making it easy to see costs and delete everything at once.
# ==============================================================
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.prefix}"
  location = var.location
  tags     = local.common_tags
}


# ==============================================================
# Blob Storage
# Stores uploaded CVs and transcripts.
# Standard LRS = locally redundant, cheapest option.
# ==============================================================
resource "azurerm_storage_account" "main" {
  # Storage account names: lowercase alphanumeric only, 3–24 chars, globally unique.
  name                     = "st${substr(replace(local.prefix, "-", ""), 0, 14)}${local.suffix}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = local.common_tags
}

resource "azurerm_storage_container" "cvs" {
  name                  = "cvs"
  storage_account_name = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "transcripts" {
  name                  = "transcripts"
  storage_account_name = azurerm_storage_account.main.name
  container_access_type = "private"
}


# ==============================================================
# Azure SQL
# Basic tier = 5 DTUs, 2 GB storage, ~$5/month.
# Appropriate for a POC with low concurrent load.
# ==============================================================
resource "azurerm_mssql_server" "main" {
  name                         = "sql-${local.prefix}-${local.suffix}"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_username
  administrator_login_password = var.sql_admin_password
  tags                         = local.common_tags
}

resource "azurerm_mssql_database" "main" {
  name      = "sqldb-${local.prefix}"
  server_id = azurerm_mssql_server.main.id
  sku_name  = "Basic"
  tags      = local.common_tags
}

# Allows other Azure services (e.g. the App Service) to reach the SQL Server.
resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}


# ==============================================================
# Service Bus
# Basic tier supports queues only (no topics/subscriptions).
# Sufficient for the POC application ingest queue.
# Upgrade to Standard if you need pub/sub later.
# ==============================================================
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
}


# ==============================================================
# App Service Plan + Linux Web App
# B1 Basic = 1 vCPU, 1.75 GB RAM, ~$13/month.
# Free (F1) tier exists but has no always-on and 60 CPU min/day cap.
# ==============================================================
resource "azurerm_service_plan" "main" {
  name                = "asp-${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = local.common_tags
}

resource "azurerm_linux_web_app" "main" {
  name                = "app-${local.prefix}-${local.suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on = true
    application_stack {
      dotnet_version = "8.0"
    }
  }

  # Wire App Insights into the web app automatically.
  app_settings = {
    "APPLICATIONINSIGHTS_CONNECTION_STRING"      = azurerm_application_insights.main.connection_string
    "ApplicationInsightsAgent_EXTENSION_VERSION" = "~3"
  }

  tags = local.common_tags
}


# ==============================================================
# Log Analytics Workspace + Application Insights
# Log Analytics is the backing store for App Insights in
# workspace-based mode (the current recommended approach).
# PerGB2018 SKU = pay per GB ingested, 30-day retention.
# ==============================================================
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

resource "azurerm_application_insights" "main" {
  name                = "appi-${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = local.common_tags
}


# ==============================================================
# Key Vault
# Stores all sensitive connection strings so they're never
# hard-coded in application config or source control.
# The access policy below grants your own Azure identity
# full secret access so you can inspect values after deploy.
# ==============================================================

# Pulls the object ID of the currently logged-in Azure identity.
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  # Key Vault names: 3–24 chars, alphanumeric + hyphens, globally unique.
  name                = "kv-${substr(replace(local.prefix, "-", ""), 0, 10)}-${local.suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # Grants the deploying identity (you) access to read/write secrets.
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge", "Recover"
    ]
  }

  tags = local.common_tags
}

# Store the SQL connection string as a secret.
resource "azurerm_key_vault_secret" "sql_connection_string" {
  name  = "SqlConnectionString"
  value = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${var.sql_admin_username};Password=${var.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  key_vault_id = azurerm_key_vault.main.id
}

# Store the Blob Storage connection string as a secret.
resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "StorageConnectionString"
  value        = azurerm_storage_account.main.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

# Store the Service Bus connection string as a secret.
resource "azurerm_key_vault_secret" "servicebus_connection_string" {
  name         = "ServiceBusConnectionString"
  value        = azurerm_servicebus_namespace.main.default_primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

# Store the App Insights connection string as a secret.
resource "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "AppInsightsConnectionString"
  value        = azurerm_application_insights.main.connection_string
  key_vault_id = azurerm_key_vault.main.id
}
