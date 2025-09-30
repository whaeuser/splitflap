#!/usr/bin/env python3
"""
Modern Split-Flap Display Server with FastAPI and WebSocket support
"""

import asyncio
import os
from typing import Optional, List
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from collections import deque
import time

# Configuration
API_KEY = os.getenv('SPLITFLAP_API_KEY', None)  # Optional API key
RATE_LIMIT_REQUESTS = 100  # requests
RATE_LIMIT_WINDOW = 60  # seconds

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
    version: str = "2.0.0"
    features: List[str] = ["websocket", "polling", "datetime", "demo"]

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
    return StatusResponse(
        status="ready",
        display="split-flap",
        lines=6,
        version="2.0.0",
        features=["websocket", "polling", "datetime", "demo", "rate-limiting"]
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

    return SuccessResponse(message="Display updated")

@app.post("/api/clear", response_model=SuccessResponse)
async def clear_display():
    """Clear all display lines"""
    app_state.update_display(["", "", "", "", "", ""])
    app_state.datetime_mode = False

    command = {"action": "clear"}
    app_state.add_command(command)
    await manager.broadcast(command)

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
    print(f"🛩️  Split-Flap Display Server v2.0.0")
    print(f"")
    print(f"🎯 Display: http://localhost:{port}/")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print(f"📡 WebSocket: ws://localhost:{port}/ws")
    print(f"")
    print(f"Features:")
    print(f"  ✓ WebSocket real-time communication")
    print(f"  ✓ REST API (backward compatible)")
    print(f"  ✓ Rate limiting ({RATE_LIMIT_REQUESTS} req/{RATE_LIMIT_WINDOW}s)")
    if API_KEY:
        print(f"  ✓ API Key authentication enabled")
    print(f"")
    print(f"Press Ctrl+C to stop the server")
    print(f"")

    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run_server(port=port)