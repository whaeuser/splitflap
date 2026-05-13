# 🛩️ Split-Flap Display v2.1

An authentic split-flap display simulator with realistic mechanical animations, sound effects, and comprehensive API control. Perfect for creating retro airport/train station displays or digital signage with that classic flip-board charm.

![Version](https://img.shields.io/badge/version-2.1.0-blue) ![API](https://img.shields.io/badge/API-REST+WebSocket+MQTT-green) ![Python](https://img.shields.io/badge/python-3.8+-blue) ![Browser](https://img.shields.io/badge/Browser-Compatible-orange)

## ✨ Features

- **6-Line Display** - Each line supports up to 16 characters
- **Per-Line Color Control** - 10 colors available (blau, hellblau, rot, gruen, hellgruen, orange, violett, rosa, gelb, weiss)
- **Realistic Animations** - Mechanical flip animations with 3D CSS transforms
- **Authentic Sound Effects** - Web Audio API generated clicking sounds
- **Modern Backend** - FastAPI server with async support, rate limiting and optional API key auth
- **WebSocket Support** - Real-time bidirectional updates (auto-fallback to polling)
- **MQTT Integration** - IoT-ready, compatible with Home Assistant, Node-RED, openHAB
- **Multiple APIs** - REST, WebSocket, MQTT, URL parameters, PostMessage for iframes
- **Docker Ready** - Container deployment via Dockerfile / docker-compose
- **Fullscreen Mode** - Clean black background, no UI controls
- **Demo Sequences** - Built-in airport/station announcements
- **Responsive Design** - Scales to any screen size

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/whaeuser/splitflap.git
cd splitflap
```

### 2. Start the Server (v2 – current version)

The v2 FastAPI server (`server.py`) is the current and recommended backend.
It supports REST, WebSocket and MQTT.

```bash
# Easiest: use the v2 start script (creates venv, installs deps, starts on port 8001)
./start_server_v2.sh

# Or with a custom port
./start_server_v2.sh 8080

# Or manually
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 server.py                   # default port 8001

# Or via npm
npm start
```

**With MQTT:**
```bash
cp .env.example .env
# Edit .env and set MQTT_BROKER, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD, ...
./start_server_v2.sh
```

**With Docker:**
```bash
docker-compose up -d
# or
docker build -t splitflap .
docker run -p 8001:8001 splitflap
```

### 3. Open in Browser
- **Display:** `http://localhost:8001/` - Main split-flap display
- **Admin UI:** `http://localhost:8001/admin` - Live status / MQTT panel
- **API Docs:** `http://localhost:8001/docs` - Interactive Swagger UI documentation

> **Legacy v1 server (reference only):** the original `simple_server.py` / `start_server.sh`
> is kept for reference. See [Legacy v1 Server](#-legacy-v1-server-reference) at the bottom of this file.

## 📡 API Documentation

**📋 Interactive API Documentation:** Visit `http://localhost:8001/docs` for Swagger UI
**📄 OpenAPI Specification:** See [`api-docs.yaml`](./api-docs.yaml) for full API specification

### REST API Endpoints

#### Get Server Status
```bash
GET /api/status
```
**Response (v2):**
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

#### Get Current Display State (v2)
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

#### Health Check (v2)
```bash
GET /api/health
```
Used to detect a frozen/unresponsive browser client.

#### Set Display Content
```bash
POST /api/display
Content-Type: application/json
```

**Individual Lines:**
```json
{
  "line1": "FLUGHAFEN MÜNCHEN",
  "line2": "TERMINAL 2",
  "line3": "ABFLÜGE",
  "line4": "LH 441 FRANKFURT",
  "line5": "GATE A15",
  "line6": "12:30 PÜNKTLICH"
}
```

**Array Format:**
```json
{
  "lines": [
    "FLUGHAFEN MÜNCHEN",
    "TERMINAL 2",
    "ABFLÜGE",
    "LH 441 FRANKFURT",
    "GATE A15",
    "12:30 PÜNKTLICH"
  ]
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

#### Control DateTime Display
```bash
POST /api/datetime
Content-Type: application/json
```

**Enable DateTime Mode:**
```json
{
  "enable": true
}
```

**Disable DateTime Mode:**
```json
{
  "enable": false
}
```

**Features:**
- Displays current date (DD.MM.YYYY) and time (HH:MM) on top line
- Updates automatically (checks every second, displays change every minute)
- Format: `DD.MM.YYYY HH:MM` (exactly 16 characters)
- Automatically disabled when setting custom content

#### Toggle Sound (v2)
```bash
POST /api/sound
Content-Type: application/json

{
  "enable": false
}
```
Audio is opt-in via API. Useful to mitigate browser audio crashes on long-running displays.

#### Per-Line Color Control

Set individual colors for each line. Available colors: `blau`, `hellblau`, `rot`, `gruen`, `hellgruen`, `orange`, `violett`, `rosa`, `gelb`, `weiss` (default).

**Individual Line Format with Colors:**
```json
{
  "line1": "ANKUNFT",
  "line2": "LH 441",
  "line3": "FRANKFURT",
  "line4": "GATE B7",
  "line5": "12:30",
  "line6": "PÜNKTLICH",
  "color1": "blau",
  "color2": "hellblau",
  "color3": "gruen",
  "color4": "orange",
  "color5": "gelb",
  "color6": "gruen"
}
```

**Array Format with Colors:**
```json
{
  "lines": ["ZEILE 1", "ZEILE 2", "ZEILE 3", "ZEILE 4", "ZEILE 5", "ZEILE 6"],
  "colors": ["rot", "gruen", "blau", "gelb", "orange", "violett"]
}
```

**Available Colors:**
- `blau` - Blue (#4A90E2)
- `hellblau` - Light Blue (#87CEEB)
- `rot` - Red (#E74C3C)
- `gruen` - Green (#2ECC71)
- `hellgruen` - Light Green (#A8E6A1)
- `orange` - Orange (#FF8C42)
- `violett` - Violet (#9B59B6)
- `rosa` - Pink (#FFB6C1)
- `gelb` - Yellow (#F1C40F)
- `weiss` - White (#FFFFFF) - Default

See [`COLOR_EXAMPLES.md`](./COLOR_EXAMPLES.md) for detailed examples and use cases.

### 🔧 API Examples

#### Using cURL
```bash
# Set a flight departure
curl -X POST http://localhost:8001/api/display \
  -H "Content-Type: application/json" \
  -d '{
    "line1": "DEPARTURE",
    "line2": "LH 442 BERLIN",
    "line3": "GATE B12",
    "line4": "14:30",
    "line5": "ON TIME",
    "line6": "BOARDING"
  }'

# Clear all lines
curl -X POST http://localhost:8001/api/clear

# Start demo sequence
curl -X POST http://localhost:8001/api/demo

# Enable datetime display
curl -X POST http://localhost:8001/api/datetime \
  -H "Content-Type: application/json" \
  -d '{"enable": true}'

# Disable datetime display
curl -X POST http://localhost:8001/api/datetime \
  -H "Content-Type: application/json" \
  -d '{"enable": false}'

# Set display with colors
curl -X POST http://localhost:8001/api/display \
  -H "Content-Type: application/json" \
  -d '{
    "line1": "ANKUNFT",
    "line2": "LH 441",
    "line3": "FRANKFURT",
    "color1": "blau",
    "color2": "gruen",
    "color3": "orange"
  }'
