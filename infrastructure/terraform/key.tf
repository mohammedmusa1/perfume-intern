resource "tls_private_key" "auraperfume" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "auraperfume" {
  key_name   = "auraperfume-key"
  public_key = tls_private_key.auraperfume.public_key_openssh
}

resource "local_file" "private_key" {
  content         = tls_private_key.auraperfume.private_key_pem
  filename        = "${path.module}/auraperfume-key.pem"
  file_permission = "0600"
}
