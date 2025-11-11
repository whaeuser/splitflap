#!/usr/bin/env python3
"""
Simple Split-Flap Display Web Server
Provides HTTP API to control the split-flap display
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
import os
import mimetypes
import threading
import time

class SplitFlapHandler(BaseHTTPRequestHandler):
    # Global state for display commands
    command_queue = []
    command_lock = threading.Lock()

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/' or self.path == '/index.html':
            # Serve modular version if available, fallback to flipboard.html
            if os.path.exists('index.html'):
                self.serve_file('index.html')
            else:
                self.serve_file('flipboard.html')
        elif self.path == '/flipboard' or self.path == '/flipboard.html':
            # Legacy single-file version
            self.serve_file('flipboard.html')
        elif self.path == '/docs' or self.path == '/api-docs':
            self.serve_file('swagger-ui.html')
        elif self.path == '/api/commands':
            self.handle_command_polling()
        elif self.path.startswith('/api/'):
            self.handle_api_get()
        else:
            # Try to serve static files
            file_path = self.path.lstrip('/')
            if os.path.exists(file_path):
                self.serve_file(file_path)
            else:
                self.send_error(404)

    def do_POST(self):
        """Handle POST requests"""
        if self.path.startswith('/api/'):
            self.handle_api_post()
        else:
            self.send_error(404)

    def serve_file(self, file_path):
        """Serve a static file"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()

            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                if file_path.endswith('.html'):
                    content_type = 'text/html'
                elif file_path.endswith('.js'):
                    content_type = 'application/javascript'
                elif file_path.endswith('.css'):
                    content_type = 'text/css'
                else:
                    content_type = 'application/octet-stream'

            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.send_header('Content-length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404)
        except Exception as e:
            print(f"Error serving file {file_path}: {e}")
            self.send_error(500)

    def handle_command_polling(self):
        """Handle command polling from frontend"""
        with self.command_lock:
            if self.command_queue:
                command = self.command_queue.pop(0)
                self.send_json_response(command)
            else:
                self.send_json_response({'action': 'none'})

    def handle_api_get(self):
        """Handle API GET requests"""
        if self.path == '/api/status':
            self.send_json_response({
                'status': 'ready',
                'display': 'split-flap',
                'lines': 6
            })
        else:
            self.send_error(404, "API endpoint not found")

    def handle_api_post(self):
        """Handle API POST requests"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)

            if self.path == '/api/display':
                data = json.loads(post_data.decode('utf-8'))
                command = self.create_display_command(data)
                if command:
                    with self.command_lock:
                        self.command_queue.append(command)
                    self.send_json_response({'status': 'success', 'message': 'Command queued'})
                else:
                    self.send_json_response({'status': 'error', 'message': 'Invalid display data'})

            elif self.path == '/api/clear':
                command = {'action': 'clear'}
                with self.command_lock:
                    self.command_queue.append(command)
                self.send_json_response({'status': 'success', 'message': 'Clear command queued'})

            elif self.path == '/api/demo':
                command = {'action': 'demo'}
                with self.command_lock:
                    self.command_queue.append(command)
                self.send_json_response({'status': 'success', 'message': 'Demo command queued'})

            elif self.path == '/api/datetime':
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
                enable = data.get('enable', True)
                command = {'action': 'datetime', 'enable': enable}
                with self.command_lock:
                    self.command_queue.append(command)
                self.send_json_response({'status': 'success', 'message': f'DateTime {"enabled" if enable else "disabled"}'})

            else:
                self.send_error(404, "API endpoint not found")

        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
        except Exception as e:
            print(f"API Error: {e}")
            self.send_error(500, "Internal server error")

    def create_display_command(self, data):
        """Create display command from request data"""
        command = {'action': 'setDisplay'}

        if 'lines' in data:
            lines = data['lines']
            if isinstance(lines, list) and len(lines) <= 6:
                for i in range(6):
                    command[f'line{i+1}'] = lines[i] if i < len(lines) else ''
                # Check for colors array
                if 'colors' in data and isinstance(data['colors'], list):
                    colors = data['colors']
                    for i in range(6):
                        if i < len(colors) and colors[i]:
                            command[f'color{i+1}'] = colors[i]
                return command
        elif any(f'line{i}' in data for i in range(1, 7)):
            for i in range(1, 7):
                command[f'line{i}'] = data.get(f'line{i}', '')
                # Check for individual colors
                color = data.get(f'color{i}', None)
                if color:
                    command[f'color{i}'] = color
            return command

        return None

    def send_json_response(self, data):
        """Send JSON response"""
        response = json.dumps(data, ensure_ascii=False)
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-length', str(len(response.encode('utf-8'))))
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        """Custom logging"""
        print(f"[{self.date_time_string()}] {format % args}")

def run_server(port=8001):
    """Start the web server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, SplitFlapHandler)

    print(f"Split-Flap Display Server starting on port {port}")
    print(f"")
    print(f"🎯 Display: http://localhost:{port}/")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print(f"")
    print(f"API endpoints:")
    print(f"  GET  /api/status")
    print(f"  GET  /api/commands (polling)")
    print(f"  POST /api/display")
    print(f"  POST /api/clear")
    print(f"  POST /api/demo")
    print(f"  POST /api/datetime")
    print(f"")
    print(f"Documentation:")
    print(f"  GET  /docs (Swagger UI)")
    print(f"  GET  /api-docs.yaml (OpenAPI spec)")
    print(f"\nPress Ctrl+C to stop the server")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.shutdown()

if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run_server(port)