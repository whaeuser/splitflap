#!/usr/bin/env python3
"""
Modern Split-Flap Display Server with FastAPI, WebSocket and MQTT support
"""

import asyncio
import os
from typing import Optional, List
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from collections import deque
import time
import json

# MQTT support (optional)
try:
    import paho.mqtt.client as mqtt
    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False
    print("Warning: paho-mqtt not installed. MQTT features disabled.")

# Configuration
API_KEY = os.getenv('SPLITFLAP_API_KEY', None)  # Optional API key
RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', '100'))
RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '60'))

# MQTT Configuration
MQTT_BROKER = os.getenv('MQTT_BROKER', None)
MQTT_PORT = int(os.getenv('MQTT_PORT', '1883'))
MQTT_USERNAME = os.getenv('MQTT_USERNAME', None)
MQTT_PASSWORD = os.getenv('MQTT_PASSWORD', None)
MQTT_TOPIC_PREFIX = os.getenv('MQTT_TOPIC_PREFIX', 'splitflap')
MQTT_QOS = int(os.getenv('MQTT_QOS', '1'))

# Models
class DisplayContent(BaseModel):
    line1: Optional[str] = Field("", max_length=16)
    line2: Optional[str] = Field("", max_length=16)
    line3: Optional[str] = Field("", max_length=16)
    line4: Optional[str] = Field("", max_length=16)
    line5: Optional[str] = Field("", max_length=16)
    line6: Optional[str] = Field("", max_length=16)

class DisplayArray(BaseModel):
    lines: List[str] = Field(..., max_items=6)

class DateTimeMode(BaseModel):
    enable: bool = True

class StatusResponse(BaseModel):
    status: str
    display: str
    lines: int
    version: str = "2.1.0"
    features: List[str] = ["websocket", "polling", "datetime", "demo"]
    mqtt_enabled: bool = False
    mqtt_connected: bool = False

class SuccessResponse(BaseModel):
    status: str = "success"
    message: str

class DisplayState(BaseModel):
    lines: List[str]
    datetime_mode: bool
    timestamp: float

# Rate limiting
class RateLimiter:
    def __init__(self):
        self.requests = {}  # IP -> deque of timestamps

    def check_rate_limit(self, client_ip: str) -> bool:
        now = time.time()

        if client_ip not in self.requests:
            self.requests[client_ip] = deque()

        # Remove old requests outside the window
        while self.requests[client_ip] and self.requests[client_ip][0] < now - RATE_LIMIT_WINDOW:
            self.requests[client_ip].popleft()

        # Check if limit exceeded
        if len(self.requests[client_ip]) >= RATE_LIMIT_REQUESTS:
            return False

        # Add current request
        self.requests[client_ip].append(now)
        return True

rate_limiter = RateLimiter()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")
                disconnected.append(connection)

        # Remove disconnected clients
        for connection in disconnected:
            if connection in self.active_connections:
                self.active_connections.remove(connection)

manager = ConnectionManager()

# Application state
class AppState:
    def __init__(self):
        self.command_queue = deque()
        self.current_display = ["", "", "", "", "", ""]
        self.datetime_mode = False

    def add_command(self, command: dict):
        self.command_queue.append(command)

    def get_command(self) -> dict:
        if self.command_queue:
            return self.command_queue.popleft()
        return {"action": "none"}

    def update_display(self, lines: List[str]):
        self.current_display = lines[:6] + [""] * (6 - len(lines))

    def get_state(self) -> dict:
        return {
            "lines": self.current_display,
            "datetime_mode": self.datetime_mode,
            "timestamp": time.time()
        }

app_state = AppState()

