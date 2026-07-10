# ── Secrets ───────────────────────────────────────────────────────────────────
# Azure equivalent: Azure Key Vault
# AWS:             AWS Secrets Manager
# POC tier:        No automatic rotation (add rotation lambda for prod)

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${local.name_prefix}/db-credentials"
  recovery_window_in_days = 0 # immediate deletion for POC
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = aws_db_instance.postgres.address
    port     = 5432
    dbname   = var.db_name
  })
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${local.name_prefix}/app-secrets"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  # Placeholder — populate with real keys before deploying
  secret_string = jsonencode({
    GEMINI_API_KEY  = "replace-me"
    OLLAMA_BASE_URL = "replace-me"
  })
}
