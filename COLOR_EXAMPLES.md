# 🎨 Color Control Examples

Split-Flap Display now supports per-line color control! You can set different colors for each of the 6 lines.

## Available Colors

- `blau` - Blue (#4A90E2)
- `hellblau` - Light Blue (#87CEEB)
- `rot` - Red (#E74C3C)
- `gruen` - Green (#2ECC71)
- `hellgruen` - Light Green (#A8E6A1)
- `orange` - Orange (#FF8C42)
- `violett` - Violet (#9B59B6)
- `rosa` - Pink (#FFB6C1)
- `gelb` - Yellow (#F1C40F)
- `weiss` - White (#FFFFFF) - Default color

## HTTP API Examples

### Individual Line Format

```bash
curl -X POST http://localhost:8001/api/display \
  -H "Content-Type: application/json" \
  -d '{
    "line1": "FLUGHAFEN",
    "line2": "MÜNCHEN",
    "line3": "TERMINAL 2",
    "line4": "ABFLUG",
    "line5": "GATE A15",
    "line6": "12:30",
    "color1": "blau",
    "color2": "hellblau",
    "color3": "gruen",
    "color4": "orange",
    "color5": "rot",
    "color6": "gelb"
  }'
```

### Array Format

```bash
curl -X POST http://localhost:8001/api/display \
  -H "Content-Type: application/json" \
  -d '{
    "lines": ["ZEILE 1", "ZEILE 2", "ZEILE 3", "ZEILE 4", "ZEILE 5", "ZEILE 6"],
    "colors": ["rot", "gruen", "blau", "gelb", "orange", "violett"]
  }'
```

### Mixed (Some Lines With Colors)

```bash
curl -X POST http://localhost:8001/api/display \
  -H "Content-Type: application/json" \
  -d '{
    "line1": "MIT FARBE",
    "line2": "STANDARD",
    "line3": "MIT FARBE",
    "line4": "STANDARD",
    "line5": "MIT FARBE",
    "line6": "STANDARD",
    "color1": "rot",
    "color3": "gruen",
    "color5": "blau"
  }'
```

## MQTT Examples

### Individual Line Format

```bash
mosquitto_pub -h mqtt.example.com -t "splitflap/display" \
  -m '{
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
  }'
```

### Array Format

```bash
mosquitto_pub -h mqtt.example.com -t "splitflap/display" \
  -m '{
    "lines": ["BAHNHOF", "ICE 123", "NACH BERLIN", "GLEIS 7", "14:45", "PÜNKTLICH"],
    "colors": ["blau", "hellblau", "gruen", "orange", "gelb", "gruen"]
  }'
```

## JavaScript API Examples

### Browser Console / Script

```javascript
// Set display with colors
window.splitflapAPI.setDisplay(
  'ZEILE 1', 'ZEILE 2', 'ZEILE 3', 'ZEILE 4', 'ZEILE 5', 'ZEILE 6',
  'rot', 'gruen', 'blau', 'gelb', 'orange', 'violett'
);

// Set individual line with color
window.splitflapAPI.setLine(0, 'HELLO WORLD', 'rot');
window.splitflapAPI.setLine(1, 'SECOND LINE', 'gruen');

// Set color for existing line
window.splitflapAPI.setLineColor(2, 'blau');

// Get available colors
console.log(window.splitflapAPI.getColors());
// Output: ['blau', 'hellblau', 'rot', 'gruen', 'hellgruen', 'orange', 'violett', 'rosa', 'gelb', 'weiss']
```

### PostMessage API (iframe)

```javascript
// Send to iframe
iframe.contentWindow.postMessage({
  action: 'setDisplay',
  data: {
    line1: 'HELLO',
    line2: 'WORLD',
    line3: 'TEST',
    line4: 'DISPLAY',
    line5: 'WITH',
    line6: 'COLORS',
    color1: 'rot',
    color2: 'gruen',
    color3: 'blau',
    color4: 'gelb',
    color5: 'orange',
    color6: 'violett'
  }
}, '*');

// Set individual line with color
iframe.contentWindow.postMessage({
  action: 'setLine',
  data: {
    lineIndex: 0,
    text: 'COLORED LINE',
    color: 'rot'
  }
}, '*');
```

## Python Examples

```python
import requests
import json

BASE_URL = "http://localhost:8001"

# Example 1: Airport departure with status colors
def airport_departure():
    data = {
        "line1": "FLUGHAFEN MÜNCHEN",
        "line2": "LH 441 FRANKFURT",
        "line3": "ABFLUG 12:30",
        "line4": "GATE A15",
        "line5": "BOARDING NOW",
        "line6": "PÜNKTLICH",
        "color1": "blau",
        "color2": "hellblau",
        "color3": "gelb",
        "color4": "orange",
        "color5": "orange",
        "color6": "gruen"
    }
    requests.post(f"{BASE_URL}/api/display", json=data)

# Example 2: Train delay with warning colors
def train_delay():
    data = {
        "line1": "HAUPTBAHNHOF",
        "line2": "ICE 123 BERLIN",
        "line3": "GLEIS 7",
        "line4": "VERSPAETUNG",
        "line5": "+25 MINUTEN",
        "line6": "WIR BITTEN UM",
        "color1": "blau",
        "color2": "hellblau",
        "color3": "gelb",
        "color4": "rot",
        "color5": "rot",
        "color6": "orange"
    }
    requests.post(f"{BASE_URL}/api/display", json=data)

# Example 3: Array format
def array_format():
    data = {
        "lines": [
            "STATUS",
            "ALLE SYSTEME",
            "BETRIEBSBEREIT",
            "TEMPERATUR 22C",
            "LUFTFEUCHT. 45%",
            "OK"
        ],
        "colors": [
            "blau",
            "hellblau",
            "gruen",
            "gelb",
            "gelb",
            "gruen"
        ]
    }
    requests.post(f"{BASE_URL}/api/display", json=data)

# Example 4: Highlight specific lines
def highlight_alert():
    data = {
        "line1": "ACHTUNG",
        "line2": "WICHTIGE",
        "line3": "DURCHSAGE",
        "line4": "BITTE BEACHTEN",
        "line5": "BAHNSTEIG 3",
        "line6": "GESPERRT",
        "color1": "rot",
        "color2": "rot",
        "color3": "rot",
        "color4": "orange",
        "color5": "gelb",
        "color6": "rot"
    }
    requests.post(f"{BASE_URL}/api/display", json=data)

if __name__ == "__main__":
    airport_departure()
```

## MQTT with Python (paho-mqtt)

```python
import paho.mqtt.client as mqtt
import json

client = mqtt.Client()
client.connect("mqtt.example.com", 1883, 60)

# Publish with colors
message = {
    "line1": "SENSOR DATA",
    "line2": "TEMPERATURE 25C",
    "line3": "HUMIDITY 60%",
    "line4": "PRESSURE 1013",
    "line5": "STATUS OK",
    "line6": "12:30:45",
    "color1": "blau",
    "color2": "orange",
    "color3": "hellblau",
    "color4": "gelb",
    "color5": "gruen",
    "color6": "blau"
}
client.publish("splitflap/display", json.dumps(message))
```

## Node-RED Example

```json
{
  "topic": "splitflap/display",
  "payload": {
    "lines": [
      "PRODUCTION",
      "UNITS: 1234",
      "DEFECTS: 5",
      "EFFICIENCY 98%",
      "SHIFT: MORNING",
      "STATUS: RUNNING"
    ],
    "colors": [
      "blau",
      "hellblau",
      "orange",
      "gruen",
      "gelb",
      "gruen"
    ]
  }
}
```

## Use Cases

### 1. Airport/Train Status
- Normal: `gruen` (green)
- Delayed: `orange` or `gelb` (yellow)
- Cancelled: `rot` (red)
- Boarding: `blau` (blue)

### 2. Smart Home / IoT
- Temperature: `orange` (warm) / `hellblau` (cool)
- Status OK: `gruen` (green)
- Warnings: `gelb` (yellow)
- Errors: `rot` (red)

### 3. Production Monitoring
- Production data: `blau` (blue)
- Efficiency: `gruen` (green) / `gelb` (yellow) / `rot` (red)
- Targets: `hellblau` (light blue)

### 4. Event Announcements
- Title: `blau` (blue)
- Information: default white
- Important: `orange` or `gelb`
- Critical: `rot` (red)

## Backward Compatibility

The color feature is fully backward compatible. All existing API calls without color parameters will continue to work with the default white color.

```bash
# This still works - displays in default color
curl -X POST http://localhost:8001/api/display \
  -H "Content-Type: application/json" \
  -d '{
    "line1": "HELLO",
    "line2": "WORLD"
  }'
```

## Tips

1. **Color Names**: Use lowercase German color names for consistency
2. **Invalid Colors**: Invalid color names will default to white
3. **Partial Colors**: You can color only specific lines, others remain default white
4. **Readability**: Choose colors that contrast well with the black background
5. **Consistency**: Use consistent color schemes for similar types of information
