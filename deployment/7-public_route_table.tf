resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.main.id

  #we can create route this way also
  # route = {
  #   cidr_block = var.global_destination_cidr_block
  #   gateway_id = aws_internet_gateway.main-igw.id
  # }

  tags = merge(
    local.common_tags, # include all tags in local.common_tags
    tomap({ "Name" = "${local.prefix}-public-RT" })
  )
}

# This way of creating route gives you more modularity
resource "aws_route" "public_igw_route" {
  route_table_id         = aws_route_table.public_route_table.id
  destination_cidr_block = var.global_destination_cidr_block
  gateway_id             = aws_internet_gateway.main_igw.id
  depends_on = [
    aws_route_table.public_route_table # ensuring that the route is created only after the route table is created.
  ]
}

resource "aws_route_table_association" "public_subnet_1_association" {
  subnet_id      = aws_subnet.public_subnet_a.id
  route_table_id = aws_route_table.public_route_table.id
}


resource "aws_route_table_association" "public_subnet_2_association" {
  subnet_id      = aws_subnet.public_subnet_b.id
  route_table_id = aws_route_table.public_route_table.id
}
