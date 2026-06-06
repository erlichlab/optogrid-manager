#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager
git pull origin main
git fetch --tags --force
git reset --hard stable-release-spain
chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_dash.sh
chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_og.sh
node dashboard/server.js
