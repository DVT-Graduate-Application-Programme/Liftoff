output "frontend_url" {
  description = "Public URL to access the frontend"
  value       = "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  description = "Public URL to access the backend API"
  value       = "http://${aws_lb.main.dns_name}/api"
}

output "alb_dns_name" {
  description = "Raw ALB DNS name (for DNS CNAME records)"
  value       = aws_lb.main.dns_name
}

output "ecr_backend_url" {
  description = "Full ECR repository URL for the backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_backend_repository_name" {
  description = "ECR repository name — use this as the ECR_BACKEND_REPOSITORY GitHub secret"
  value       = aws_ecr_repository.backend.name
}

output "ecr_frontend_url" {
  description = "Full ECR repository URL for the frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_frontend_repository_name" {
  description = "ECR repository name — use this as the ECR_FRONTEND_REPOSITORY GitHub secret"
  value       = aws_ecr_repository.frontend.name
}

output "ecs_cluster_name" {
  description = "ECS cluster name — use this as the ECS_CLUSTER GitHub secret"
  value       = aws_ecs_cluster.main.name
}

output "ecs_backend_service_name" {
  description = "ECS backend service name — use this as the ECS_BACKEND_SERVICE GitHub secret"
  value       = aws_ecs_service.backend.name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "secrets_db_arn" {
  description = "Secrets Manager ARN for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "sns_alerts_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications"
  value       = aws_sns_topic.alerts.arn
}
