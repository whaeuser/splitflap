#!/bin/bash
# Install Split-Flap Display as macOS Launch Agent

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🛩️  Split-Flap Display - macOS Autostart Installer${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Do not run this script as root/sudo${NC}"
    echo "This installs a user-level LaunchAgent, not a system-level LaunchDaemon"
    exit 1
fi

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

echo -e "${YELLOW}Project Directory:${NC} $PROJECT_DIR"
echo ""

# Check if server.py exists
if [ ! -f "$PROJECT_DIR/server.py" ]; then
    echo -e "${RED}❌ Error: server.py not found in $PROJECT_DIR${NC}"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: python3 not found${NC}"
    exit 1
fi

PYTHON_PATH=$(which python3)
echo -e "${GREEN}✓${NC} Found Python: $PYTHON_PATH"

# Create plist from template
PLIST_FILE="$HOME/Library/LaunchAgents/com.splitflap.display.plist"
PLIST_TEMPLATE="$SCRIPT_DIR/com.splitflap.display.plist"

echo ""
echo "Creating LaunchAgent plist..."

# Replace placeholders in template
sed "s|/usr/local/bin/python3|$PYTHON_PATH|g" "$PLIST_TEMPLATE" | \
sed "s|/Users/YOUR_USERNAME/splitflap|$PROJECT_DIR|g" > "$PLIST_FILE"

echo -e "${GREEN}✓${NC} Created: $PLIST_FILE"

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$HOME/Library/LaunchAgents"

# Unload if already loaded
launchctl unload "$PLIST_FILE" 2>/dev/null || true

# Load the agent
echo ""
echo "Loading LaunchAgent..."
launchctl load "$PLIST_FILE"

echo -e "${GREEN}✓${NC} LaunchAgent loaded"

# Start the service
echo ""
echo "Starting service..."
launchctl start com.splitflap.display

sleep 2

# Check if running
if launchctl list | grep -q "com.splitflap.display"; then
    echo -e "${GREEN}✓${NC} Service is running"
    echo ""
    echo -e "${GREEN}🎉 Installation complete!${NC}"
    echo ""
    echo "Service will now start automatically on boot."
    echo ""
    echo "Useful commands:"
    echo "  Stop:    launchctl stop com.splitflap.display"
    echo "  Start:   launchctl start com.splitflap.display"
    echo "  Restart: launchctl stop com.splitflap.display && launchctl start com.splitflap.display"
    echo "  Status:  launchctl list | grep splitflap"
    echo "  Logs:    tail -f /tmp/splitflap-stdout.log"
    echo "  Errors:  tail -f /tmp/splitflap-stderr.log"
    echo ""
    echo "To uninstall:"
    echo "  ./uninstall.sh"
    echo ""
    echo "Access your display at: http://localhost:8001"
else
    echo -e "${RED}❌ Service failed to start${NC}"
    echo "Check logs:"
    echo "  tail /tmp/splitflap-stderr.log"
    exit 1
fi