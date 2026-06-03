#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager || exit 1
git pull
exec node dashboard/server.js
