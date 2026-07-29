# ── Monitoring ────────────────────────────────────────────────────────────────
# Azure equivalent: Log Analytics + Application Insights + Azure Monitor Alerts
# AWS:             CloudWatch Logs + CloudWatch Alarms + SNS
# POC tier:        30-day log retention, essential alerts only

# ── Log Analytics Workspace (backing store for App Insights + Container Apps) ──

resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

# ── Application Insights (equivalent to CloudWatch + X-Ray) ──────────────────

resource "azurerm_application_insights" "main" {
  name                = "appi-${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = local.common_tags
}

# ── Action Group (equivalent to SNS topic + email subscription) ───────────────

resource "azurerm_monitor_action_group" "alerts" {
  name                = "ag-${local.prefix}-alerts"
  resource_group_name = azurerm_resource_group.main.name
  # short_name: max 12 chars, alphanumeric only.
  short_name = substr(replace(local.prefix, "-", ""), 0, 12)
  tags       = local.common_tags

  dynamic "email_receiver" {
    for_each = var.alert_email != "" ? [1] : []
    content {
      name          = "admin-email"
      email_address = var.alert_email
    }
  }
}

# ── Backend 5xx error alert (equivalent to backend-5xx CloudWatch alarm) ───────

resource "azurerm_monitor_metric_alert" "backend_5xx" {
  name                = "alert-${local.prefix}-backend-5xx"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_container_app.backend.id]
  description         = "Backend Container App returning 5xx errors"
  frequency           = "PT1M"
  window_size         = "PT5M"
  tags                = local.common_tags

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "Requests"
    aggregation      = "Count"
    operator         = "GreaterThan"
    threshold        = 5

    dimension {
      name     = "statusCodeCategory"
      operator = "Include"
      values   = ["5xx"]
    }
  }

  action {
    action_group_id = azurerm_monitor_action_group.alerts.id
  }
}

# ── Backend replica count alert (equivalent to backend-task-count CloudWatch alarm)

resource "azurerm_monitor_metric_alert" "backend_replicas" {
  name                = "alert-${local.prefix}-backend-replicas"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_container_app.backend.id]
  description         = "Backend Container App has no running replicas"
  frequency           = "PT1M"
  window_size         = "PT5M"
  tags                = local.common_tags

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "Replicas"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 1
  }

  action {
    action_group_id = azurerm_monitor_action_group.alerts.id
  }
}

# ── PostgreSQL storage alert (equivalent to rds-low-storage CloudWatch alarm) ──

resource "azurerm_monitor_metric_alert" "postgresql_storage" {
  name                = "alert-${local.prefix}-db-storage"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_postgresql_flexible_server.main.id]
  description         = "PostgreSQL storage above 80%"
  frequency           = "PT5M"
  window_size         = "PT15M"
  tags                = local.common_tags

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "storage_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.alerts.id
  }
}
