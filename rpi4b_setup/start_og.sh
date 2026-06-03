#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager || exit 1
git pull
source venv/bin/activate
exec python3 headless_optogrid_backend.py
