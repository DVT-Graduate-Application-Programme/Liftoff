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
  description = <<-EOT
    Deployment environment. Must be a key of local.environments in environments.tf, which
    is where every dev/prod difference (tiers, replicas, retention, safety rails) is
    defined. The workspace must match — see terraform_data.environment_guard.
  EOT
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be \"dev\" or \"prod\" — add a block to local.environments in environments.tf before introducing a third."
  }
}

variable "subscription_id" {
  description = "Azure subscription id."
  type        = string
}

variable "tenant_id" {
  description = "Azure tenant id."
  type        = string
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

variable "hiring_agent_image" {
  description = "Fully-qualified ACR image URI for the Python hiring agent container (built from backend/src/AI/hiring-agent/Dockerfile)."
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

# -- Backend --
variable "internal_api_key" {
  description = "Internal api key for the backend and hiring agent to use"
  type        = string
  sensitive   = true
}

# ── Hiring agent (LLM) ────────────────────────────────────────────────────────
# There is no Ollama server in this environment, so the deployed agent has to run against
# a hosted provider. Leaving llm_provider at "ollama" would make every evaluation fail at
# the first LLM call.

variable "llm_provider" {
  description = "LLM backend for the hiring agent: \"gemini\" or \"ollama\". Only gemini is reachable from Azure — there is no Ollama server deployed."
  type        = string
  default     = "gemini"

  validation {
    condition     = contains(["gemini", "ollama"], var.llm_provider)
    error_message = "llm_provider must be either \"gemini\" or \"ollama\"."
  }
}

variable "hiring_agent_model" {
  description = "Model name passed to the LLM provider (DEFAULT_MODEL). Must be a key in the hiring agent's prompt.py MODEL_PROVIDER_MAPPING."
  type        = string
  default     = "gemini-3.1-flash-lite"
}

variable "gemini_api_key" {
  description = "Google Gemini API key used by the hiring agent — set in terraform.tfvars, never hardcode here. Required when llm_provider is \"gemini\"."
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_token" {
  description = "Optional GitHub token used by the hiring agent to raise API rate limits when enriching candidate profiles. Set in terraform.tfvars."
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

variable "secrets_operator_object_id" {
  description = <<-EOT
    Object ID of the Entra user or security group granted Get/List on the Key Vault's
    secrets. Needed by anyone running scripts/with-azure-secrets.sh, which loads the stack's
    configuration from the vault rather than from a local .env file.

    Empty grants nobody beyond the deployer and the Container Apps identity — that is the
    default, and the right setting for prod until someone actually needs it. Reader on the
    subscription does not confer this: Key Vault's data plane is governed by access
    policies, not RBAC.
  EOT
  type        = string
  default     = ""
}

# ── Monitoring ────────────────────────────────────────────────────────────────

variable "alert_email" {
  description = "Email address to receive Azure Monitor alert notifications."
  type        = string
  default     = ""
}

# ── Team access ───────────────────────────────────────────────────────────────

variable "reader_group_object_id" {
  description = <<-EOT
    Object ID of the Entra ID security group granted the built-in Reader role. Created
    out-of-band via `az ad group create`; membership is managed in Entra, not here.

    Empty skips the role assignment entirely, which is what lets prod be applied before its
    own reader group exists. Give each environment a distinct group: the assignment is
    subscription-scoped (see iam.tf), so the same group id in both environments would be
    the same assignment, and whichever stack applies second fails on the duplicate.
  EOT
  type        = string
  default     = ""
}
