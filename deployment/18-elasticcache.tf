resource "aws_elasticache_subnet_group" "elasticache_subnet_group" {
  name = "${local.prefix}-subnet-elasticcache-group"

  subnet_ids = [
    aws_subnet.public_subnet_a.id,
    aws_subnet.public_subnet_b.id
  ]
}

resource "aws_elasticache_replication_group" "chatapp_redis_cluster" {
  automatic_failover_enabled    = true #enable automatic failover when primary redis cluster is down
  replication_group_id          = "${local.prefix}-redis"
  node_type                     = var.elasticache_node_type
  port                          = 6379
  number_cache_clusters         = 2
  multi_az_enabled              = true
  replication_group_description = "Redis elasticache replication group"
  subnet_group_name             = aws_elasticache_subnet_group.elasticache_subnet_group.name
  security_group_ids            = [aws_security_group.elasticache_sg.id]
  parameter_group_name          = var.elasticache_parameter_group_name

  depends_on = [
    aws_security_group.elasticache_sg
  ]

  provisioner "local-exec" {
    command = file("./userdata/update-environment-file.sh")

    environment = {
      ELASTICACHE_ENDPOINT = self.primary_endpoint_address
    }
  }

  tags = merge(
    local.common_tags,
    tomap({ "Name" = "${local.prefix}-elasticache" })
  )
}
