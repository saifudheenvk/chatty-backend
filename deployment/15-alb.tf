resource "aws_alb" "application_load_balancer" {
  name                       = "${local.prefix}-alb"
  subnets                    = [aws_subnet.public_subnet_a.id, aws_subnet.public_subnet_b.id]
  security_groups            = [aws_security_group.alb_sg.id]
  enable_deletion_protection = false #f true, deletion of the load balancer will be disabled via the AWS API
  ip_address_type            = "ipv4"
  internal                   = false #If true, the LB will be internal
  load_balancer_type         = "application"
  idle_timeout               = 300 #Time in seconds that the connection is allowed to be idle.


  tags = merge(
    local.common_tags,                        # include all tags in local.common_tags
    tomap({ "Name" = "${local.prefix}-ALB" }) # this is to include prefix in tags as Name
  )
}

#A listener is a process configured on the ALB that checks for incoming connection requests on a specified protocol and port.


resource "aws_alb_listener" "alb_https_listener" {
  load_balancer_arn = aws_alb.application_load_balancer.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = aws_acm_certificate.dev_cert.arn
  ssl_policy        = var.https_ssl_policy

  depends_on = [aws_acm_certificate.dev_cert]

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.server_backend_tg.arn
  }
}

resource "aws_alb_listener" "alb_http_listener" {
  load_balancer_arn = aws_alb.application_load_balancer.arn
  port              = 80
  protocol          = "HTTP"

  #we need redirection from http to https
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

#When an ALB listener receives a request, it evaluates the request against the defined rules and routes it to the appropriate target group based on the first matching rule.
resource "aws_alb_listener_rule" "alb_https_listener_rule" {
  listener_arn = aws_alb_listener.alb_http_listener.arn
  priority     = 100
  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.server_backend_tg.arn
  }
  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}


