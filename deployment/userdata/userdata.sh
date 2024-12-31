#!/bin/bash

function program_is_installed {
  local return_=1

  type $1 >/dev/null 2>&1 || { local return_=0; }
  echo "$return_"
}

# Update packages
sudo dnf update -y

# Install Ruby and wget
sudo dnf install ruby -y
sudo dnf install wget -y

# Install AWS CodeDeploy agent
cd /home/ec2-user
wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install
sudo chmod +x ./install
sudo ./install auto

# Check if Node.js is installed; if not, use NVM to install it
if [ $(program_is_installed node) == 0 ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  source "$NVM_DIR/nvm.sh"
  nvm install 18
  nvm use 18
  nvm alias default 18
fi

# Install Git if not installed
if [ $(program_is_installed git) == 0 ]; then
  sudo dnf install git -y
fi

# Install Docker if not installed, and run Redis container
if [ $(program_is_installed docker) == 0 ]; then
  sudo dnf install -y docker
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo docker run --name chatapp-redis -p 6379:6379 --restart always --detach redis
fi

# Install pm2 globally if not installed
if [ $(program_is_installed pm2) == 0 ]; then
  npm install -g pm2
fi

# Clone the Git repository and set up the application
cd /home/ec2-user
git clone -b develop https://github.com/saifudheenvk/chatty-backend.git # replace with your GitHub repo URL
cd chatty-backend # set to your project directory
npm install

# Sync environment files from S3 and set up the environment
aws s3 sync s3://chatty-app-env-files/backend/develop . # update with your S3 bucket path
unzip env-file.zip
cp .env.develop .env
npm run build
npm run start