```

#### Using JavaScript (Browser)
```javascript
// Set display content
fetch('/api/display', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    line1: 'WELCOME',
    line2: 'TO THE',
    line3: 'SPLIT FLAP',
    line4: 'DISPLAY',
    line5: 'SYSTEM',
    line6: 'ENJOY!'
  })
});

// Clear display
fetch('/api/clear', { method: 'POST' });

// Enable datetime mode
fetch('/api/datetime', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enable: true })
});

// Disable datetime mode
fetch('/api/datetime', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enable: false })
});
```

#### Using Python
```python
import requests

# Set display content
response = requests.post('http://localhost:8001/api/display', json={
    'line1': 'TRAIN STATION',
    'line2': 'PLATFORM 3',
    'line3': 'ICE 123 HAMBURG',
    'line4': '16:45',
    'line5': 'DELAY +10 MIN',
    'line6': 'APOLOGIZE'
})

print(response.json())

# Enable datetime display
response = requests.post('http://localhost:8001/api/datetime', json={
    'enable': True
})
print(response.json())

# Disable datetime display
response = requests.post('http://localhost:8001/api/datetime', json={
    'enable': False
})
print(response.json())
```

### 🌐 URL Parameters

You can control the display directly via URL parameters:

```bash
# Set specific lines
http://localhost:8001/?line1=HELLO&line2=WORLD&line3=DISPLAY

