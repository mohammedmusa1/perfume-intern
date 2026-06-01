variable "aws_region" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "security_group_ids" {
  type = list(string)
}

variable "instance_type" {
  type = string
}

variable "key_name" {
  type = string
}

variable "owner_tag" {
  type = string
}
