output "resource_group_name" {
  description = "Name of the provisioned resource group."
  value       = azurerm_resource_group.main.name
}

output "frontend_url" {
  description = "Public URL to access the frontend Container App."
  value       = "https://${azurerm_container_app.frontend.latest_revision_fqdn}"
}

output "api_url" {
  description = "Public URL to access the backend API."
  value       = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
}

output "acr_login_server" {
  description = "ACR login server — use as the registry URL for docker push/pull."
  value       = azurerm_container_registry.main.login_server
}

output "acr_backend_repository" {
  description = "Full ACR repository path for the backend image — use as ACR_BACKEND_REPOSITORY GitHub secret."
  value       = "${azurerm_container_registry.main.login_server}/backend"
}

output "acr_frontend_repository" {
  description = "Full ACR repository path for the frontend image — use as ACR_FRONTEND_REPOSITORY GitHub secret."
  value       = "${azurerm_container_registry.main.login_server}/frontend"
}

output "acr_worker_repository" {
  description = "Full ACR repository path for the worker image — use as ACR_WORKER_REPOSITORY GitHub secret."
  value       = "${azurerm_container_registry.main.login_server}/worker"
}

output "acr_migrations_repository" {
  description = "Full ACR repository path for the migrations image — use as ACR_MIGRATIONS_REPOSITORY GitHub secret."
  value       = "${azurerm_container_registry.main.login_server}/migrations"
}

output "migrations_job_name" {
  description = "Container Apps Job that applies EF Core migrations — use as MIGRATIONS_JOB GitHub secret."
  value       = azurerm_container_app_job.migrations.name
}

output "container_app_environment_name" {
  description = "Container Apps Environment name — use as CONTAINER_APP_ENV GitHub secret."
  value       = azurerm_container_app_environment.main.name
}

output "backend_container_app_name" {
  description = "Backend Container App name — use as BACKEND_CONTAINER_APP GitHub secret."
  value       = azurerm_container_app.backend.name
}

output "frontend_container_app_name" {
  description = "Frontend Container App name — use as FRONTEND_CONTAINER_APP GitHub secret."
  value       = azurerm_container_app.frontend.name
}

output "worker_container_app_name" {
  description = "Worker Container App name — use as WORKER_CONTAINER_APP GitHub secret."
  value       = azurerm_container_app.worker.name
}

output "postgresql_fqdn" {
  description = "PostgreSQL Flexible Server FQDN."
  value       = azurerm_postgresql_flexible_server.main.fqdn
  sensitive   = true
}

output "key_vault_name" {
  description = "Name of the Key Vault."
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "URI of the Key Vault — used by apps to fetch secrets at runtime."
  value       = azurerm_key_vault.main.vault_uri
}

output "storage_account_name" {
  description = "Name of the Blob Storage account."
  value       = azurerm_storage_account.main.name
}

output "servicebus_namespace" {
  description = "Name of the Service Bus namespace."
  value       = azurerm_servicebus_namespace.main.name
}

output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace resource ID — for linking external diagnostic settings."
  value       = azurerm_log_analytics_workspace.main.id
}

output "app_insights_connection_string" {
  description = "Application Insights connection string — wire into app config."
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}
