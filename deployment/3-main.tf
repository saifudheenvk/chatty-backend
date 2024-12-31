terraform {
  backend "s3" {
    bucket  = "chatty-app-env-files"
    key     = "develop/chatapp.tfstate" #develop is the folder inside my bucket & chatapp.tfstate is the name of the state file
    region  = "us-east-1"               #you can't use variable here
    encrypt = true
  }
}

# The common_tags local variable is a map (key-value pair) of common tags that will likely be applied to resources created by Terraform.
locals {
  prefix = "${var.prefix}-${terraform.workspace}"

  common_tags = {
    Project     = var.project
    Environment = terraform.workspace
    ManagedBy   = "Terraform"
    Owner       = "Saifudheen VK"
  }
}
