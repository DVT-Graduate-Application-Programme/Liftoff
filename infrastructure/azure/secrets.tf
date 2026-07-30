# ── Secrets ────────────────────────────────────────────────────────────────────
# Azure equivalent: Azure Key Vault
# AWS:             AWS Secrets Manager
# POC tier:        Standard SKU, no automatic secret rotation

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  # Key Vault names: 3–24 chars, alphanumeric + hyphens, globally unique.
  name                = "kv-${substr(replace(local.prefix, "-", ""), 0, 10)}-${local.suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
  tags                = local.common_tags
}

# Access policy: deployer identity — full secret management
resource "azurerm_key_vault_access_policy" "deployer" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = ["Get", "List", "Set", "Delete", "Purge", "Recover"]
}

# Access policy: Container Apps managed identity — read-only at runtime
resource "azurerm_key_vault_access_policy" "container_apps" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.container_apps.principal_id

  secret_permissions = ["Get", "List"]
}

# ── DB credentials (equivalent to AWS Secrets Manager liftoff/db-credentials) ──

resource "azurerm_key_vault_secret" "db_credentials" {
  name = "db-credentials"
  value = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = azurerm_postgresql_flexible_server.main.fqdn
    port     = 5432
    dbname   = var.db_name
  })
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.deployer]
}

# ── App secrets (equivalent to AWS Secrets Manager liftoff/app-secrets) ────────

resource "azurerm_key_vault_secret" "app_secrets" {
  name = "app-secrets"
  # Placeholder — populate with real keys before deploying
  value = jsonencode({
    GEMINI_API_KEY                 = "replace-me"
    OLLAMA_BASE_URL                = "replace-me"
    AUTH_SECRET                    = var.auth_secret
    AUTH_MICROSOFT_ENTRA_ID_ID     = var.auth_microsoft_entra_id_id
    AUTH_MICROSOFT_ENTRA_ID_SECRET = var.auth_microsoft_entra_id_secret
    AUTH_MICROSOFT_ENTRA_ID_ISSUER = var.auth_microsoft_entra_id_issuer
  })
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.deployer]
}

# ── Supplementary connection strings ──────────────────────────────────────────

resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "StorageConnectionString"
  value        = azurerm_storage_account.main.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.deployer]
}

resource "azurerm_key_vault_secret" "servicebus_connection_string" {
  name         = "ServiceBusConnectionString"
  value        = azurerm_servicebus_namespace.main.default_primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.deployer]
}

resource "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "AppInsightsConnectionString"
  value        = azurerm_application_insights.main.connection_string
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.deployer]
}

# Worker admin API key — stored for reference; the worker Container App consumes it
# via its own inline secret. Only created when a key is actually configured.
resource "azurerm_key_vault_secret" "worker_admin_api_key" {
  count        = var.worker_admin_api_key != "" ? 1 : 0
  name         = "WorkerAdminApiKey"
  value        = var.worker_admin_api_key
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.deployer]
}
