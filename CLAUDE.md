# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a split-flap display simulator implemented as a single HTML file (`flipboard.html`). It creates an authentic airport/train station style flip display with realistic animations and sound effects.

## Architecture

### Single-file Application
- **flipboard.html**: Complete standalone application with embedded CSS and JavaScript
- No build process, dependencies, or external files required
- Can be opened directly in any modern web browser

### Core Components

**Display System** (`flipboard.html:430-488`):
- 6 display lines, each with 16 character positions
- Character set: `' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-./`
- Flip animation system with top/bottom halves for realistic mechanical movement

**Animation Engine** (`flipboard.html:442-471`):
- CSS-based 3D flip animations using `rotateX` transforms
- Staggered character updates (80ms delay between characters)
- Visual clicking effects and sound synchronization

**Audio System** (`flipboard.html:331-388`):
- Web Audio API implementation for realistic mechanical clicking sounds
- Multi-oscillator synthesis for complex click sound
- User-controllable sound toggle

**User Interface** (`flipboard.html:304-321`):
- Text input with 16-character limit
- Preset buttons for common airport messages
- Demo mode with automated sequence
- German language interface

## Common Development Tasks

### Testing the Application
```bash
# Open directly in browser
open flipboard.html
# Or serve locally for testing
python3 -m http.server 8001
```

### Key Functions to Understand
- `flipCharacter()` - Core animation logic for individual character flips
- `updateLine()` - Updates entire display line with staggered animations
- `playClickSound()` - Generates realistic mechanical sound effects
- `startDemo()` - Automated demonstration sequence

### Character Animation Timing
- Individual flip duration: 600ms (300ms down + 300ms up)
- Character stagger delay: 80ms between positions
- Line stagger delay: 300ms between lines in multi-line updates

### Display Constraints
- 16 characters per line maximum
- 6 display lines total
- Automatic uppercase conversion and padding
- Only supports defined character set (see CHARACTERS constant)

## API Control

The display is designed for API control with hidden manual controls. Multiple API methods are available:

### HTTP API Server
Start the web server:
```bash
python3 simple_server.py 8001
# or
./start_server.sh
```

**API Endpoints:**
```bash
# Get server status
GET /api/status

# Set display content
POST /api/display
Content-Type: application/json
{
  "line1": "HELLO",
  "line2": "WORLD",
  "line3": "",
  "line4": "",
  "line5": "",
  "line6": ""
}

# Alternative format with array
POST /api/display
Content-Type: application/json
{
  "lines": ["HELLO", "WORLD", "", "", "", ""]
}

# Enable/disable datetime mode
POST /api/datetime
Content-Type: application/json
{
  "enable": true
}

# Clear display
POST /api/clear

# Start demo
POST /api/demo
```

**Examples:**
```bash
# Set display via curl
curl -X POST http://localhost:8001/api/display \
  -H "Content-Type: application/json" \
  -d '{"line1":"FLUGHAFEN MÜNCHEN","line2":"TERMINAL 2","line3":"ABFLÜGE","line4":"LH 441 FRANKFURT","line5":"GATE A15","line6":"12:30 PÜNKTLICH"}'

# Enable datetime mode
curl -X POST http://localhost:8001/api/datetime \
  -H "Content-Type: application/json" \
  -d '{"enable": true}'

# Clear display
curl -X POST http://localhost:8001/api/clear

# Start demo
curl -X POST http://localhost:8001/api/demo
```

### JavaScript API (window.splitflapAPI)
```javascript
// Set all six lines at once
window.splitflapAPI.setDisplay('LINE 1', 'LINE 2', 'LINE 3', 'LINE 4', 'LINE 5', 'LINE 6');

// Set individual line (0-5)
window.splitflapAPI.setLine(1, 'HELLO WORLD');

// Clear all lines
window.splitflapAPI.clear();

// Start demo sequence
window.splitflapAPI.demo();

// Enable/disable datetime mode
window.splitflapAPI.datetime(true);

// Get current state
window.splitflapAPI.getCurrentDisplay(); // Returns array of current text
window.splitflapAPI.isAnimating(); // Returns boolean
```

### URL Parameters
```
# Set display content
http://localhost:8001/?line1=HELLO&line2=WORLD&line3=&line4=&line5=&line6=

# Enable datetime mode
http://localhost:8001/?datetime

# Start demo
http://localhost:8001/?demo

# Clear display
http://localhost:8001/?clear
```

### PostMessage API (for iframe embedding)
```javascript
// Send commands to iframe
iframe.contentWindow.postMessage({
    action: 'setDisplay',
    data: { line1: 'HELLO', line2: 'WORLD', line3: '', line4: '', line5: '', line6: '' }
}, '*');

// Enable datetime mode
iframe.contentWindow.postMessage({
    action: 'datetime',
    data: { enable: true }
}, '*');

// Get current state
iframe.contentWindow.postMessage({ action: 'getState' }, '*');
```

### Manual Controls Access
Manual controls are hidden by default (`display: none`). To show them for debugging:
```javascript
document.querySelector('.controls').style.display = 'block';
```