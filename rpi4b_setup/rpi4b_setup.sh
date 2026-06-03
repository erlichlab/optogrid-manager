#!/bin/bash

# RPI4B OptoGrid Setup Script
# Automates software installation and OS configuration
# Runs from: Software Installation > 2. Install Python 3.12.4 to OS Level Configuration > 4. Enable Bluetooth

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${GREEN}==> $1${NC}"
}

print_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}Warning: $1${NC}"
}

# Step 1: Install pyenv
print_step "Installing pyenv..."
curl https://pyenv.run | bash || print_error "Failed to install pyenv"

# Step 2: Add pyenv to .zshrc
print_step "Adding pyenv to .zshrc..."
cat >> ~/.zshrc <<'EOF'
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
EOF

# Step 3: Restart Terminal (source .zshrc)
print_step "Sourcing .zshrc..."
source ~/.zshrc

# Step 4: Install Python Dependencies
print_step "Installing Python build dependencies..."
sudo apt update
sudo apt install -y \
  build-essential \
  curl \
  git \
  make \
  zlib1g-dev \
  libssl-dev \
  libbz2-dev \
  libreadline-dev \
  libsqlite3-dev \
  libffi-dev \
  libncursesw5-dev \
  xz-utils \
  tk-dev \
  libxml2-dev \
  libxmlsec1-dev \
  liblzma-dev || print_error "Failed to install dependencies"

# Step 5: Install Python 3.12.4
print_step "Installing Python 3.12.4 (this may take a while)..."
pyenv install 3.12.4 || print_error "Failed to install Python 3.12.4"

# Step 6: Set local python version
print_step "Setting local Python version to 3.12.4..."
pyenv local 3.12.4 || print_error "Failed to set Python version"

# Step 7: Verify Python installation
print_step "Verifying Python installation..."
PYTHON_VERSION=$(python3 --version)
if [[ $PYTHON_VERSION == *"3.12.4"* ]]; then
    echo "Python version: $PYTHON_VERSION"
else
    print_error "Python version mismatch. Expected 3.12.4, got $PYTHON_VERSION"
fi

# Step 8: Create virtual environment
print_step "Creating virtual environment..."
python3 -m venv venv || print_error "Failed to create virtual environment"

# Step 9: Install Python dependencies from requirements
print_step "Installing Python dependencies from requirements.txt..."
source venv/bin/activate
pip install -r requirements.txt || print_error "Failed to install requirements.txt"

print_step "Installing RPI-specific dependencies from requirements-rpi.txt..."
pip install -r requirements-rpi.txt || print_error "Failed to install requirements-rpi.txt"

# Step 10: Install Node.js
print_step "Installing Node.js..."
sudo apt update
sudo apt install -y nodejs npm || print_error "Failed to install Node.js"

# OS Level Configuration

# Step 11: Enable VNC
print_step "Enabling VNC..."
sudo raspi-config nonint do_vnc 0 || print_warning "VNC configuration may require manual setup"

# Step 12: Setup Auto-start Scripts
print_step "Setting up auto-start scripts..."
chmod +x ~/repos/optogrid-manager/RPI4B_setup/start_og.sh || print_error "Failed to chmod start_og.sh"
chmod +x ~/repos/optogrid-manager/RPI4B_setup/start_dash.sh || print_error "Failed to chmod start_dash.sh"

# Create autostart directory if it doesn't exist
mkdir -p ~/.config/autostart

# Create og.desktop file
print_step "Creating og.desktop autostart file..."
cat > ~/.config/autostart/og.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=OptoGrid Backend
Exec=lxterminal --working-directory=/home/delab --command="/home/delab/repos/optogrid-manager/RPI4B_setup/start_og.sh"
AutoStart=true
EOF

# Create dash.desktop file
print_step "Creating dash.desktop autostart file..."
cat > ~/.config/autostart/dash.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=OptoGrid Dashboard
Exec=lxterminal --working-directory=/home/delab --command="/home/delab/repos/optogrid-manager/RPI4B_setup/start_dash.sh"
AutoStart=true
EOF

# Step 13: Disable Internal Bluetooth
print_step "Disabling internal Bluetooth..."
grep -q "dtoverlay=disable-bt" /boot/firmware/config.txt || echo "dtoverlay=disable-bt" | sudo tee -a /boot/firmware/config.txt

# Step 14: Enable Bluetooth
print_step "Enabling Bluetooth..."
bluetoothctl power on || print_warning "Bluetooth may not be fully configured"

print_step "Setup complete! Rebooting system..."
sudo reboot
