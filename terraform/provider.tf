terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.63.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-1"
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}
