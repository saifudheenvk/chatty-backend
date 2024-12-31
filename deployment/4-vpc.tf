#main: This is the name of the resource instance in Terraform. (name of vpc)
#You can reference this VPC elsewhere in your Terraform code using aws_vpc.main.
resource "aws_vpc" "main" {
  cidr_block         = var.vpc_cidr_block
  enable_dns_hostnames = true

  tags = merge(
    local.common_tags,                    # include all tags in local.common_tags
    tomap({ "Name" = "${local.prefix}" }) # this is to include prefix in tags as Name
  )
}
