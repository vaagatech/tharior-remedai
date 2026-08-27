output "cognito_user_pool_id" {
  description = "AWS Cognito User Pool ID"
  value       = aws_cognito_user_pool.pool.id
}

output "cognito_user_pool_arn" {
  description = "AWS Cognito User Pool ARN"
  value       = aws_cognito_user_pool.pool.arn
}

output "cognito_user_pool_endpoint" {
  description = "AWS Cognito User Pool Issuer Endpoint"
  value       = aws_cognito_user_pool.pool.endpoint
}

output "cognito_client_id" {
  description = "AWS Cognito App Client ID for UI"
  value       = aws_cognito_user_pool_client.client.id
}

output "s3_bucket_name" {
  description = "S3 Bucket Name for UI Static Assets"
  value       = aws_s3_bucket.ui_bucket.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID (used for cache invalidation in CI/CD)"
  value       = aws_cloudfront_distribution.ui_distribution.id
}

output "cloudfront_domain_name" {
  description = "Public URL for the UI"
  value       = "https://${aws_cloudfront_distribution.ui_distribution.domain_name}"
}
