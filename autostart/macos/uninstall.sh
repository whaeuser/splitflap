#!/bin/bash
# Uninstall Split-Flap Display macOS Launch Agent

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛩️  Split-Flap Display - macOS Autostart Uninstaller${NC}"
echo ""

PLIST_FILE="$HOME/Library/LaunchAgents/com.splitflap.display.plist"

if [ ! -f "$PLIST_FILE" ]; then
    echo -e "${YELLOW}⚠ LaunchAgent not found${NC}"
    echo "Nothing to uninstall."
    exit 0
fi

echo "Stopping service..."
launchctl stop com.splitflap.display 2>/dev/null || true

echo "Unloading LaunchAgent..."
launchctl unload "$PLIST_FILE" 2>/dev/null || true

echo "Removing plist file..."
rm "$PLIST_FILE"

echo -e "${GREEN}✓ Uninstallation complete${NC}"
echo ""
echo "The Split-Flap Display service has been removed."
echo "It will no longer start automatically on boot."