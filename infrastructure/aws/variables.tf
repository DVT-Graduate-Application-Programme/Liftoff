variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "af-south-1"
}

variable "project_name" {
  description = "Project name used in resource naming and tags"
  type        = string
  default     = "liftoff"
}

# ── Database ────────────────────────────────────────────────────────────────

variable "db_name" {
  description = "PostgreSQL database name — set in terraform.tfvars, never hardcode here"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "PostgreSQL master username — set in terraform.tfvars, never hardcode here"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password — set in terraform.tfvars, never hardcode here"
  type        = string
  sensitive   = true
}

# ── Compute ─────────────────────────────────────────────────────────────────

variable "backend_image" {
  description = "Fully-qualified ECR image URI for the backend container"
  type        = string
  default     = ""
}

variable "frontend_image" {
  description = "Fully-qualified ECR image URI for the frontend container"
  type        = string
  default     = ""
}

# ── Monitoring ───────────────────────────────────────────────────────────────

variable "alert_email" {
  description = "Email address to receive CloudWatch alarm notifications"
  type        = string
  default     = ""
}
