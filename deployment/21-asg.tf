resource "aws_autoscaling_group" "ec2_autoscaling_group" {
  name                      = "${local.prefix}-ASG"
  vpc_zone_identifier       = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
  target_group_arns         = [aws_alb_target_group.server_backend_tg.arn]
  launch_template {
    id = aws_launch_template.asg_launch_template.id
    version = "$Latest"
  }
  max_size                  = 1
  min_size                  = 1
  health_check_grace_period = 600 #Time (in seconds) after instance comes into service before checking health.
  health_check_type         = "ELB"
  desired_capacity          = 1
  default_cooldown          = 150
  force_delete              = true
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_elasticache_replication_group.chatapp_redis_cluster
  ]

  tag {
    key                 = "Name"
    value               = "EC2-ASG-${terraform.workspace}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Type"
    value               = "Backend-${terraform.workspace}"
    propagate_at_launch = true
  }
}
