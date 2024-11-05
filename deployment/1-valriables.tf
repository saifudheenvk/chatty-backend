variable "aws_region" {
  description = "Region in which AWS resources are created"
  type        = string
  default     = "us-east-1" # Your AWS region
}

#Classless Inter-Domain Routing (CIDR) allows network routers to route data packets to the respective device based on the indicated subnet. Instead of classifying the IP address based on classes, routers retrieve the network and host address as specified by the CIDR suffix.
variable "vpc_cidr_block" {
  description = "VPC CIDR Block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_availability_zones" {
  description = "VPC Availability Zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"] # Two availability zones for your specific region
}

# The CIDR range `10.0.1.0/24` specifies a block of IP addresses. In this case:

# - **`10.0.1.0/24`** means the first 24 bits (the first 3 octets: `10.0.1`) are fixed, and the last 8 bits are available for defining host addresses.
# - This range provides 256 total IP addresses, from `10.0.1.0` to `10.0.1.255`.

# ### Breakdown:
# - **Network address**: `10.0.1.0` (used to identify the network itself, not assignable to devices)
# - **Broadcast address**: `10.0.1.255` (used for broadcasting to all hosts in the network, not assignable)
# - **Usable IP addresses**: `10.0.1.1` to `10.0.1.254`

# So, there are **254 usable IP addresses** in the `10.0.1.0/24` range, starting from `10.0.1.1` and ending at `10.0.1.254`.


variable "vpc_public_subnets" {
  description = "VPC Public Subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"] # allowing internet access to whatever services launch in your VPC
}

variable "vpc_private_subnets" {
  description = "VPC Private Subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

#0.0.0.0/0 is a special CIDR (Classless Inter-Domain Routing) block that represents all possible IPv4 addresses.
#It is often referred to as the "default route" or "anywhere."
variable "global_destination_cidr_block" {
  description = "CIDR Block for all IPs"
  type        = string
  default     = "0.0.0.0/0"
}

variable "bastion_host_cidr" {
  description = "CIDR Block for Bastion Host Ingress"
  type        = string
  default     = "103.177.27.228/32" # Your <IP address>/32
}

variable "https_ssl_policy" {
  description = "HTTPS SSL Policy"
  type        = string
  default     = "ELBSecurityPolicy-2016-08"
}

variable "main_api_server_domain" {
  description = "Main API Server Domain"
  type        = string
  default     = "saifudheen.lol" # Your backend domain you created a route53 zone for
}

#my domain name
variable "dev_api_server_domain" {
  description = "Dev API Server Domain"
  type        = string
  default     = "api.dev.saifudheen.lol"
}

variable "ec2_iam_role_name" {
  description = "EC2 IAM Role Name"
  type        = string
  default     = "chat-app-server-ec2-role" # Add a unique name
}

variable "ec2_iam_role_policy_name" {
  description = "EC2 IAM Role Policy Name"
  type        = string
  default     = "chat-app-server-ec2-role-policy" # Add a unique name
}

variable "ec2_instance_profile_name" {
  description = "EC2 Instance Profile Name"
  type        = string
  default     = "chat-app-server-ec2-instance-profile" # Add a unique name
}

# a small machine to store cache
variable "elasticache_node_type" {
  description = "Elasticache Node Type"
  type        = string
  default     = "cache.t2.micro"
}

variable "elasticache_parameter_group_name" {
  description = "Elasticache Parameter Group Name"
  type        = string
  default     = "default.redis7"
}

# use t2.medium if this thorws an error
variable "ec2_instance_type" {
  description = "EC2 Instance Type"
  type        = string
  default     = "t2.micro"
}

variable "bastion_host_type" {
  description = "Bastion Instance Type"
  type        = string
  default     = "t2.micro"
}

variable "code_deploy_role_name" {
  description = "CodeDeploy IAM Role"
  type        = string
  default     = "chat-app-server-codedeploy-role" # Add a unique name
}

variable "prefix" {
  description = "Prefix to be added to AWS resources tags"
  type        = string
  default     = "chatapp-server" # Add a unique identifier name
}

variable "project" {
  description = "Prefix to be added to AWS resources local tags"
  type        = string
  default     = "chatapp-server" # You can use the name unique identifier created above
}
