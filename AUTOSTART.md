# 🚀 Autostart Configuration

Configure Split-Flap Display to start automatically on boot for macOS and Raspberry Pi.

## 📋 Table of Contents

- [macOS (launchd)](#macos-launchd)
- [Raspberry Pi (systemd)](#raspberry-pi-systemd)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## 🍎 macOS (launchd)

### Prerequisites

- Python 3.8+ installed
- Split-Flap Display project cloned
- Dependencies installed (`pip install -r requirements.txt`)

### Installation

1. **Navigate to the autostart directory:**
   ```bash
   cd /path/to/splitflap/autostart/macos
   ```

2. **Run the installer:**
   ```bash
   ./install.sh
   ```

   The script will:
   - Detect your Python installation
   - Create a LaunchAgent configuration
   - Install it to `~/Library/LaunchAgents/`
   - Start the service immediately

3. **Verify the service is running:**
   ```bash
   launchctl list | grep splitflap
   ```

   You should see `com.splitflap.display` in the list.

### Management Commands

```bash
# Check status
launchctl list | grep splitflap

# Stop service
launchctl stop com.splitflap.display

# Start service
launchctl start com.splitflap.display

# Restart service
launchctl stop com.splitflap.display
launchctl start com.splitflap.display

# View logs
tail -f /tmp/splitflap-stdout.log
tail -f /tmp/splitflap-stderr.log
```

### Uninstallation

```bash
cd /path/to/splitflap/autostart/macos
./uninstall.sh
```

### Manual Configuration

If you prefer to configure manually:

1. **Copy the plist template:**
   ```bash
   cp autostart/macos/com.splitflap.display.plist ~/Library/LaunchAgents/
   ```

2. **Edit the plist file:**
   ```bash
   nano ~/Library/LaunchAgents/com.splitflap.display.plist
   ```

   Update these values:
   - `<string>/usr/local/bin/python3</string>` → Your Python path
   - `<string>/Users/YOUR_USERNAME/splitflap</string>` → Your project path

3. **Load the agent:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.splitflap.display.plist
   launchctl start com.splitflap.display
   ```

---

## 🥧 Raspberry Pi (systemd)

### Prerequisites

- Raspberry Pi OS (Raspbian)
- Python 3.8+ installed
- Split-Flap Display project cloned to `/home/pi/splitflap`
- Dependencies installed in venv

### Installation

1. **Navigate to the autostart directory:**
   ```bash
   cd ~/splitflap/autostart/raspberry-pi
   ```

2. **Run the installer:**
   ```bash
   ./install.sh
   ```

   The script will:
   - Create a Python virtual environment (if not exists)
   - Install dependencies (if not installed)
   - Create a systemd service
   - Enable and start the service

3. **Verify the service is running:**
   ```bash
   sudo systemctl status splitflap
   ```

### Management Commands

```bash
# Check status
sudo systemctl status splitflap

# Stop service
sudo systemctl stop splitflap

# Start service
sudo systemctl start splitflap

# Restart service
sudo systemctl restart splitflap

# View logs (live)
sudo journalctl -u splitflap -f

# View last 50 log entries
sudo journalctl -u splitflap -n 50

# Disable autostart
sudo systemctl disable splitflap
```

### Uninstallation

```bash
cd ~/splitflap/autostart/raspberry-pi
./uninstall.sh
```

### Manual Configuration

If you prefer to configure manually:

1. **Copy the service file:**
   ```bash
   sudo cp autostart/raspberry-pi/splitflap.service /etc/systemd/system/
   ```

2. **Edit the service file:**
   ```bash
   sudo nano /etc/systemd/system/splitflap.service
   ```

   Update these values:
   - `WorkingDirectory=/home/pi/splitflap` → Your project path
   - `ExecStart=/home/pi/splitflap/venv/bin/python3 ...` → Your venv path
   - `User=pi` → Your username
   - `Group=pi` → Your group

3. **Enable and start the service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable splitflap
   sudo systemctl start splitflap
   ```

---

## ⚙️ Configuration

### Environment Variables

Both macOS and Raspberry Pi configurations support environment variables.

#### macOS (launchd)

Edit `~/Library/LaunchAgents/com.splitflap.display.plist`:

```xml
<key>EnvironmentVariables</key>
<dict>
    <key>MQTT_BROKER</key>
    <string>localhost</string>
    <key>MQTT_PORT</key>
    <string>1883</string>
    <key>MQTT_USERNAME</key>
    <string>user</string>
    <key>MQTT_PASSWORD</key>
    <string>pass</string>
    <key>SPLITFLAP_API_KEY</key>
    <string>secret123</string>
</dict>
```

Reload after editing:
```bash
launchctl unload ~/Library/LaunchAgents/com.splitflap.display.plist
launchctl load ~/Library/LaunchAgents/com.splitflap.display.plist
```

#### Raspberry Pi (systemd)

**Option 1: Edit service file directly**

Edit `/etc/systemd/system/splitflap.service`:

```ini
[Service]
Environment="MQTT_BROKER=localhost"
Environment="MQTT_PORT=1883"
Environment="MQTT_USERNAME=user"
Environment="MQTT_PASSWORD=pass"
Environment="SPLITFLAP_API_KEY=secret123"
```

Reload after editing:
```bash
sudo systemctl daemon-reload
sudo systemctl restart splitflap
```

**Option 2: Use .env file (recommended)**

1. Create `.env` in project directory:
   ```bash
   cd ~/splitflap
   cp .env.example .env
   nano .env
   ```

2. Uncomment this line in the service file:
   ```ini
   EnvironmentFile=/home/pi/splitflap/.env
   ```

3. Reload:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart splitflap
   ```

---

## 🐛 Troubleshooting

### macOS

**Service not starting:**
```bash
# Check logs
tail -f /tmp/splitflap-stderr.log

# Check if port 8001 is already in use
lsof -i :8001

# Verify Python path
which python3

# Test manually
cd /path/to/splitflap
python3 server.py 8001
```

**Permission denied:**
```bash
# Ensure scripts are executable
chmod +x autostart/macos/*.sh

# Check plist file ownership
ls -l ~/Library/LaunchAgents/com.splitflap.display.plist
```

**Service keeps restarting:**
```bash
# Check if dependencies are installed
pip list | grep fastapi

# Verify working directory in plist
cat ~/Library/LaunchAgents/com.splitflap.display.plist | grep WorkingDirectory
```

### Raspberry Pi

**Service not starting:**
```bash
# Check status
sudo systemctl status splitflap

# View detailed logs
sudo journalctl -u splitflap -n 100

# Check if port 8001 is already in use
sudo lsof -i :8001

# Test manually
cd ~/splitflap
source venv/bin/activate
python3 server.py 8001
```

**Permission denied:**
```bash
# Check file permissions
ls -l ~/splitflap/server.py

# Check venv permissions
ls -l ~/splitflap/venv/bin/python3

# Ensure scripts are executable
chmod +x autostart/raspberry-pi/*.sh
```

**Service fails after reboot:**
```bash
# Check if network is up
ping -c 3 8.8.8.8

# Verify service is enabled
sudo systemctl is-enabled splitflap

# Check dependencies
sudo journalctl -u splitflap -b
```

**MQTT not connecting:**
```bash
# Test MQTT broker
mosquitto_pub -h localhost -t test -m "hello"

# Check environment variables
sudo systemctl show splitflap --property=Environment

# Verify broker is running
sudo systemctl status mosquitto
```

### General Issues

**Display not accessible:**
```bash
# Check if server is running
curl http://localhost:8001/api/status

# Check firewall (Raspberry Pi)
sudo iptables -L

# Get local IP
# macOS:
ifconfig | grep "inet "
# Raspberry Pi:
hostname -I
```

**High CPU usage:**
```bash
# Check for polling loops
# Increase polling interval in client code

# Monitor resource usage
# macOS:
top -pid $(pgrep -f "python.*server.py")
# Raspberry Pi:
htop
```

---

## 📝 Notes

### macOS
- Uses **LaunchAgent** (user-level, not system-level)
- Runs when user is logged in
- Logs to `/tmp/splitflap-*.log`
- Configuration in `~/Library/LaunchAgents/`

### Raspberry Pi
- Uses **systemd** (system-level service)
- Runs on boot, before login
- Logs to system journal (journalctl)
- Configuration in `/etc/systemd/system/`

### Security
- Both configurations run as regular user (not root)
- Use `.env` file for sensitive data
- Keep API keys and passwords secure
- Consider using TLS for production

---

## 🔗 Additional Resources

- [launchd.info](https://www.launchd.info/) - macOS launchd documentation
- [systemd documentation](https://www.freedesktop.org/software/systemd/man/) - Linux systemd
- [MQTT.md](MQTT.md) - MQTT integration guide
- [README_V2.md](README_V2.md) - General documentation

---

**Version**: 2.1.0
**Last Updated**: 2025-09-30
**Maintained by**: Split-Flap Display Project