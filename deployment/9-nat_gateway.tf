#actually we need two NAT gateways both public subnets. But we should pay for this service, so we will create one NAT gateway.
resource "aws_nat_gateway" "nat_gateway" {
  allocation_id = aws_eip.elastic_ip.id
  subnet_id     = aws_subnet.public_subnet_a.id

  tags = merge(
    local.common_tags,
    tomap({ "Name" = "${local.prefix}-nat-gw" })
  )
}


# resource "aws_nat_gateway" "nat_gateway_b" {
#   allocation_id = aws_eip.elastic_ip_b.id
#   subnet_id = aws_subnet.public_subnet_b.id

#   tags = merge(
#     local.common_tags,
#     tomap({ "Name" = "${local.prefix}-nat-gw" })
#   )
# }
