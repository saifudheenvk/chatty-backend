resource "aws_launch_template" "asg_launch_template" {
  name = "${local.prefix}-launch-template"
  image_id = data.aws_ami.ec2_ami.id
  instance_type = var.ec2_instance_type
  user_data = filebase64("./userdata/userdata.sh")
  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.autoscaling_group_sg.id]
  }
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_instance_profile.name
  }
  key_name = "chattyapp"
  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "${local.prefix}-instance"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}
