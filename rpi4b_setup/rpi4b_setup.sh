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

# Step 0: Git checkout to stable-release-spain tag if not already on it
print_step "Checking out stable-release-spain..."
git -C "$HOME/repos/optogrid-manager" fetch --all --tags
git -C "$HOME/repos/optogrid-manager" checkout stable-release-spain

# Step 1: Install pyenv

if [ -f ~/.zshrc ]; then
    print_step "Sourcing .zshrc..."
    source ~/.zshrc
else
    print_warning "First time running setup, .zshrc not found is normal"
fi

if command -v pyenv &> /dev/null; then
    print_step "pyenv already installed, skipping..."
else
    print_step "Installing pyenv..."
    curl https://pyenv.run | bash || print_error "Failed to install pyenv"
fi

# Step 2: Add pyenv to .zshrc
if grep -q "PYENV_ROOT" ~/.zshrc; then
    print_step "pyenv already in .zshrc, skipping..."
else
    print_step "Adding pyenv to .zshrc..."
    cat >> ~/.zshrc <<'EOF'
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
EOF
fi

# Step 3: Restart Terminal (source .zshrc)
if [ -f ~/.zshrc ]; then
    print_step "Sourcing .zshrc..."
    source ~/.zshrc
else
    print_warning "First time running setup, .zshrc not found is normal"
fi

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
if pyenv versions | grep -q "3.12.4"; then
    print_step "Python 3.12.4 already installed, skipping..."
else
    print_step "Installing Python 3.12.4 (this may take a while)..."
    pyenv install 3.12.4 || print_error "Failed to install Python 3.12.4"
fi

# Step 6: Set local python version
if [ -f "$HOME/repos/optogrid-manager/.python-version" ] && grep -q "3.12.4" "$HOME/repos/optogrid-manager/.python-version"; then
    print_step "Python version already set to 3.12.4, skipping..."
else
    print_step "Setting local Python version to 3.12.4..."
    echo "3.12.4" > "$HOME/repos/optogrid-manager/.python-version" || print_error "Failed to set Python version"
fi

# Step 7: Verify Python installation
print_step "Verifying Python installation..."
PYTHON_VERSION=$(python3 --version)
if [[ $PYTHON_VERSION == *"3.12.4"* ]]; then
    echo "Python version: $PYTHON_VERSION"
else
    print_error "Python version mismatch. Expected 3.12.4, got $PYTHON_VERSION"
fi

# Step 8: Create virtual environment
if [ -d "$HOME/repos/optogrid-manager/venv" ]; then
    print_step "Virtual environment already exists, skipping..."
else
    print_step "Creating virtual environment..."
    python3 -m venv "$HOME/repos/optogrid-manager/venv" || print_error "Failed to create virtual environment"
fi

# Step 9: Install Python dependencies from requirements
print_step "Installing Python dependencies from requirements.txt..."
source "$HOME/repos/optogrid-manager/venv/bin/activate"
pip install -r "$HOME/repos/optogrid-manager/requirements.txt" || print_error "Failed to install requirements.txt"

print_step "Installing RPI-specific dependencies from requirements-rpi.txt..."
pip install -r "$HOME/repos/optogrid-manager/requirements-rpi.txt" || print_error "Failed to install requirements-rpi.txt"

# Step 10: Install Node.js
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    print_step "Node.js already installed, skipping..."
else
    print_step "Installing Node.js..."
    sudo apt update
    sudo apt install -y nodejs npm || print_error "Failed to install Node.js"
fi

# OS Level Configuration

# Step 11: Enable VNC
if systemctl is-enabled wayvnc.service 2>/dev/null || [ -L /etc/systemd/system/multi-user.target.wants/wayvnc.service ]; then
    print_step "VNC already enabled, skipping..."
else
    print_step "Enabling VNC..."
    sudo raspi-config nonint do_vnc 0 2>/dev/null || print_warning "VNC configuration may require manual setup"
fi

# Step 12: Setup Auto-start Scripts
print_step "Setting up auto-start scripts..."

if [ -x "~/repos/optogrid-manager/rpi4b_setup/start_og.sh" ]; then
    print_step "start_og.sh already executable, skipping..."
else
    chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_og.sh || print_error "Failed to chmod start_og.sh"
fi

if [ -x "~/repos/optogrid-manager/rpi4b_setup/start_dash.sh" ]; then
    print_step "start_dash.sh already executable, skipping..."
else
    chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_dash.sh || print_error "Failed to chmod start_dash.sh"
fi

# Create autostart directory if it doesn't exist
mkdir -p ~/.config/autostart

# Create og.desktop file
if [ -f ~/.config/autostart/og.desktop ]; then
    print_step "og.desktop already exists, skipping..."
else
    print_step "Creating og.desktop autostart file..."
    cat > ~/.config/autostart/og.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=OptoGrid Backend
Exec=lxterminal --working-directory=/home/delab --command="/home/delab/repos/optogrid-manager/rpi4b_setup/start_og.sh"
AutoStart=true
EOF
fi


# Step 13: Disable Internal Bluetooth
if grep -q "dtoverlay=disable-bt" /boot/firmware/config.txt; then
    print_step "Internal Bluetooth already disabled, skipping..."
else
    print_step "Disabling internal Bluetooth..."
    echo "dtoverlay=disable-bt" | sudo tee -a /boot/firmware/config.txt
fi

# Step 14: Enable Bluetooth
print_step "Enabling Bluetooth..."
sudo rfkill unblock bluetooth || print_warning "Bluetooth may not be fully configured"
sudo systemctl start bluetooth || print_warning "Bluetooth may not be fully configured"
bluetoothctl power on || print_warning "Bluetooth dongle is not plugged in"

print_step "Setup complete! Rebooting system..."
sudo reboot
