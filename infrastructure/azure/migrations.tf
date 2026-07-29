# ── Database migrations ────────────────────────────────────────────────────────
# Azure equivalent: Azure Container Apps Job (manual trigger)
# AWS:              one-off ECS RunTask — see ../aws/migrations.tf
#
# Applies the EF Core migrations in backend/src/Infrastructure/Migrations before a new
# application image is rolled out. The image is built from backend/Dockerfile.migrations and
# contains an `efbundle` executable that applies only the migrations not yet recorded in the
# __EFMigrationsHistory table, then exits.
#
# Why a job inside the Container Apps environment rather than a step on the CI runner:
# the Flexible Server firewall only admits Azure services (see database.tf), so running the
# migration here needs no temporary public firewall rule for the GitHub runner's IP and no
# database credentials leaving Azure. It also means the migration executes from the same
# network position as the application that will use the schema.
#
# CI starts it with `az containerapp job start` and blocks on the execution result, so a
# failed migration fails the deploy before any new image reaches the Container Apps.

resource "azurerm_container_app_job" "migrations" {
  name                         = "caj-${local.prefix}-migrations"
  location                     = azurerm_resource_group.main.location
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  tags                         = local.common_tags

  # A migration that has not finished in 10 minutes is not going to; fail rather than
  # leave the deploy pipeline hanging. EF takes an advisory lock for the duration, so a
  # second execution would block instead of corrupting the schema.
  replica_timeout_in_seconds = 600

  # No automatic retry: efbundle is idempotent, but a failure here is almost always a bad
  # migration, and re-running it only delays the signal to the pipeline.
  replica_retry_limit = 0

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

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

  template {
    container {
      name   = "migrations"
      image  = var.migrations_image != "" ? var.migrations_image : "${azurerm_container_registry.main.login_server}/migrations:latest"
      cpu    = 0.5
      memory = "1Gi"

      # No args: efbundle resolves its connection through
      # GradRecruitmentDbContextFactory, which reads these variables. Passing
      # --connection instead would put the password in the process command line.
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
    }
  }

  # The database must exist before the job can be created against it.
  depends_on = [azurerm_postgresql_flexible_server_database.main]
}
