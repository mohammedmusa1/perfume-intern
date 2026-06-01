provider "aws" {
  region = "ap-south-1"
}



# Detect caller public IP for SSH restriction


# Default VPC
data "aws_vpc" "default" {
  default = true
} # Default subnet for the instance
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Ubuntu 24.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group (SSH restricted to caller IP)
resource "aws_security_group" "auraperfume_sg" {
  name        = "auraperfume-sg"
  description = "Security group for AuraPerfume services"
  vpc_id      = data.aws_vpc.default.id

  # SSH – caller IP only
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # API
  ingress {
    description = "API"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # Frontend
  ingress {
    description = "Frontend"
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # Jenkins
  ingress {
    description = "Jenkins"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # ArgoCD
  ingress {
    description = "ArgoCD"
    from_port   = 8081
    to_port     = 8081
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # Prometheus
  ingress {
    description = "Prometheus"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # Grafana
  ingress {
    description = "Grafana"
    from_port   = 3100
    to_port     = 3100
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "auraperfume-devops"
    Project     = "AuraPerfume"
    Environment = "Dev"
    Owner       = "musa"
  }
}

# EC2 Instance
resource "aws_instance" "auraperfume_devops" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.large"

  vpc_security_group_ids      = [aws_security_group.auraperfume_sg.id]
  associate_public_ip_address = true
  subnet_id                   = data.aws_subnets.default.ids[0]
  key_name                    = aws_key_pair.auraperfume.key_name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = {
    Name        = "auraperfume-devops"
    Project     = "AuraPerfume"
    Environment = "Dev"
    Owner       = "musa"
  }
}

# Elastic IP (static address)
resource "aws_eip" "auraperfume_eip" {
  instance = aws_instance.auraperfume_devops.id
  domain   = "vpc"

  tags = {
    Name        = "auraperfume-devops"
    Project     = "AuraPerfume"
    Environment = "Dev"
    Owner       = "musa"
  }
}

output "elastic_ip" {
  description = "Elastic IP attached to the instance"
  value       = aws_eip.auraperfume_eip.public_ip
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i ${path.module}/auraperfume-key.pem ubuntu@${aws_eip.auraperfume_eip.public_ip}"
}
