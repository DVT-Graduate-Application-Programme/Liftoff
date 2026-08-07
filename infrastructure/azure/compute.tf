# ── Compute ────────────────────────────────────────────────────────────────────
# Azure equivalent: Azure Container Registry + Azure Container Apps
# AWS:             ECR + ECS Fargate + ALB
# POC tier:        0.25 vCPU / 0.5 GB per app, min replicas = 1
#
# Routing mirrors the AWS ALB listener rules:
#   /          → frontend Container App (external ingress on port 3000)
#   /api/* etc → backend Container App  (external ingress on port 5000)

# ── Azure Container Registry (equivalent to ECR) ──────────────────────────────

resource "azurerm_container_registry" "main" {
  # ACR names: alphanumeric only, 5–50 chars, globally unique.
  name                = "cr${substr(replace(local.prefix, "-", ""), 0, 18)}${local.suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = local.env.acr_sku
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

  # Uploaded CVs and transcripts live in the storage account's private containers. Without
  # this the backend would write them to the replica's own disk, where every restart or
  # revision rollout loses them.
  secret {
    name  = "storage-connection-string"
    value = azurerm_storage_account.main.primary_connection_string
  }

  secret {
    name  = "internal-api-key"
    value = var.internal_api_key
  }

  ingress {
    external_enabled = true

    # Matches ASPNETCORE_URLS=http://+:5000 baked into backend/Dockerfile, and the port the
    # backend is published on locally in docker-compose.yml. Keeping Azure on the image's
    # own port means the deployed environment behaves the same as the local one, with no
    # env override to keep in sync.
    target_port = 5000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    # dev runs a single replica; prod runs at least two so a revision rollout or a crashed
    # replica is not an outage. Safe to scale because the API is stateless — note that
    # src/Api/BackgroundServices/EmailPollingWorker.cs is present but never registered with
    # AddHostedService. Registering it would make every replica poll the same mailbox, and
    # prod would then need it moved into the worker or gated to a single instance.
    min_replicas = local.env.backend_min_replicas
    max_replicas = local.env.backend_max_replicas

    container {
      name   = "backend"
      image  = var.backend_image != "" ? var.backend_image : "${azurerm_container_registry.main.login_server}/backend:latest"
      cpu    = local.env.backend_cpu
      memory = local.env.backend_memory

      # Development in dev, Production in prod (environments.tf). Program.cs maps the
      # OpenAPI document and the Scalar UI only under Development, so prod stops serving
      # /scalar and stops returning developer exception pages.
      #
      # This is set here as well as in the image (backend/Dockerfile targets) because the
      # container-level value is the one an operator can read off the deployed app.
      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = local.env.app_environment_name
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

      env {
        name        = "STORAGE_CONNECTION_STRING"
        secret_name = "storage-connection-string"
      }

      env {
        name        = "INTERNAL_API_KEY"
        secret_name = "internal-api-key"
      }

      env {
        name  = "NOTIFICATIONS__NEXTJS__WEBHOOKURL"
        value = "https://${local.frontend_app_name}.${azurerm_container_app_environment.main.default_domain}/api/internal/notify"
      }


      liveness_probe {
        path                    = "/health"
        port                    = 5000
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
      cpu    = local.env.worker_cpu
      memory = local.env.worker_memory

      env {
        name  = "DOTNET_ENVIRONMENT"
        value = local.env.app_environment_name
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

      # The worker is the only service that talks to the hiring agent. appsettings.json has no
      # value for this and WorkerOptions has no default, so the worker fails at startup rather
      # than silently pointing at a host that does not exist. The agent's internal ingress FQDN
      # is reachable from inside the Container Apps environment only, over HTTPS on 443.
      env {
        name  = "Worker__HiringAgentBaseUrl"
        value = "https://${azurerm_container_app.hiring_agent.ingress[0].fqdn}"
      }

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

# ── Hiring Agent Container App ─────────────────────────────────────────────────
# Python/FastAPI resume-scoring agent (backend/src/AI/hiring-agent). The worker POSTs
# /notify with a candidate id; the agent enqueues it and a background task pulls the CV
# and transcript from the backend, scores them with the configured LLM, and POSTs the
# result back to /internal/evaluation using the shared internal API key.
#
# Internal ingress only: the worker is the sole caller, from inside this Container Apps
# environment, and /notify has no auth of its own.
#
# min = max = 1 is a correctness constraint, not a cost choice. job_queue.InMemoryJobQueue
# is an asyncio.Queue living in the process, so a second replica would hold a queue the
# notifying replica cannot see, and a scale-to-zero would drop everything still queued.

resource "azurerm_container_app" "hiring_agent" {
  name                         = "ca-${local.prefix}-hiring-agent"
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

  # Same key the backend holds, so X-Internal-Api-Key on the evaluation callback matches.
  secret {
    name  = "internal-api-key"
    value = var.internal_api_key
  }

  secret {
    name  = "gemini-api-key"
    value = var.gemini_api_key
  }

  # secret {
  #  name  = "github-token"
  #  value = var.github_token
  # }

  ingress {
    external_enabled = false

    # Matches EXPOSE 8001 / uvicorn --port 8001 in the agent's Dockerfile and the port it
    # is published on in docker-compose.yml.
    target_port = 8001

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name  = "hiring-agent"
      image = var.hiring_agent_image != "" ? var.hiring_agent_image : "${azurerm_container_registry.main.login_server}/hiring-agent:latest"

      # Larger than the .NET apps: PyMuPDF rendering plus the tesseract OCR fallback on
      # scanned PDFs is the memory peak, and extraction runs one LLM call per resume
      # section. 0.5/1.0Gi is the smallest valid Container Apps pairing above the 0.25/0.5Gi
      # the other apps use.
      cpu    = local.env.hiring_agent_cpu
      memory = local.env.hiring_agent_memory

      # Stable app FQDN, not latest_revision_fqdn — see the note on the frontend below.
      env {
        name  = "BACKEND_BASE_URL"
        value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
      }

      env {
        name        = "INTERNAL_API_KEY"
        secret_name = "internal-api-key"
      }

      env {
        name  = "LLM_PROVIDER"
        value = var.llm_provider
      }

      env {
        name  = "DEFAULT_MODEL"
        value = var.hiring_agent_model
      }

      # Empty unless LLM_PROVIDER=gemini; prompt.py reads it either way.
      env {
        name        = "GEMINI_API_KEY"
        secret_name = "gemini-api-key"
      }

      # Optional — raises the GitHub API rate limit when enriching a candidate's profile.
      #env {
      #  name        = "GITHUB_TOKEN"
      #  secret_name = "github-token"
      #}

      # Off in Azure: development mode writes resume_evaluations.csv and caches extraction
      # JSON under cache/, both of which are lost on every revision and only useful locally.
      env {
        name  = "DEVELOPMENT_MODE"
        value = "False"
      }

      # No liveness probe. The app exposes only POST /notify — there is no health endpoint
      # to poll, and Container Apps' default TCP check on the ingress port already restarts
      # a replica whose uvicorn process has died. Add an HTTP probe here if /health lands.
    }
  }
}

# ── Frontend Container App ────────────────────────────────────────────────────

resource "azurerm_container_app" "frontend" {
  name                         = local.frontend_app_name
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

  # Auth.js (frontend/src/auth.ts) reads these at runtime. Without them the app builds and
  # serves, but every sign-in fails — which is what happened when these were declared as
  # variables and written to Key Vault without ever being wired to the container.
  #
  # Secret names are lower-case with hyphens: Container Apps rejects underscores.
  secret {
    name  = "auth-secret"
    value = var.auth_secret
  }

  secret {
    name  = "auth-entra-client-id"
    value = var.auth_microsoft_entra_id_id
  }

  secret {
    name  = "auth-entra-client-secret"
    value = var.auth_microsoft_entra_id_secret
  }

  secret {
    name  = "auth-entra-issuer"
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
    min_replicas = local.env.frontend_min_replicas
    max_replicas = local.env.frontend_max_replicas

    container {
      name   = "frontend"
      image  = var.frontend_image != "" ? var.frontend_image : "${azurerm_container_registry.main.login_server}/frontend:latest"
      cpu    = local.env.frontend_cpu
      memory = local.env.frontend_memory

      # The app's stable FQDN, not latest_revision_fqdn. The revision-scoped hostname
      # changes on every backend deploy (ca-...-backend--0000032 -> --0000033), which both
      # produced a permanent diff on this resource and pinned the frontend to one specific
      # revision. revision_mode is "Single" with 100% traffic to the latest revision, so
      # this hostname always routes to the current backend.
      env {
        name  = "BACKEND_URL"
        value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
      }

      env {
        name  = "NEXT_PUBLIC_BACKEND_URL"
        value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
      }

      # ── Auth.js ───────────────────────────────────────────────────────────
      # session.strategy is "jwt" (frontend/src/auth.ts), so AUTH_SECRET is required to
      # sign and encrypt the token. Auth.js reads it implicitly from the environment,
      # which is why it never appears in the source.
      env {
        name        = "AUTH_SECRET"
        secret_name = "auth-secret"
      }

      env {
        name        = "AUTH_MICROSOFT_ENTRA_ID_ID"
        secret_name = "auth-entra-client-id"
      }

      env {
        name        = "AUTH_MICROSOFT_ENTRA_ID_SECRET"
        secret_name = "auth-entra-client-secret"
      }

      env {
        name        = "AUTH_MICROSOFT_ENTRA_ID_ISSUER"
        secret_name = "auth-entra-issuer"
      }

      # Auth.js v5 only trusts the incoming Host header when this is set, when running on
      # Vercel, or outside production. Behind Container Apps' ingress none of those hold,
      # so without it every sign-in fails with UntrustedHost even once the values above
      # are present.
      env {
        name  = "AUTH_TRUST_HOST"
        value = "true"
      }

      # Pins the OAuth redirect_uri to the app's stable ingress hostname.
      #
      # Without this, AUTH_TRUST_HOST makes Auth.js build redirect_uri from the incoming
      # request's Host header. Reaching the app through a revision hostname
      # (ca-...-frontend--0000002.<domain>) would then send Entra a redirect_uri that is not
      # in the app registration, and sign-in fails with AADSTS50011. Pinning it means the
      # value is identical on every revision, so exactly one URI needs registering.
      #
      # Built from the environment's default_domain rather than
      # azurerm_container_app.frontend.ingress[0].fqdn: a resource cannot reference its own
      # attributes without creating a dependency cycle. Container Apps composes external
      # ingress FQDNs as "<app-name>.<default_domain>", so this resolves to the same value.
      env {
        name  = "AUTH_URL"
        value = "https://ca-${local.prefix}-frontend.${azurerm_container_app_environment.main.default_domain}"
      }
    }
  }
}
