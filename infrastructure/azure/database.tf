# ── Database ───────────────────────────────────────────────────────────────────
# Azure equivalent: Azure Database for PostgreSQL Flexible Server
# AWS:             Amazon RDS for PostgreSQL 16
# POC tier:        B_Standard_B1ms (1 vCore burstable), 32 GB, single zone

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${local.prefix}-${local.suffix}"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "16"
  administrator_login    = var.db_username
  administrator_password = var.db_password

  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768

  # Azure picks an availability zone at creation time when none is requested, and this
  # server landed in zone 2. Leaving it unset made the provider read the real zone on
  # refresh and then plan a change back to "", which it rejects with:
  #   `zone` can only be changed when exchanged with the zone specified in
  #   `high_availability.0.standby_availability_zone`
  # A zone move is only legal as an HA standby exchange, and HA is disabled here, so the
  # zone is pinned to what the server actually runs in. Changing this value forces a
  # replacement of the server — and with it, the database.
  zone = "2"

  # POC: no geo-redundant backup, 7-day retention
  backup_retention_days        = 7
  geo_redundant_backup_enabled = false

  tags = local.common_tags
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Allows Azure services (Container Apps) to reach the PostgreSQL server.
# Equivalent to the ECS security group inbound rule on AWS RDS.
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
