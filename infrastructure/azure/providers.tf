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

  # Minimum OpenTofu version
  required_version = ">= 1.6.0"
}

provider "azurerm" {
  features {
    key_vault {
      # Fully removes Key Vault on destroy instead of soft-deleting it.
      # Useful in dev so you can re-run apply with the same name.
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}
