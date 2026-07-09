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

# ── Auth (frontend) ───────────────────────────────────────────────────────────

variable "auth_secret" {
  description = "NextAuth AUTH_SECRET — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

variable "auth_microsoft_entra_id_id" {
  description = "Microsoft Entra ID application (client) ID — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

variable "auth_microsoft_entra_id_secret" {
  description = "Microsoft Entra ID client secret — set in terraform.tfvars, never hardcode here."
  type        = string
  sensitive   = true
}

variable "auth_microsoft_entra_id_issuer" {
  description = "Microsoft Entra ID issuer URL — set in terraform.tfvars, never hardcode here."
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

# ── Monitoring ────────────────────────────────────────────────────────────────

variable "alert_email" {
  description = "Email address to receive Azure Monitor alert notifications."
  type        = string
  default     = ""
}
