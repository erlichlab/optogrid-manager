#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager
git pull
git reset --hard stable-release-spain
chmod +x ~/repos/optogrid-manager/rpi4b_setup/start_og.sh
source venv/bin/activate
python3 headless_optogrid_backend.py
