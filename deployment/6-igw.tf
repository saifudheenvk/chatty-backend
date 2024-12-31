resource "aws_internet_gateway" "main_igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,                            # include all tags in local.common_tags
    tomap({ "Name" = "${local.prefix}-vpc-igw" }) # this is to include prefix in tags as Name
  )
}
