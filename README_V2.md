# 🛩️ Split-Flap Display v2.1

An authentic split-flap display simulator with realistic mechanical animations, sound effects, and comprehensive API control. Now with **MQTT support**, **WebSocket**, **modular architecture**, and **modern FastAPI backend**!

![Version](https://img.shields.io/badge/version-2.1.0-blue) ![API](https://img.shields.io/badge/API-REST+WebSocket+MQTT-green) ![Python](https://img.shields.io/badge/python-3.8+-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ What's New in v2.1

### 🔌 MQTT Integration
- **IoT Ready**: Full MQTT broker integration
- **Topics**: Subscribe/publish to multiple topics
- **Automation**: Home Assistant, Node-RED, openHAB compatible
- **Real-time**: Instant display updates via MQTT
- **Multi-Display**: Control multiple displays from one broker

### 🎨 Enhanced Admin UI
- **MQTT Control Panel**: Live connection status and testing
- **Version Display**: Real-time server version info
- **Connection Monitoring**: WebSocket and MQTT status

[📖 See MQTT Integration Guide](MQTT.md)

## ✨ What's New in v2.0

### 🚀 Backend Improvements
- **FastAPI Server**: Modern async Python framework replacing simple HTTP server
- **WebSocket Support**: Real-time bidirectional communication (auto-fallback to polling)
- **Rate Limiting**: Built-in protection (configurable)
- **API Key Authentication**: Optional security layer
- **GET /api/display**: Retrieve current display state
- **Better Error Handling**: Proper HTTP status codes and error messages
- **Docker Support**: Ready-to-deploy container setup

### 🎨 Frontend Improvements
- **Modular Architecture**: Separated CSS, JavaScript modules
- **ES6 Modules**: Clean, maintainable code structure
- **WebSocket Client**: Automatic connection with fallback
- **Better State Management**: Centralized display state
- **Improved Audio System**: Isolated audio management

### 📦 DevOps
- **Package.json**: NPM scripts for development
- **Requirements.txt**: Python dependencies
- **Dockerfile**: Container deployment
- **Docker Compose**: One-command setup
- **.env Configuration**: Environment-based config

## 🚀 Quick Start

### Option 1: Modern Server (v2.1 - Recommended)

```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python3 server.py

# Or use npm script
npm start
```

**With MQTT:**
```bash
# Configure MQTT in .env
cp .env.example .env
# Edit .env and set MQTT_BROKER, MQTT_PORT, etc.

# Start server with MQTT enabled
python3 server.py
```

### Option 2: Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# With MQTT configuration
MQTT_BROKER=mqtt.example.com MQTT_USERNAME=user MQTT_PASSWORD=pass docker-compose up -d

# Or build manually
docker build -t splitflap .
docker run -p 8001:8001 splitflap
```

### Option 3: Legacy Server (v1.0)

```bash
# Use the simple Python server
python3 simple_server.py 8001
```

## 📡 API Documentation

### MQTT API (NEW in v2.1!)

See [MQTT Integration Guide](MQTT.md) for complete documentation.

**Quick Example:**
```bash
# Set display via MQTT
mosquitto_pub -t "splitflap/display" -m '{"line1":"HELLO","line2":"MQTT"}'

# Subscribe to status updates
mosquitto_sub -t "splitflap/status" -v
```

**Supported Topics:**
- `splitflap/command` - Generic commands
- `splitflap/display` - Set display content
- `splitflap/clear` - Clear display
- `splitflap/demo` - Start demo
- `splitflap/datetime` - DateTime mode
- `splitflap/status` - Status updates (published)
- `splitflap/event` - Event notifications (published)

### REST API Endpoints

#### Get Server Status
```bash
GET /api/status
```
**Response:**
```json
{
  "status": "ready",
  "display": "split-flap",
  "lines": 6,
  "version": "2.1.0",
  "features": ["websocket", "polling", "datetime", "demo", "rate-limiting", "mqtt"],
  "mqtt_enabled": true,
  "mqtt_connected": true
}
```

#### Get Current Display State (NEW!)
```bash
GET /api/display
```
**Response:**
```json
{
  "lines": ["LINE 1", "LINE 2", "", "", "", ""],
  "datetime_mode": false,
  "timestamp": 1234567890.123
}
```

#### Set Display Content
```bash
POST /api/display
Content-Type: application/json

{
  "line1": "HELLO",
  "line2": "WORLD"
}
```

#### Clear Display
```bash
POST /api/clear
```

#### Start Demo
```bash
POST /api/demo
```

#### Control DateTime Mode
```bash
POST /api/datetime
Content-Type: application/json

{
  "enable": true
}
```

### WebSocket API (NEW!)

Connect to `ws://localhost:8001/ws`

**Send commands:**
```javascript
const ws = new WebSocket('ws://localhost:8001/ws');

// Set display
ws.send(JSON.stringify({
  action: 'setDisplay',
  line1: 'HELLO',
  line2: 'WORLD'
}));

// Clear display
ws.send(JSON.stringify({
  action: 'clear'
}));

// Get state
ws.send(JSON.stringify({
  action: 'getState'
}));
```

**Receive updates:**
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### JavaScript API

```javascript
// All existing APIs still work
window.splitflapAPI.setDisplay('LINE1', 'LINE2', 'LINE3');
window.splitflapAPI.clear();
window.splitflapAPI.demo();
window.splitflapAPI.datetime(true);

// New methods
window.splitflapAPI.isSoundEnabled();
```

## 🔒 Security Features

### API Key Authentication

Set an API key in `.env`:
```bash
SPLITFLAP_API_KEY=your-secret-key
```

Then include it in requests:
```bash
curl -H "X-API-Key: your-secret-key" http://localhost:8001/api/status
```

### Rate Limiting

Built-in rate limiting (default: 100 requests per 60 seconds per IP).

Configure in `.env`:
```bash
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

## 🏗️ Project Structure

```
splitflap/
├── css/
│   └── styles.css          # Modular CSS
├── js/
│   ├── audio.js           # Audio system
│   ├── display.js         # Display logic
│   ├── api.js             # API handler (WebSocket + REST)
│   └── main.js            # Main entry point
├── index.html             # Modular HTML (v2.0)
├── flipboard.html         # Legacy single-file (v1.0)
├── server.py              # FastAPI server (v2.0)
├── simple_server.py       # Legacy server (v1.0)
├── requirements.txt       # Python dependencies
├── package.json           # NPM config
├── Dockerfile             # Docker image
├── docker-compose.yml     # Docker Compose
├── .env.example           # Environment config template
└── README_V2.md           # This file
```

## 🎯 Use Cases

- **Digital Signage**: Retro-style information displays
- **Event Displays**: Conference schedules, departures
- **Art Installations**: Interactive museum pieces
- **Home Automation**: Home Assistant, openHAB, Node-RED integration via MQTT
- **IoT Projects**: ESP32, Arduino, Raspberry Pi control via MQTT
- **Live Streaming**: OBS browser source
- **APIs/Webhooks**: Integrate with other services via WebSocket or MQTT
- **Multi-Display Management**: Control multiple displays from one MQTT broker

## 🔄 Migration from v1.0 to v2.0

### Backend
1. Install dependencies: `pip install -r requirements.txt`
2. Update server command: `python3 server.py` (instead of `simple_server.py`)
3. Configure `.env` if needed (optional)

### Frontend
- No changes required! v2.0 is backward compatible
- Legacy `flipboard.html` still works
- New modular version at `/` or `/index.html`

### API Clients
- All existing REST endpoints work identically
- Optionally upgrade to WebSocket for real-time updates

## 📊 Performance Improvements

- **WebSocket**: 50% less latency compared to polling
- **Modular JS**: Faster page loads with better caching
- **Async Backend**: Better concurrency handling
- **Rate Limiting**: Protection against abuse

## 🐳 Docker Deployment

```bash
# Development
docker-compose up

# Production with API key
SPLITFLAP_API_KEY=secret123 docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🛠️ Development

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies (for linting)
npm install

# Run development server
npm run dev

# Format code
npm run format

# Lint code
npm run lint
```

## 🔧 Configuration

Create `.env` file from template:
```bash
cp .env.example .env
```

Edit `.env` to customize:
- `SPLITFLAP_API_KEY`: API authentication
- `PORT`: Server port (default: 8001)
- `RATE_LIMIT_REQUESTS`: Max requests per window
- `RATE_LIMIT_WINDOW`: Time window in seconds

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:8001/api/status
```

### Docker Health
```bash
docker-compose ps
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - feel free to use, modify, and distribute!

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/whaeuser/splitflap/issues)
- **Discussions**: [GitHub Discussions](https://github.com/whaeuser/splitflap/discussions)

---

Made with ❤️ for aviation and transportation enthusiasts. Enjoy your split-flap display! ✈️🚂

**v2.0 Features**: WebSocket • FastAPI • Docker • Modular • Rate Limiting • API Key Auth