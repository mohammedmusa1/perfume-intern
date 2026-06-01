terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "auraperfume-terraform-state"
    key    = "aws/terraform.tfstate"
    region = "ap-south-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# -----------------------------
# Networking
# -----------------------------
module "networking" {
  source = "./networking"

  aws_region = var.aws_region
  owner_tag  = var.owner_tag
}

# -----------------------------
# Security Groups
# -----------------------------
module "security_groups" {
  source = "./security_groups"

  vpc_id         = module.networking.vpc_id
  public_ip_cidr = var.public_ip_cidr
  owner_tag      = var.owner_tag
}

# -----------------------------
# EC2 + K3s
# -----------------------------
module "ec2" {
  source = "./ec2"

  aws_region         = var.aws_region
  subnet_id          = module.networking.public_subnet_a_id
  security_group_ids = [module.security_groups.app_sg_id]

  instance_type = var.instance_type
  key_name      = var.key_name
  owner_tag     = var.owner_tag
}

# -----------------------------
# Root outputs
# -----------------------------
output "public_ip" {
  value = module.ec2.public_ip
}

output "private_ip" {
  value = module.ec2.private_ip
}

output "ssh_command" {
  value = "ssh -i ${var.key_name}.pem ubuntu@${module.ec2.public_ip}"
}

output "jenkins_url" {
  value = "http://${module.ec2.public_ip}:30081"
}

output "argocd_url" {
  value = "http://${module.ec2.public_ip}:32382"
}

output "grafana_url" {
  value = "http://${module.ec2.public_ip}:30300"
}

output "prometheus_url" {
  value = "http://${module.ec2.public_ip}:30090"
}