# Start demo
http://localhost:8001/?demo

# Clear display
http://localhost:8001/?clear

# Disable sound (sound is enabled by default)
http://localhost:8001/?sound=false
http://localhost:8001/?sound=off
http://localhost:8001/?sound=0

# Enable sound explicitly
http://localhost:8001/?sound=true
```

### 🔌 WebSocket API (v2)

Connect to `ws://localhost:8001/ws` for real-time bidirectional updates.

```javascript
const ws = new WebSocket('ws://localhost:8001/ws');

// Set display
ws.send(JSON.stringify({ action: 'setDisplay', line1: 'HELLO', line2: 'WORLD' }));

// Clear display
ws.send(JSON.stringify({ action: 'clear' }));

// Get current state
ws.send(JSON.stringify({ action: 'getState' }));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

The browser client automatically falls back to polling if WebSocket is not available.

### 📡 MQTT API (v2)

Full IoT integration via an MQTT broker. Configure in `.env`:

```bash
MQTT_BROKER=mqtt.example.com
MQTT_PORT=1883
MQTT_USERNAME=user
MQTT_PASSWORD=pass
MQTT_TOPIC_PREFIX=splitflap
```

**Quick Example:**
```bash
mosquitto_pub -t "splitflap/display" -m '{"line1":"HELLO","line2":"MQTT"}'
mosquitto_sub -t "splitflap/status" -v
```

**Supported Topics:**
- `splitflap/command` – Generic commands
- `splitflap/display` – Set display content
- `splitflap/clear` – Clear display
- `splitflap/demo` – Start demo
- `splitflap/datetime` – DateTime mode
- `splitflap/status` – Status updates (published)
- `splitflap/event` – Event notifications (published)

📖 See [`MQTT.md`](./MQTT.md) for the complete MQTT integration guide.

### 🔒 Security (v2)

**Optional API Key** – set in `.env`:
```bash
SPLITFLAP_API_KEY=your-secret-key
```
Then include it in requests:
```bash
curl -H "X-API-Key: your-secret-key" http://localhost:8001/api/status
```

**Rate Limiting** – default 100 requests / 60s per IP, configurable via
`RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW` in `.env`.

### 📨 PostMessage API (iframe)

For embedding in other applications:

```javascript
// Send command to iframe
iframe.contentWindow.postMessage({
  action: 'setDisplay',
  data: {
    line1: 'EMBEDDED',
    line2: 'DISPLAY',
    line3: 'READY'
  }
}, '*');

