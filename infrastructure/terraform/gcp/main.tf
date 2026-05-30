terraform {
  required_version = ">= 1.5"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.0" }
  }
  backend "gcs" {
    bucket = "auraperfume-terraform-state"
    prefix = "gcp/terraform.tfstate"
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

variable "gcp_project" {
  description = "GCP project ID"
}
variable "gcp_region" {
  default = "asia-south1"
}
variable "project_name" {
  default = "auraperfume"
}
variable "machine_type" {
  default = "e2-medium"
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "${var.project_name}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  name          = "${var.project_name}-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.gcp_region
  network       = google_compute_network.main.id
}

# Firewall Rules
resource "google_compute_firewall" "allow_http" {
  name    = "${var.project_name}-allow-http"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "22", "6443"]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
}

resource "google_compute_firewall" "allow_internal" {
  name    = "${var.project_name}-allow-internal"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["3000-3008", "5432", "9090", "3100"]
  }
  source_ranges = ["10.0.0.0/24"]
}

# Compute Engine Instance
resource "google_compute_instance" "app" {
  name         = "${var.project_name}-server"
  machine_type = var.machine_type
  zone         = "${var.gcp_region}-a"
  tags         = ["web-server"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 30
      type  = "pd-ssd"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
    access_config {} # External IP
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update && apt-get upgrade -y
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker ubuntu
    curl -sfL https://get.k3s.io | sh -
    snap install kubectl --classic
  EOF

  metadata = {
    ssh-keys = "ubuntu:${file("~/.ssh/id_rsa.pub")}"
  }
}

# Cloud Storage for assets
resource "google_storage_bucket" "assets" {
  name          = "${var.project_name}-assets-${var.gcp_project}"
  location      = var.gcp_region
  force_destroy = true

  uniform_bucket_level_access = true
}

output "instance_external_ip" {
  value = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
}
output "storage_bucket" {
  value = google_storage_bucket.assets.name
}
