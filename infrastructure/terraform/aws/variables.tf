# ---------------------------------------
# AWS Region
# ---------------------------------------
variable "aws_region" {
  description = "AWS region where AuraPerfume infrastructure will be deployed"
  type        = string
  default     = "ap-south-1"
}

# ---------------------------------------
# EC2 Instance
# ---------------------------------------
variable "instance_type" {
  description = "EC2 instance type for AuraPerfume DevOps node"
  type        = string
  default     = "m7i-flex.large"
}

variable "key_name" {
  description = "Existing AWS EC2 key pair name"
  type        = string
  default     = "auraperfume-key"
}

# ---------------------------------------
# Security
# ---------------------------------------
variable "public_ip_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "0.0.0.0/0"
}

# ---------------------------------------
# Tags
# ---------------------------------------
variable "owner_tag" {
  description = "Owner tag applied to all AWS resources"
  type        = string
  default     = "musa"
}

# ---------------------------------------
# Networking
# ---------------------------------------
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_a_cidr" {
  description = "CIDR block for public subnet A"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_b_cidr" {
  description = "CIDR block for public subnet B"
  type        = string
  default     = "10.0.2.0/24"
}

# ---------------------------------------
# Storage
# ---------------------------------------
variable "root_volume_size" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 30
}

# ---------------------------------------
# Node Ports
# ---------------------------------------
variable "jenkins_nodeport" {
  description = "NodePort for Jenkins"
  type        = number
  default     = 30081
}

variable "argocd_nodeport" {
  description = "NodePort for ArgoCD"
  type        = number
  default     = 32382
}

variable "grafana_nodeport" {
  description = "NodePort for Grafana"
  type        = number
  default     = 30300
}

variable "prometheus_nodeport" {
  description = "NodePort for Prometheus"
  type        = number
  default     = 30090
}

variable "app_nodeport" {
  description = "AuraPerfume application NodePort"
  type        = number
  default     = 30080
}
