# ── Database ──────────────────────────────────────────────────────────────────
# Azure equivalent: Azure SQL (managed SQL Server)
# AWS:             Amazon RDS for PostgreSQL
# POC tier:        db.t3.micro, single-AZ, no Multi-AZ, 20 GB gp2

resource "aws_db_subnet_group" "postgres" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "postgres" {
  identifier        = "${local.name_prefix}-postgres"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # POC: single AZ, no read replica, no performance insights (cost saving)
  multi_az                        = false
  publicly_accessible             = false
  performance_insights_enabled    = false
  deletion_protection             = false
  skip_final_snapshot             = true
  backup_retention_period         = 7
  auto_minor_version_upgrade      = true

  tags = { Name = "${local.name_prefix}-postgres" }
}
