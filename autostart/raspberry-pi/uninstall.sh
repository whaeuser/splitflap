#!/bin/bash
# Uninstall Split-Flap Display systemd service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛩️  Split-Flap Display - Raspberry Pi Autostart Uninstaller${NC}"
echo ""

SERVICE_FILE="/etc/systemd/system/splitflap.service"

if [ ! -f "$SERVICE_FILE" ]; then
    echo -e "${YELLOW}⚠ Service not found${NC}"
    echo "Nothing to uninstall."
    exit 0
fi

echo "Stopping service..."
sudo systemctl stop splitflap.service 2>/dev/null || true

echo "Disabling service..."
sudo systemctl disable splitflap.service 2>/dev/null || true

echo "Removing service file..."
sudo rm "$SERVICE_FILE"

echo "Reloading systemd..."
sudo systemctl daemon-reload

echo -e "${GREEN}✓ Uninstallation complete${NC}"
echo ""
echo "The Split-Flap Display service has been removed."
echo "It will no longer start automatically on boot."