# ── Compute ────────────────────────────────────────────────────────────────────
# Azure equivalent: Azure Container Registry + Azure Container Apps
# AWS:             ECR + ECS Fargate + ALB
# POC tier:        0.25 vCPU / 0.5 GB per app, min replicas = 1
#
# Routing mirrors the AWS ALB listener rules:
#   /          → frontend Container App (external ingress on port 3000)
#   /api/* etc → backend Container App  (external ingress on port 8080)

# ── Azure Container Registry (equivalent to ECR) ──────────────────────────────

resource "azurerm_container_registry" "main" {
  # ACR names: alphanumeric only, 5–50 chars, globally unique.
  name                = "cr${substr(replace(local.prefix, "-", ""), 0, 18)}${local.suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = local.common_tags
}

# ── Managed Identity (equivalent to IAM execution + task roles for ECS) ───────

resource "azurerm_user_assigned_identity" "container_apps" {
  name                = "id-${local.prefix}-apps"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = local.common_tags
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.container_apps.principal_id
}

# ── Container Apps Environment (equivalent to ECS cluster) ───────────────────

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${local.prefix}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.common_tags
}

# ── Backend Container App ──────────────────────────────────────────────────────

resource "azurerm_container_app" "backend" {
  name                         = "ca-${local.prefix}-backend"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_apps.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.container_apps.id
  }

  secret {
    name  = "postgres-user"
    value = var.db_username
  }

  secret {
    name  = "postgres-password"
    value = var.db_password
  }

  ingress {
    external_enabled = true
    target_port      = 8080

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name   = "backend"
      image  = var.backend_image != "" ? var.backend_image : "${azurerm_container_registry.main.login_server}/backend:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Development"
      }

      env {
        name  = "POSTGRES_HOST"
        value = azurerm_postgresql_flexible_server.main.fqdn
      }

      env {
        name  = "POSTGRES_PORT"
        value = "5432"
      }

      env {
        name  = "POSTGRES_DB"
        value = var.db_name
      }

      env {
        name        = "POSTGRES_USER"
        secret_name = "postgres-user"
      }

      env {
        name        = "POSTGRES_PASSWORD"
        secret_name = "postgres-password"
      }

      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.main.connection_string
      }

      liveness_probe {
        path                    = "/health"
        port                    = 8080
        transport               = "HTTP"
        initial_delay           = 60
        period_seconds          = 30
        failure_count_threshold = 3
      }
    }
  }
}

# ── Frontend Container App ────────────────────────────────────────────────────

resource "azurerm_container_app" "frontend" {
  name                         = "ca-${local.prefix}-frontend"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_apps.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.container_apps.id
  }

  ingress {
    external_enabled = true
    target_port      = 3000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name   = "frontend"
      image  = var.frontend_image != "" ? var.frontend_image : "${azurerm_container_registry.main.login_server}/frontend:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "BACKEND_URL"
        value = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
      }

      env {
        name  = "NEXT_PUBLIC_BACKEND_URL"
        value = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
      }
    }
  }
}
