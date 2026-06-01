data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

data "local_file" "bootstrap" {
  # path.root resolves to the directory where terraform apply is run (infrastructure/terraform/aws)
  # Going up two levels gets us to infrastructure/scripts
  filename = "${path.root}/../../scripts/bootstrap.sh"
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.security_group_ids

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = data.local_file.bootstrap.content

  tags = {
    Name    = "${var.owner_tag}-server"
    Project = "AuraPerfume"
  }
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name    = "${var.owner_tag}-eip"
    Project = "AuraPerfume"
  }
}

# S3 for static assets
resource "aws_s3_bucket" "assets" {
  bucket = "auraperfume-${var.owner_tag}-assets"
  tags = {
    Name    = "auraperfume-${var.owner_tag}-assets"
    Project = "AuraPerfume"
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

output "public_ip" {
  value = aws_eip.app.public_ip
}

output "private_ip" {
  value = aws_instance.app.private_ip
}
