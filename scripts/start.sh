#!/bin/bash
set -e

echo "=== Starting RCCB ==="

# Check if PM2 is available
if command -v pm2 >/dev/null 2>&1; then
  pm2 start npm --name "rccb" -- start
  pm2 save
  echo "RCCB started with PM2. Use 'pm2 logs rccb' to view logs."
else
  echo "PM2 not found. Starting directly..."
  NODE_ENV=production npm start
fi
