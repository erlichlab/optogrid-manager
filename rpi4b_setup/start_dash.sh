#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager
git pull
exec node dashboard/server.js
