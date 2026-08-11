terraform {
  required_providers {
    azurerm = {
      source  = "registry.terraform.io/hashicorp/azurerm"
      version = "~> 3.100"
    }
    random = {
      source  = "registry.terraform.io/hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Minimum Terraform version
  required_version = ">= 1.6.0"
}

provider "azurerm" {
  subscription_id            = var.subscription_id
  tenant_id                  = var.tenant_id
  skip_provider_registration = true
  features {
    key_vault {
      # dev: fully removes the Key Vault on destroy instead of soft-deleting it, so apply
      # can be re-run with the same name.
      # prod: false — a destroyed vault stays recoverable, and purge_protection_enabled
      # (secrets.tf) would refuse the purge anyway.
      purge_soft_delete_on_destroy    = local.env.key_vault_purge_on_destroy
      recover_soft_deleted_key_vaults = true
    }
  }
}
