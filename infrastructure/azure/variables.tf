variable "project_name" {
  description = "Short project identifier used as a prefix on all resource names."
  type        = string
  default     = "gradrecruit"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region to deploy resources into."
  type        = string
  default     = "southafricanorth"
}

variable "sql_admin_username" {
  description = "Administrator username for the Azure SQL Server."
  type        = string
  default     = "sqladmin"
}

variable "sql_admin_password" {
  description = "Administrator password for the Azure SQL Server. Must meet Azure complexity requirements."
  type        = string
  sensitive   = true # Prevents this value from being printed in tofu output/logs.
}
