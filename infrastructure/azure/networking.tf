# ── Networking ────────────────────────────────────────────────────────────────
# Mirrors AWS layout: public subnets for Container Apps, private subnets for
# PostgreSQL. NSGs enforce the same traffic rules as AWS security groups.

resource "azurerm_virtual_network" "main" {
  name                = "vnet-${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  address_space       = ["10.0.0.0/16"]
  tags                = local.common_tags
}

# ── Public subnets (Container Apps) ──────────────────────────────────────────

resource "azurerm_subnet" "public" {
  count                = 2
  name                 = "${local.prefix}-public-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.${count.index}.0/24"]
}

# ── Private subnets (PostgreSQL) ──────────────────────────────────────────────

resource "azurerm_subnet" "private" {
  count                = 2
  name                 = "${local.prefix}-private-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.${count.index + 10}.0/24"]
}

# ── NSG: Container Apps (equivalent to ALB + ECS security groups) ─────────────

resource "azurerm_network_security_group" "container_apps" {
  name                = "nsg-${local.prefix}-container-apps"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = local.common_tags
}

resource "azurerm_subnet_network_security_group_association" "public" {
  count                     = 2
  subnet_id                 = azurerm_subnet.public[count.index].id
  network_security_group_id = azurerm_network_security_group.container_apps.id
}

# ── NSG: PostgreSQL (equivalent to RDS security group) ────────────────────────

resource "azurerm_network_security_group" "postgresql" {
  name                = "nsg-${local.prefix}-postgresql"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  security_rule {
    name                       = "AllowPostgreSQLFromVNet"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "10.0.0.0/16"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = local.common_tags
}

resource "azurerm_subnet_network_security_group_association" "private" {
  count                     = 2
  subnet_id                 = azurerm_subnet.private[count.index].id
  network_security_group_id = azurerm_network_security_group.postgresql.id
}