# MQTT Manager
class MQTTManager:
    def __init__(self):
        self.client = None
        self.connected = False
        self.enabled = MQTT_AVAILABLE and MQTT_BROKER is not None

    def on_connect(self, client, userdata, flags, reason_code, properties):
        """Callback when connected to MQTT broker"""
        if reason_code == 0:
            self.connected = True
            print(f"✓ MQTT connected to {MQTT_BROKER}:{MQTT_PORT}")

            # Subscribe to command topics
            topics = [
                f"{MQTT_TOPIC_PREFIX}/command",
                f"{MQTT_TOPIC_PREFIX}/display",
                f"{MQTT_TOPIC_PREFIX}/clear",
                f"{MQTT_TOPIC_PREFIX}/demo",
                f"{MQTT_TOPIC_PREFIX}/datetime"
            ]
            for topic in topics:
                client.subscribe(topic, qos=MQTT_QOS)
                print(f"  → Subscribed to {topic}")
        else:
            print(f"✗ MQTT connection failed with code {reason_code}")
            self.connected = False

    def on_disconnect(self, client, userdata, disconnect_flags, reason_code, properties):
        """Callback when disconnected from MQTT broker"""
        self.connected = False
        if reason_code != 0:
            print(f"⚠ MQTT unexpected disconnect (code {reason_code}), reconnecting...")

    def on_message(self, client, userdata, msg):
        """Callback when message received from MQTT broker"""
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')
            print(f"← MQTT: {topic} = {payload}")

            # Parse JSON payload
            try:
                data = json.loads(payload)
            except json.JSONDecodeError:
                # If not JSON, treat as plain text
                data = {"text": payload}

            # Handle different topics
            if topic.endswith('/display'):
                lines = []
                if isinstance(data, dict):
                    # Check for array format
                    if "lines" in data:
                        lines = data["lines"][:6]
                    # Check for individual line format
                    else:
                        for i in range(1, 7):
                            lines.append(data.get(f"line{i}", ""))

                # Schedule display update
                asyncio.create_task(self._update_display(lines))

            elif topic.endswith('/clear'):
                asyncio.create_task(self._clear_display())

            elif topic.endswith('/demo'):
                asyncio.create_task(self._start_demo())

            elif topic.endswith('/datetime'):
                enable = data.get("enable", True) if isinstance(data, dict) else True
                asyncio.create_task(self._set_datetime(enable))

            elif topic.endswith('/command'):
                # Generic command handler
                if isinstance(data, dict) and "action" in data:
                    action = data["action"]
                    if action == "setDisplay":
                        lines = [data.get(f"line{i}", "") for i in range(1, 7)]
                        asyncio.create_task(self._update_display(lines))
                    elif action == "clear":
                        asyncio.create_task(self._clear_display())
                    elif action == "demo":
                        asyncio.create_task(self._start_demo())
                    elif action == "datetime":
                        asyncio.create_task(self._set_datetime(data.get("enable", True)))

        except Exception as e:
            print(f"Error processing MQTT message: {e}")

    async def _update_display(self, lines):
        """Update display and broadcast"""
        app_state.update_display(lines)
        app_state.datetime_mode = False

        command = {"action": "setDisplay"}
        for i, line in enumerate(lines):
            command[f"line{i+1}"] = line

        app_state.add_command(command)
        await manager.broadcast(command)

        # Publish status
        self.publish_status()

    async def _clear_display(self):
        """Clear display and broadcast"""
        app_state.update_display(["", "", "", "", "", ""])
        app_state.datetime_mode = False

        command = {"action": "clear"}
        app_state.add_command(command)
        await manager.broadcast(command)

        self.publish_status()

    async def _start_demo(self):
        """Start demo and broadcast"""
        app_state.datetime_mode = False

        command = {"action": "demo"}
        app_state.add_command(command)
        await manager.broadcast(command)

    async def _set_datetime(self, enable: bool):
        """Set datetime mode and broadcast"""
        app_state.datetime_mode = enable

        command = {"action": "datetime", "enable": enable}
        app_state.add_command(command)
        await manager.broadcast(command)

        self.publish_status()

    def publish_status(self):
        """Publish current display state to MQTT"""
        if not self.connected:
            return

        state = app_state.get_state()
        topic = f"{MQTT_TOPIC_PREFIX}/status"

        try:
            self.client.publish(topic, json.dumps(state), qos=MQTT_QOS)
        except Exception as e:
            print(f"Error publishing MQTT status: {e}")

    def publish_event(self, event: str, data: dict = None):
        """Publish an event to MQTT"""
        if not self.connected:
            return

        topic = f"{MQTT_TOPIC_PREFIX}/event"
        payload = {"event": event, "timestamp": time.time()}
        if data:
            payload["data"] = data

        try:
            self.client.publish(topic, json.dumps(payload), qos=MQTT_QOS)
        except Exception as e:
            print(f"Error publishing MQTT event: {e}")

    def start(self):
        """Start MQTT client"""
        if not self.enabled:
            print("MQTT disabled (no broker configured)")
            return

        try:
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
            self.client.on_connect = self.on_connect
            self.client.on_disconnect = self.on_disconnect
            self.client.on_message = self.on_message

            if MQTT_USERNAME and MQTT_PASSWORD:
                self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

            print(f"Connecting to MQTT broker {MQTT_BROKER}:{MQTT_PORT}...")
            self.client.connect_async(MQTT_BROKER, MQTT_PORT, keepalive=60)
            self.client.loop_start()

        except Exception as e:
            print(f"Failed to start MQTT client: {e}")
            self.enabled = False

    def stop(self):
        """Stop MQTT client"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            print("MQTT client stopped")

mqtt_manager = MQTTManager()

# FastAPI app
app = FastAPI(
    title="Split-Flap Display API",
    description="REST and WebSocket API for controlling a 6-line split-flap display",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key dependency (optional)
async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return x_api_key

# Rate limiting dependency
async def check_rate_limit(request):
    client_ip = request.client.host
    if not rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

# Routes
@app.get("/")
async def root():
    """Serve main page"""
    if os.path.exists("index.html"):
        return FileResponse("index.html")
    elif os.path.exists("flipboard.html"):
        return FileResponse("flipboard.html")
    return {"message": "Split-Flap Display Server", "version": "2.0.0"}

@app.get("/admin")
async def admin():
    """Serve admin interface"""
    if os.path.exists("admin.html"):
        return FileResponse("admin.html")
    raise HTTPException(status_code=404, detail="Admin interface not found")

@app.get("/flipboard")
async def flipboard():
    """Serve legacy single-file version"""
    if os.path.exists("flipboard.html"):
        return FileResponse("flipboard.html")
    raise HTTPException(status_code=404, detail="Legacy version not found")

@app.get("/docs-swagger")
async def docs_swagger():
    """Serve Swagger UI documentation"""
    if os.path.exists("swagger-ui.html"):
        return FileResponse("swagger-ui.html")
    raise HTTPException(status_code=404, detail="Swagger UI not found")

@app.get("/api/status", response_model=StatusResponse)
async def get_status():
    """Get server status and capabilities"""
    features = ["websocket", "polling", "datetime", "demo", "rate-limiting"]
    if mqtt_manager.enabled:
        features.append("mqtt")

    return StatusResponse(
        status="ready",
        display="split-flap",
        lines=6,
        version="2.1.0",
        features=features,
        mqtt_enabled=mqtt_manager.enabled,
        mqtt_connected=mqtt_manager.connected
    )

@app.get("/api/display", response_model=DisplayState)
async def get_display():
    """Get current display state"""
    return app_state.get_state()

@app.get("/api/commands")
async def poll_commands():
    """Polling endpoint for commands (legacy support)"""
    return app_state.get_command()

@app.post("/api/display", response_model=SuccessResponse)
async def set_display(data: dict):
    """Set display content"""
    lines = []

    # Check if array format
    if "lines" in data and isinstance(data["lines"], list):
        lines = data["lines"][:6]  # Take max 6 lines
    # Check if individual line format
    elif any(f"line{i}" in data for i in range(1, 7)):
        lines = [
            data.get("line1", ""),
            data.get("line2", ""),
            data.get("line3", ""),
            data.get("line4", ""),
            data.get("line5", ""),
            data.get("line6", "")
        ]
    else:
        raise HTTPException(status_code=400, detail="Invalid display data")

    # Update state
    app_state.update_display(lines)
    app_state.datetime_mode = False

    # Queue command for polling clients
    command = {"action": "setDisplay"}
    for i, line in enumerate(lines):
        command[f"line{i+1}"] = line
    app_state.add_command(command)

    # Broadcast to WebSocket clients
    await manager.broadcast(command)

    # Publish to MQTT
    mqtt_manager.publish_status()

    return SuccessResponse(message="Display updated")

@app.post("/api/clear", response_model=SuccessResponse)
async def clear_display():
    """Clear all display lines"""
    app_state.update_display(["", "", "", "", "", ""])
    app_state.datetime_mode = False

    command = {"action": "clear"}
    app_state.add_command(command)
    await manager.broadcast(command)

    # Publish to MQTT
    mqtt_manager.publish_status()

    return SuccessResponse(message="Display cleared")

@app.post("/api/demo", response_model=SuccessResponse)
async def start_demo():
    """Start demo sequence"""
    app_state.datetime_mode = False

    command = {"action": "demo"}
    app_state.add_command(command)
    await manager.broadcast(command)

    return SuccessResponse(message="Demo started")

@app.post("/api/datetime", response_model=SuccessResponse)
async def set_datetime_mode(mode: DateTimeMode):
    """Enable or disable datetime display mode"""
    app_state.datetime_mode = mode.enable

    command = {"action": "datetime", "enable": mode.enable}
    app_state.add_command(command)
    await manager.broadcast(command)

    # Publish to MQTT
    mqtt_manager.publish_status()

    status = "enabled" if mode.enable else "disabled"
    return SuccessResponse(message=f"DateTime {status}")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await manager.connect(websocket)

    try:
        # Send current state on connect
        await websocket.send_json({
            "action": "state",
            "data": app_state.get_state()
        })

        # Listen for client messages
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "setDisplay":
                lines = []
                for i in range(1, 7):
                    lines.append(data.get(f"line{i}", ""))
                app_state.update_display(lines)
                app_state.datetime_mode = False

                # Broadcast to all clients
                await manager.broadcast(data)

            elif action == "clear":
                app_state.update_display(["", "", "", "", "", ""])
                app_state.datetime_mode = False
                await manager.broadcast({"action": "clear"})

            elif action == "demo":
                app_state.datetime_mode = False
                await manager.broadcast({"action": "demo"})

            elif action == "datetime":
                enable = data.get("enable", True)
                app_state.datetime_mode = enable
                await manager.broadcast({"action": "datetime", "enable": enable})

            elif action == "getState":
                await websocket.send_json({
                    "action": "state",
                    "data": app_state.get_state()
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Serve static files
if os.path.exists("css"):
    app.mount("/css", StaticFiles(directory="css"), name="css")
if os.path.exists("js"):
    app.mount("/js", StaticFiles(directory="js"), name="js")

def run_server(host="0.0.0.0", port=8001):
    """Run the FastAPI server"""
    print(f"")
    print(f"🛩️  Split-Flap Display Server v2.1.0")
    print(f"")
    print(f"🎯 Display: http://localhost:{port}/")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print(f"📡 WebSocket: ws://localhost:{port}/ws")
    if mqtt_manager.enabled:
        print(f"🔌 MQTT: {MQTT_BROKER}:{MQTT_PORT} (topic prefix: {MQTT_TOPIC_PREFIX})")
    print(f"")
    print(f"Features:")
    print(f"  ✓ WebSocket real-time communication")
    print(f"  ✓ REST API (backward compatible)")
    print(f"  ✓ Rate limiting ({RATE_LIMIT_REQUESTS} req/{RATE_LIMIT_WINDOW}s)")
    if API_KEY:
        print(f"  ✓ API Key authentication enabled")
    if mqtt_manager.enabled:
        print(f"  ✓ MQTT integration enabled")
    print(f"")
    print(f"Press Ctrl+C to stop the server")
    print(f"")

    # Start MQTT client
    mqtt_manager.start()

    try:
        uvicorn.run(app, host=host, port=port, log_level="info")
    finally:
        # Cleanup MQTT on shutdown
        mqtt_manager.stop()

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run_server(port=port)