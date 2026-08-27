variable "aws_region" {
  description = "The AWS Region to deploy UI and Cognito resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "remedai"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Custom domain name for the CloudFront distribution (optional, e.g. app.example.com)"
  type        = string
  default     = ""
}
