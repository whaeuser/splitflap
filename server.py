#!/usr/bin/env python3
"""
Split-Flap Display Web Server
Provides HTTP API to control the split-flap display
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
import os
import mimetypes

class SplitFlapHandler(BaseHTTPRequestHandler):
    # Class variable to store current display state
    current_state = {
        'line1': '', 'line2': '', 'line3': '',
        'line4': '', 'line5': '', 'line6': '',
        'action': 'none'
    }

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/' or self.path == '/index.html':
            self.serve_file('flipboard.html')
        elif self.path == '/api/events':
            self.handle_sse()
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
                content_type = 'text/html' if file_path.endswith('.html') else 'application/octet-stream'

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

    def handle_sse(self):
        """Handle Server-Sent Events for real-time updates"""
        self.send_response(200)
        self.send_header('Content-type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        # Send current state immediately
        event_data = f"data: {json.dumps(self.current_state)}\n\n"
        try:
            self.wfile.write(event_data.encode('utf-8'))
            self.wfile.flush()
        except Exception:
            pass  # Client disconnected

    def handle_api_get(self):
        """Handle API GET requests"""
        if self.path == '/api/status':
            self.send_json_response({
                'status': 'ready',
                'display': 'split-flap',
                'lines': 6,
                'current_state': self.current_state
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
                response = self.handle_display_command(data)
                # Update class state
                if response['status'] == 'success':
                    if 'lines' in response:
                        lines = response['lines']
                        for i in range(6):
                            self.current_state[f'line{i+1}'] = lines[i] if i < len(lines) else ''
                    else:
                        for i in range(1, 7):
                            self.current_state[f'line{i}'] = response.get(f'line{i}', '')
                    self.current_state['action'] = 'setDisplay'
                self.send_json_response(response)
            elif self.path == '/api/clear':
                # Update class state
                for i in range(1, 7):
                    self.current_state[f'line{i}'] = ''
                self.current_state['action'] = 'clear'
                response = {'action': 'clear', 'status': 'success'}
                self.send_json_response(response)
            elif self.path == '/api/demo':
                self.current_state['action'] = 'demo'
                response = {'action': 'demo', 'status': 'success'}
                self.send_json_response(response)
            else:
                self.send_error(404, "API endpoint not found")

        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
        except Exception as e:
            print(f"API Error: {e}")
            self.send_error(500, "Internal server error")

    def handle_display_command(self, data):
        """Process display command"""
        response = {'action': 'setDisplay', 'status': 'success'}

        if 'lines' in data:
            lines = data['lines']
            if isinstance(lines, list) and len(lines) <= 6:
                response['lines'] = lines[:6]  # Limit to 6 lines
            else:
                response['status'] = 'error'
                response['message'] = 'lines must be array with max 6 elements'
        elif any(f'line{i}' in data for i in range(1, 7)):
            response['line1'] = data.get('line1', '')
            response['line2'] = data.get('line2', '')
            response['line3'] = data.get('line3', '')
            response['line4'] = data.get('line4', '')
            response['line5'] = data.get('line5', '')
            response['line6'] = data.get('line6', '')
        else:
            response['status'] = 'error'
            response['message'] = 'Missing display content'

        return response

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

def run_server(port=8000):
    """Start the web server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, SplitFlapHandler)

    print(f"Split-Flap Display Server starting on port {port}")
    print(f"Display: http://localhost:{port}/")
    print(f"API endpoints:")
    print(f"  GET  /api/status")
    print(f"  POST /api/display")
    print(f"  POST /api/clear")
    print(f"  POST /api/demo")
    print(f"\nPress Ctrl+C to stop the server")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.shutdown()

if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)