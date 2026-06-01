variable "vpc_id" {
  description = "VPC ID where the security group will be created"
  type        = string
}

variable "public_ip_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "0.0.0.0/0"
}

variable "owner_tag" {
  description = "Owner tag applied to resources"
  type        = string
}
