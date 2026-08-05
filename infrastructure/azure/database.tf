# ── Database ───────────────────────────────────────────────────────────────────
# Azure equivalent: Azure Database for PostgreSQL Flexible Server
# AWS:             Amazon RDS for PostgreSQL 16
#
# Sizing, backup retention and redundancy are per-environment — see environments.tf.
# dev:  B_Standard_B1ms (1 vCore burstable), 32 GB, 7-day local backups
# prod: GP_Standard_D2s_v3, 64 GB, 35-day geo-redundant backups

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${local.prefix}-${local.suffix}"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "16"
  administrator_login    = var.db_username
  administrator_password = var.db_password

  sku_name   = local.env.db_sku_name
  storage_mb = local.env.db_storage_mb

  # Azure picks an availability zone at creation time when none is requested, and this
  # server landed in zone 2. Leaving it unset made the provider read the real zone on
  # refresh and then plan a change back to "", which it rejects with:
  #   `zone` can only be changed when exchanged with the zone specified in
  #   `high_availability.0.standby_availability_zone`
  # A zone move is only legal as an HA standby exchange, and HA is disabled here, so the
  # zone is pinned to what the server actually runs in. Changing this value forces a
  # replacement of the server — and with it, the database.
  #
  # dev is pinned to "2"; prod is null until the server is created, then pinned to whatever
  # Azure chose. See environments.tf.
  zone = local.env.db_zone

  backup_retention_days        = local.env.db_backup_retention_days
  geo_redundant_backup_enabled = local.env.db_geo_redundant_backup_enabled

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
