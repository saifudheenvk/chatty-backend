data "aws_route53_zone" "main" { #Get your already created hosted zone
  name         = var.main_api_server_domain
  private_zone = false
}