// Get current state
iframe.contentWindow.postMessage({
  action: 'getState'
}, '*');
```

## 🎨 Character Set

The display supports the following characters:
```
A-Z (uppercase), 0-9, space, : - . /
```

All lowercase input is automatically converted to uppercase.

## 🔊 Sound

The display includes realistic mechanical clicking sounds generated using the Web Audio API. Sound is **enabled by default** and tries to activate immediately when the page loads.

To disable sound, use the URL parameter: `?sound=false`

## 📱 Responsive Design

The display automatically scales to fit different screen sizes:
- **Desktop**: Full-size characters with detailed animations
- **Mobile**: Smaller characters optimized for touch screens
- **Aspect Ratio**: Maintained across all devices

## 🏗️ Architecture

- **Frontend (v2)**: Modular HTML/CSS/JavaScript (ES6 modules) in `index.html` + `css/` + `js/`
- **Frontend (legacy)**: Single-file `flipboard.html` (still served, fully functional)
- **Backend (v2)**: FastAPI / async Python with WebSocket and MQTT support (`server.py`)
- **Backend (legacy)**: Threaded Python HTTP server (`simple_server.py`) – reference only
- **Communication**: WebSocket (preferred) with automatic polling fallback (500ms)
- **Audio**: Web Audio API with multi-oscillator synthesis (opt-in via `/api/sound`)
- **Animations**: CSS 3D transforms with perspective

## 📁 Project Structure

```
splitflap/
├── README.md              # This file
├── README_V2.md           # Detailed v2 release notes
├── CLAUDE.md              # Development documentation
├── MQTT.md                # MQTT integration guide
├── AUTOSTART.md           # Autostart / boot setup
├── api-docs.yaml          # OpenAPI/Swagger API specification
├── swagger-ui.html        # Interactive API documentation (Swagger UI)
├── index.html             # Modular frontend (v2)
├── css/                   # Modular CSS (v2)
├── js/                    # Modular JavaScript (v2)
├── admin.html             # Admin UI with MQTT panel
├── server.py              # FastAPI server (v2 – current)
├── start_server_v2.sh     # Start script for v2 server
├── requirements.txt       # Python dependencies (FastAPI, MQTT, ...)
├── package.json           # NPM scripts
├── Dockerfile             # Docker image
├── docker-compose.yml     # Docker Compose
├── .env.example           # Environment config template
│
├── flipboard.html         # Legacy single-file frontend (v1, reference)
├── simple_server.py       # Legacy HTTP server (v1, reference)
└── start_server.sh        # Legacy start script (v1, reference)
```

## 🚀 Use Cases

- **Digital Signage** - Retro-style information displays
- **Event Displays** - Conference schedules, departures
- **Art Installations** - Interactive museum pieces
- **Web Applications** - Unique UI component
- **IoT Projects** - Status displays for home automation
- **Live Streaming** - OBS browser source for streams

## 🛠️ Development

### Adding New Features

1. Modify `index.html` / `js/` / `css/` for frontend changes (v2 modular code)
2. Update `server.py` for API changes (FastAPI endpoints, WebSocket, MQTT)
3. Test with the included demo sequences
4. Update this README with new API endpoints

> Note: `flipboard.html` and `simple_server.py` are kept as the v1 reference
> implementation and should generally **not** be modified for new features.

### Custom Animations

The flip animation timing can be customized in the CSS:
```css
.flip-top.flipping {
    animation: flipTop 0.3s ease-in forwards;
}
```

## 📄 License

This project is open source. Feel free to use, modify, and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/whaeuser/splitflap/issues)
- **Discussions**: [GitHub Discussions](https://github.com/whaeuser/splitflap/discussions)

## 🗄️ Legacy v1 Server (reference)

The original v1 implementation is kept in the repository for reference only.
New work should target the v2 server (`server.py`) described above.

```bash
# Legacy start script (v1)
./start_server.sh

# Or directly
python3 simple_server.py 8001
```

- Backend: `simple_server.py` – threaded Python HTTP server (no FastAPI, no WebSocket, no MQTT)
- Frontend: `flipboard.html` – single-file HTML application
- The legacy REST endpoints (`/api/status`, `POST /api/display`, `/api/clear`,
  `/api/demo`, `/api/datetime`) behave the same in v2, so existing v1 clients
  keep working against the v2 server unchanged.

---

Made with ❤️ for aviation and transportation enthusiasts everywhere. Enjoy your split-flap display! ✈️🚂