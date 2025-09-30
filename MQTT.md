# 🔌 MQTT Integration Guide

Split-Flap Display v2.1+ includes built-in MQTT support for IoT integration and remote control.

## 📋 Table of Contents

- [Overview](#overview)
- [Configuration](#configuration)
- [Topics](#topics)
- [Message Formats](#message-formats)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

MQTT (Message Queuing Telemetry Transport) enables:
- **IoT Integration**: Connect displays to home automation systems (Home Assistant, Node-RED, etc.)
- **Remote Control**: Send commands from anywhere
- **Multi-Display Management**: Control multiple displays from one broker
- **Event Broadcasting**: Receive status updates and events
- **Low Bandwidth**: Efficient protocol for IoT devices

## ⚙️ Configuration

### 1. Install Dependencies

```bash
pip install paho-mqtt>=1.6.1
```

### 2. Configure Environment

Create or edit `.env` file:

```bash
# MQTT Integration (optional)
MQTT_BROKER=mqtt.example.com
MQTT_PORT=1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_TOPIC_PREFIX=splitflap
MQTT_QOS=1
```

**Configuration Options:**

| Variable | Description | Default |
|----------|-------------|---------|
| `MQTT_BROKER` | MQTT broker hostname/IP (leave empty to disable) | None |
| `MQTT_PORT` | MQTT broker port | 1883 |
| `MQTT_USERNAME` | MQTT username (optional) | None |
| `MQTT_PASSWORD` | MQTT password (optional) | None |
| `MQTT_TOPIC_PREFIX` | Prefix for all MQTT topics | `splitflap` |
| `MQTT_QOS` | Quality of Service (0, 1, or 2) | 1 |

### 3. Start Server

```bash
python3 server.py
```

You should see:

```
✓ MQTT connected to mqtt.example.com:1883
  → Subscribed to splitflap/command
  → Subscribed to splitflap/display
  ...
```

## 📡 Topics

### Subscribed Topics (Server Listens)

The server subscribes to these topics and reacts to incoming messages:

| Topic | Purpose | Payload Format |
|-------|---------|----------------|
| `{prefix}/command` | Generic command handler | JSON object |
| `{prefix}/display` | Set display content | JSON object |
| `{prefix}/clear` | Clear display | Any |
| `{prefix}/demo` | Start demo | Any |
| `{prefix}/datetime` | Enable/disable datetime mode | JSON object |

### Published Topics (Server Sends)

The server publishes to these topics:

| Topic | Purpose | Payload Format | When |
|-------|---------|----------------|------|
| `{prefix}/status` | Current display state | JSON object | On every change |
| `{prefix}/event` | System events | JSON object | On events |

## 📝 Message Formats

### Display Content (`{prefix}/display`)

**Individual lines:**
```json
{
  "line1": "HELLO",
  "line2": "WORLD",
  "line3": "",
  "line4": "",
  "line5": "",
  "line6": ""
}
```

**Array format:**
```json
{
  "lines": ["HELLO", "WORLD", "", "", "", ""]
}
```

### Generic Command (`{prefix}/command`)

```json
{
  "action": "setDisplay",
  "line1": "HELLO",
  "line2": "WORLD"
}
```

**Supported actions:**
- `setDisplay` - Set display content
- `clear` - Clear display
- `demo` - Start demo
- `datetime` - Enable/disable datetime mode

### Clear Display (`{prefix}/clear`)

Any payload (even empty) will clear the display.

### Demo Mode (`{prefix}/demo`)

Any payload (even empty) will start the demo sequence.

### DateTime Mode (`{prefix}/datetime`)

```json
{
  "enable": true
}
```

### Status Updates (`{prefix}/status`)

**Published by server:**
```json
{
  "lines": ["HELLO", "WORLD", "", "", "", ""],
  "datetime_mode": false,
  "timestamp": 1709123456.789
}
```

### Events (`{prefix}/event`)

**Published by server:**
```json
{
  "event": "display_updated",
  "timestamp": 1709123456.789,
  "data": {
    "source": "mqtt",
    "lines": 2
  }
}
```

## 💡 Examples

### Using mosquitto_pub (Command Line)

**Set display content:**
```bash
mosquitto_pub -h mqtt.example.com -t "splitflap/display" \
  -m '{"line1":"FLUGHAFEN","line2":"MÜNCHEN"}'
```

**Clear display:**
```bash
mosquitto_pub -h mqtt.example.com -t "splitflap/clear" -m ""
```

**Start demo:**
```bash
mosquitto_pub -h mqtt.example.com -t "splitflap/demo" -m ""
```

**Enable datetime mode:**
```bash
mosquitto_pub -h mqtt.example.com -t "splitflap/datetime" \
  -m '{"enable":true}'
```

**With authentication:**
```bash
mosquitto_pub -h mqtt.example.com -u username -P password \
  -t "splitflap/display" -m '{"line1":"HELLO"}'
```

### Using mosquitto_sub (Monitor Messages)

**Subscribe to status updates:**
```bash
mosquitto_sub -h mqtt.example.com -t "splitflap/status" -v
```

**Subscribe to all splitflap topics:**
```bash
mosquitto_sub -h mqtt.example.com -t "splitflap/#" -v
```

### Python (paho-mqtt)

```python
import paho.mqtt.client as mqtt
import json

# Connect to broker
client = mqtt.Client()
client.username_pw_set("username", "password")
client.connect("mqtt.example.com", 1883, 60)

# Set display content
message = {
    "line1": "HELLO",
    "line2": "WORLD"
}
client.publish("splitflap/display", json.dumps(message))

# Subscribe to status updates
def on_message(client, userdata, msg):
    print(f"Status: {msg.payload.decode()}")

client.on_message = on_message
client.subscribe("splitflap/status")
client.loop_forever()
```

### Node-RED

**Inject Node → MQTT Out:**
```json
{
  "topic": "splitflap/display",
  "payload": {
    "line1": "NODE-RED",
    "line2": "CONTROL"
  }
}
```

**MQTT In → Debug:**
- Subscribe to `splitflap/status`
- View real-time display updates

### Home Assistant

**configuration.yaml:**
```yaml
mqtt:
  - publish:
      topic: "splitflap/display"
      payload_template: >
        {"line1":"TEMP {{states('sensor.temperature')}}","line2":"HUMIDITY {{states('sensor.humidity')}}"}
```

**Automation:**
```yaml
automation:
  - alias: "Update Splitflap on Door Open"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door
        to: "on"
    action:
      - service: mqtt.publish
        data:
          topic: "splitflap/display"
          payload: '{"line1":"DOOR OPEN","line2":"WELCOME HOME"}'
```

## 🔧 Advanced Usage

### Multiple Displays

Use different topic prefixes for multiple displays:

**Display 1:**
```bash
MQTT_TOPIC_PREFIX=splitflap/lobby
```

**Display 2:**
```bash
MQTT_TOPIC_PREFIX=splitflap/entrance
```

### Quality of Service Levels

- **QoS 0**: At most once (fire and forget)
- **QoS 1**: At least once (default, recommended)
- **QoS 2**: Exactly once (highest overhead)

### Retained Messages

To have the last message persist:

```bash
mosquitto_pub -h mqtt.example.com -t "splitflap/display" \
  -m '{"line1":"PERMANENT"}' -r
```

## 🐛 Troubleshooting

### MQTT Not Starting

**Check logs:**
```bash
python3 server.py
```

Look for:
```
✓ MQTT connected to mqtt.example.com:1883
```

**Common issues:**

1. **"MQTT disabled (no broker configured)"**
   - Solution: Set `MQTT_BROKER` in `.env`

2. **"Warning: paho-mqtt not installed"**
   - Solution: `pip install paho-mqtt>=1.6.1`

3. **Connection refused**
   - Check broker is running
   - Verify hostname/IP and port
   - Check firewall rules

4. **Authentication failed**
   - Verify username/password
   - Check broker ACL rules

### Messages Not Received

1. **Check topic subscription:**
   ```bash
   mosquitto_sub -h mqtt.example.com -t "splitflap/#" -v
   ```

2. **Verify JSON format:**
   - Must be valid JSON
   - Line keys: `line1` through `line6`

3. **Check QoS level:**
   - Try increasing QoS in `.env`

### Testing Connection

**Test broker connectivity:**
```bash
mosquitto_pub -h mqtt.example.com -t "test" -m "hello"
mosquitto_sub -h mqtt.example.com -t "test"
```

## 🔒 Security Best Practices

1. **Use Authentication:**
   - Always set `MQTT_USERNAME` and `MQTT_PASSWORD`
   - Never use default credentials

2. **Use TLS/SSL:**
   - Configure broker to use port 8883 with TLS
   - Update `MQTT_PORT=8883`

3. **Network Segmentation:**
   - Keep MQTT traffic on isolated network/VLAN
   - Use firewall rules to restrict access

4. **ACL Rules:**
   - Restrict which clients can publish/subscribe to topics
   - Use broker ACL configuration

## 📚 Additional Resources

- **MQTT Spec:** https://mqtt.org/
- **Paho Python:** https://www.eclipse.org/paho/index.php?page=clients/python/index.php
- **Mosquitto:** https://mosquitto.org/
- **Home Assistant MQTT:** https://www.home-assistant.io/integrations/mqtt/
- **Node-RED MQTT:** https://cookbook.nodered.org/mqtt/

## 🆘 Support

- **GitHub Issues:** https://github.com/whaeuser/splitflap/issues
- **MQTT.org Community:** https://mqtt.org/community

---

**Split-Flap Display v2.1+** | MQTT Integration | Made with ❤️ for IoT enthusiasts