variable "location" {
  description = "Azure region to deploy resources into."
  type        = string
  default     = "southafricanorth"
}

variable "project_name" {
  description = "Short project identifier used as a prefix on all resource names."
  type        = string
  default     = "liftoff"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
  default     = "dev"
}

# ── Database ──────────────────────────────────────────────────────────────────

variable "db_name" {
  description = "PostgreSQL database name — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "PostgreSQL administrator username — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL administrator password — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

# ── Compute ───────────────────────────────────────────────────────────────────

variable "backend_image" {
  description = "Fully-qualified ACR image URI for the backend container."
  type        = string
  default     = ""
}

variable "frontend_image" {
  description = "Fully-qualified ACR image URI for the frontend container."
  type        = string
  default     = ""
}

variable "worker_image" {
  description = "Fully-qualified ACR image URI for the background worker container."
  type        = string
  default     = ""
}

variable "migrations_image" {
  description = "Fully-qualified ACR image URI for the EF Core migrations job container (built from backend/Dockerfile.migrations)."
  type        = string
  default     = ""
}

variable "worker_admin_api_key" {
  description = "API key guarding the worker admin endpoints (X-Admin-Api-Key header). Set in terraform.tfvars. When empty, the worker disables its admin endpoints."
  type        = string
  sensitive   = true
  default     = ""
}

# ── Frontend authentication (Auth.js + Microsoft Entra ID) ────────────────────
# These were already present in terraform.tfvars but had no variable blocks, so Terraform
# ignored them and planned to strip the corresponding secrets from the live frontend.
# All four are surfaced to the container as Container App secrets, matching the secret
# names already on the deployed app so declaring them causes no churn.

variable "auth_secret" {
  description = "Auth.js secret used to encrypt session cookies (AUTH_SECRET) — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

variable "auth_microsoft_entra_id_id" {
  description = "Microsoft Entra ID application (client) ID used for recruiter sign-in — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

variable "auth_microsoft_entra_id_secret" {
  description = "Microsoft Entra ID client secret used for recruiter sign-in — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

variable "auth_microsoft_entra_id_issuer" {
  description = "Microsoft Entra ID issuer URL (tenant-scoped OIDC authority) — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

# ── Monitoring ────────────────────────────────────────────────────────────────

variable "alert_email" {
  description = "Email address to receive Azure Monitor alert notifications."
  type        = string
  default     = ""
}
