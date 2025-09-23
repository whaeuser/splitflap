# 🛩️ Split-Flap Display

An authentic split-flap display simulator with realistic mechanical animations, sound effects, and comprehensive API control. Perfect for creating retro airport/train station displays or digital signage with that classic flip-board charm.

![Split-Flap Display](https://img.shields.io/badge/Lines-6-blue) ![API](https://img.shields.io/badge/API-REST-green) ![Browser](https://img.shields.io/badge/Browser-Compatible-orange)

## ✨ Features

- **6-Line Display** - Each line supports up to 16 characters
- **Realistic Animations** - Mechanical flip animations with 3D CSS transforms
- **Authentic Sound Effects** - Web Audio API generated clicking sounds
- **Multiple APIs** - REST API, URL parameters, PostMessage for iframes
- **Fullscreen Mode** - Clean black background, no UI controls
- **Real-time Updates** - Polling-based server communication
- **Demo Sequences** - Built-in airport/station announcements
- **Responsive Design** - Scales to any screen size

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/whaeuser/splitflap.git
cd splitflap
```

### 2. Start the Server
```bash
# Using the start script (default port 8000)
./start_server.sh

# Or directly with Python (custom port)
python3 simple_server.py 8001
```

### 3. Open in Browser
Navigate to `http://localhost:8001/` to see your split-flap display!

## 📡 API Documentation

**📋 Complete API Specification:** See [`api-docs.yaml`](./api-docs.yaml) for full OpenAPI/Swagger documentation.

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
  "lines": 6
}
```

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
- Displays current date (DD.MM.YYYY) and time (HH:MM:SS) on top line
- Updates automatically every second
- Format: `DD.MM.YYYY    HH:MM:SS` (date left, time right)
- Automatically disabled when setting custom content

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

- **Frontend**: Pure HTML/CSS/JavaScript with no dependencies
- **Backend**: Python HTTP server with threading support
- **Communication**: Polling-based real-time updates (500ms interval)
- **Audio**: Web Audio API with multi-oscillator synthesis
- **Animations**: CSS 3D transforms with perspective

## 📁 Project Structure

```
splitflap/
├── README.md              # This file
├── CLAUDE.md             # Development documentation
├── api-docs.yaml         # OpenAPI/Swagger API specification
├── flipboard.html        # Main display application
├── simple_server.py      # HTTP API server
└── start_server.sh       # Quick start script
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

1. Modify `flipboard.html` for frontend changes
2. Update `simple_server.py` for API changes
3. Test with the included demo sequences
4. Update this README with new API endpoints

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

---

Made with ❤️ for aviation and transportation enthusiasts everywhere. Enjoy your split-flap display! ✈️🚂