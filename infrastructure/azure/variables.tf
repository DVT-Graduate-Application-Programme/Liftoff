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

# ── Monitoring ────────────────────────────────────────────────────────────────

variable "alert_email" {
  description = "Email address to receive Azure Monitor alert notifications."
  type        = string
  default     = ""
}
