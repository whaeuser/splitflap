#!/bin/bash
# Install Split-Flap Display as systemd service on Raspberry Pi

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🛩️  Split-Flap Display - Raspberry Pi Autostart Installer${NC}"
echo ""

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}❌ This script is for Linux/Raspberry Pi only${NC}"
    exit 1
fi

# Check if systemd is available
if ! command -v systemctl &> /dev/null; then
    echo -e "${RED}❌ systemd not found${NC}"
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

# Check if venv exists
if [ ! -d "$PROJECT_DIR/venv" ]; then
    echo -e "${YELLOW}⚠ Virtual environment not found${NC}"
    echo "Creating virtual environment..."
    python3 -m venv "$PROJECT_DIR/venv"
    echo -e "${GREEN}✓${NC} Created venv"
fi

# Check if dependencies are installed
if [ ! -f "$PROJECT_DIR/venv/bin/uvicorn" ]; then
    echo -e "${YELLOW}⚠ Dependencies not installed${NC}"
    echo "Installing dependencies..."
    "$PROJECT_DIR/venv/bin/pip" install -r "$PROJECT_DIR/requirements.txt"
    echo -e "${GREEN}✓${NC} Installed dependencies"
fi

# Get current user
CURRENT_USER=${SUDO_USER:-$USER}
echo -e "${YELLOW}Service user:${NC} $CURRENT_USER"

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/splitflap.service"
SERVICE_TEMPLATE="$SCRIPT_DIR/splitflap.service"

echo ""
echo "Creating systemd service..."

# Replace placeholders in template
sudo sed "s|/home/pi/splitflap|$PROJECT_DIR|g" "$SERVICE_TEMPLATE" | \
sudo sed "s|User=pi|User=$CURRENT_USER|g" | \
sudo sed "s|Group=pi|Group=$CURRENT_USER|g" > "$SERVICE_FILE"

echo -e "${GREEN}✓${NC} Created: $SERVICE_FILE"

# Reload systemd
echo ""
echo "Reloading systemd..."
sudo systemctl daemon-reload

echo -e "${GREEN}✓${NC} systemd reloaded"

# Enable service
echo ""
echo "Enabling service..."
sudo systemctl enable splitflap.service

echo -e "${GREEN}✓${NC} Service enabled (will start on boot)"

# Start service
echo ""
echo "Starting service..."
sudo systemctl start splitflap.service

sleep 2

# Check status
if sudo systemctl is-active --quiet splitflap.service; then
    echo -e "${GREEN}✓${NC} Service is running"
    echo ""
    echo -e "${GREEN}🎉 Installation complete!${NC}"
    echo ""
    echo "Service will now start automatically on boot."
    echo ""
    echo "Useful commands:"
    echo "  Status:  sudo systemctl status splitflap"
    echo "  Stop:    sudo systemctl stop splitflap"
    echo "  Start:   sudo systemctl start splitflap"
    echo "  Restart: sudo systemctl restart splitflap"
    echo "  Logs:    sudo journalctl -u splitflap -f"
    echo "  Disable: sudo systemctl disable splitflap"
    echo ""
    echo "To uninstall:"
    echo "  ./uninstall.sh"
    echo ""
    echo "Access your display at: http://$(hostname -I | awk '{print $1}'):8001"
else
    echo -e "${RED}❌ Service failed to start${NC}"
    echo ""
    echo "Check status and logs:"
    echo "  sudo systemctl status splitflap"
    echo "  sudo journalctl -u splitflap -n 50"
    exit 1
fi