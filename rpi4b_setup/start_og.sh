#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager
git pull
source venv/bin/activate
exec python3 headless_optogrid_backend.py
