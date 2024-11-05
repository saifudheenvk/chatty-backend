resource "aws_instance" "bastion_host" {
  ami                         = data.aws_ami.ec2_ami.id
  instance_type               = var.bastion_host_type
  subnet_id                   = aws_subnet.public_subnet_a.id
  vpc_security_group_ids      = [aws_security_group.bastion_host_sg.id]
  key_name                    = "chattyapp" #TODO: create a key pair in aws and mention the key name here before deploying it
  associate_public_ip_address = true
  tags = merge(
    local.common_tags,
    tomap({ "Name" = "${local.prefix}-bastion-host" })
  )
}
