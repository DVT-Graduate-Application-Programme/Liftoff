output "resource_group_name" {
  description = "Name of the provisioned resource group."
  value       = azurerm_resource_group.main.name
}

# Both use the app's stable ingress FQDN rather than latest_revision_fqdn. The
# revision-scoped hostname changes on every deploy (ca-...-backend--0000032 -> --0000033),
# so it goes stale as soon as anything is redeployed. revision_mode is "Single" with 100%
# of traffic on the latest revision, so the ingress hostname always routes to the current
# revision. This matches the BACKEND_URL wiring in compute.tf.

output "frontend_url" {
  description = "Public URL to access the frontend Container App."
  value       = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}

output "api_url" {
  description = "Public URL to access the backend API."
  value       = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
}

output "acr_login_server" {
  description = "ACR login server — use as the registry URL for docker push/pull."
  value       = azurerm_container_registry.main.login_server
}

# No per-image repository outputs. The deploy workflow composes image paths itself as
# "${ACR_REPOSITORY}/${matrix.component}", so it needs only the registry host above —
# one secret instead of four that drift apart every time the registry is recreated.

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

output "hiring_agent_container_app_name" {
  description = "Hiring agent Container App name — use as HIRING_AGENT_CONTAINER_APP GitHub secret."
  value       = azurerm_container_app.hiring_agent.name
}

# Internal ingress: resolvable only from inside the Container Apps environment. Exposed
# here so the worker's Worker__HiringAgentBaseUrl can be verified without opening the portal.
output "hiring_agent_internal_url" {
  description = "Internal URL of the hiring agent — reachable only from within the Container Apps environment."
  value       = "https://${azurerm_container_app.hiring_agent.ingress[0].fqdn}"
}

output "postgresql_fqdn" {
  description = "PostgreSQL Flexible Server FQDN."
  value       = azurerm_postgresql_flexible_server.main.fqdn
  sensitive   = true
}


output "key_vault_name" {
  description = "Key Vault holding the application secrets — read by scripts/with-azure-secrets.sh."
  value       = azurerm_key_vault.main.name
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
