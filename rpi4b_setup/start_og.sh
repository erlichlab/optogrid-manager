#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager
git pull origin main
git fetch --tags --force
git reset --hard stable-release-spain
chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_og.sh
chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_dash.sh
source venv/bin/activate
print_step "Enabling Bluetooth..."
sudo rfkill unblock bluetooth || print_warning "Bluetooth may not be fully configured"
sudo systemctl start bluetooth || print_warning "Bluetooth may not be fully configured"
bluetoothctl power on || print_warning "Bluetooth dongle is not plugged in"
python3 headless_optogrid_backend.py
