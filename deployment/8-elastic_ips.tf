resource "aws_eip" "elastic_ip" {
  depends_on = [aws_internet_gateway.main_igw]

  tags = merge(
    local.common_tags,                        # include all tags in local.common_tags
    tomap({ "Name" = "${local.prefix}-eip" }) # this is to include prefix in tags as Name
  )
}
