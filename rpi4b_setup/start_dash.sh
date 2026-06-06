#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager
git pull origin main
git reset --hard stable-release-spain
chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_dash.sh
node dashboard/server.js
