#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager

git reset --hard origin/main
git pull origin main
git fetch --tags --force
git reset --hard stable-release-spain
chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_og.sh
chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_dash.sh
source venv/bin/activate
echo "Enabling Bluetooth..."
sudo rfkill unblock bluetooth || echo "Bluetooth may not be fully configured"
sudo systemctl start bluetooth || echo "Bluetooth may not be fully configured"
bluetoothctl power on || echo "Bluetooth dongle is not plugged in"

lxterminal -e /home/delab/repos/optogrid-manager/rpi4b_setup/start_dash.sh

python3 headless_optogrid_backend.py
