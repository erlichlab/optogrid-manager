#!/bin/bash
source ~/.zshrc
cd /home/delab/repos/optogrid-manager
git pull
node dashboard/server.js
