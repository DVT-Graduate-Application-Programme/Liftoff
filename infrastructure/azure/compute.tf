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

  secret {
    name  = "servicebus-connection-string"
    value = azurerm_servicebus_namespace.main.default_primary_connection_string
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

      env {
        name        = "SERVICEBUS_CONNECTION_STRING"
        secret_name = "servicebus-connection-string"
      }

      liveness_probe {
        path                    = "/health"
        port                    = 8080
        transport               = "HTTP"
        initial_delay           = 60
        interval_seconds        = 30
        failure_count_threshold = 3
      }
    }
  }
}

# ── Worker Container App ───────────────────────────────────────────────────────
# Standalone background worker: consumes the application-ingest queue and hands
# each CV off to the hiring agent. Runs a single always-on replica (min = max = 1)
# so the queue is drained continuously. Internal ingress exposes the guarded admin
# endpoints (e.g. dead-letter replay) and the /health probe within the Container
# Apps environment, without making them publicly reachable.

resource "azurerm_container_app" "worker" {
  name                         = "ca-${local.prefix}-worker"
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
    name  = "servicebus-connection-string"
    value = azurerm_servicebus_namespace.main.default_primary_connection_string
  }

  secret {
    name  = "worker-admin-api-key"
    value = var.worker_admin_api_key
  }

  ingress {
    external_enabled = false
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
      name   = "worker"
      image  = var.worker_image != "" ? var.worker_image : "${azurerm_container_registry.main.login_server}/worker:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "DOTNET_ENVIRONMENT"
        value = "Development"
      }

      # Bind Kestrel (admin + /health endpoints) to the ingress target port.
      env {
        name  = "ASPNETCORE_URLS"
        value = "http://+:8080"
      }

      env {
        name        = "SERVICEBUS_CONNECTION_STRING"
        secret_name = "servicebus-connection-string"
      }

      # When empty the worker leaves its admin endpoints disabled (returns 503).
      env {
        name        = "Worker__AdminApiKey"
        secret_name = "worker-admin-api-key"
      }

      # Worker__HiringAgentBaseUrl falls back to appsettings.json; override it with the
      # hiring agent's internal Container Apps URL once that service is deployed here.

      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.main.connection_string
      }

      liveness_probe {
        path                    = "/health"
        port                    = 8080
        transport               = "HTTP"
        initial_delay           = 30
        interval_seconds        = 30
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

  # Auth.js / Microsoft Entra ID credentials for recruiter sign-in. Secret names match the
  # ones already on the deployed app, so declaring them here adopts the existing secrets
  # rather than replacing them.
  secret {
    name  = "auth-secret"
    value = var.auth_secret
  }

  secret {
    name  = "auth-microsoft-entra-id-id"
    value = var.auth_microsoft_entra_id_id
  }

  secret {
    name  = "auth-microsoft-entra-id-secret"
    value = var.auth_microsoft_entra_id_secret
  }

  secret {
    name  = "auth-microsoft-entra-id-issuer"
    value = var.auth_microsoft_entra_id_issuer
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

      # Next.js standalone server binds to localhost by default, which the Container Apps
      # ingress cannot reach.
      env {
        name  = "HOSTNAME"
        value = "0.0.0.0"
      }

      # Auth.js builds OAuth callback URLs from AUTH_URL, so it must be the app's stable
      # public hostname. Composed from the environment's default domain rather than this
      # app's own fqdn attribute, which would be a self-reference and a dependency cycle.
      env {
        name  = "AUTH_URL"
        value = "https://ca-${local.prefix}-frontend.${azurerm_container_app_environment.main.default_domain}"
      }

      # Ingress terminates TLS and forwards over HTTP, so Auth.js must trust the
      # X-Forwarded-* headers to derive https callback URLs instead of http.
      env {
        name  = "AUTH_TRUST_HOST"
        value = "true"
      }

      env {
        name        = "AUTH_SECRET"
        secret_name = "auth-secret"
      }

      env {
        name        = "AUTH_MICROSOFT_ENTRA_ID_ID"
        secret_name = "auth-microsoft-entra-id-id"
      }

      env {
        name        = "AUTH_MICROSOFT_ENTRA_ID_SECRET"
        secret_name = "auth-microsoft-entra-id-secret"
      }

      env {
        name        = "AUTH_MICROSOFT_ENTRA_ID_ISSUER"
        secret_name = "auth-microsoft-entra-id-issuer"
      }
    }
  }
}
