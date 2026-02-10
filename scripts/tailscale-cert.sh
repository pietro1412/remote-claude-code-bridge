#!/bin/bash
set -e

HOSTNAME=$(tailscale status --json | jq -r '.Self.DNSName' | sed 's/\.$//')

if [ -z "$HOSTNAME" ]; then
  echo "Could not detect Tailscale hostname. Is Tailscale running?"
  exit 1
fi

echo "Generating HTTPS certificates for: $HOSTNAME"

mkdir -p certs
tailscale cert --cert-file certs/cert.pem --key-file certs/key.pem "$HOSTNAME"

echo ""
echo "Certificates saved to certs/"
echo "Update .env: TAILSCALE_HOSTNAME=$HOSTNAME"
echo ""
