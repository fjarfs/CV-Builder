#!/usr/bin/env python3
import http.server
import json
import os
import sys

DEFAULT_PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CVHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_POST(self):
        if self.path == '/api/save':
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                post_body = self.rfile.read(content_len)
                data = json.loads(post_body.decode('utf-8'))
                
                # Write directly to data/cv_data.json
                data_dir = os.path.join(DIRECTORY, 'data')
                os.makedirs(data_dir, exist_ok=True)
                filepath = os.path.join(data_dir, 'cv_data.json')
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                resp = json.dumps({
                    'success': True,
                    'file': 'data/cv_data.json',
                    'message': 'Data CV berhasil disimpan ke data/cv_data.json'
                })
                self.wfile.write(resp.encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                resp = json.dumps({'success': False, 'error': str(e)})
                self.wfile.write(resp.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/api/load':
            filepath = os.path.join(DIRECTORY, 'data', 'cv_data.json')
            if os.path.exists(filepath):
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(data).encode('utf-8'))
                    return
                except Exception as e:
                    pass
            self.send_response(404)
            self.end_headers()
        else:
            super().do_GET()

def start_server():
    import argparse
    parser = argparse.ArgumentParser(description="CV Studio Local Development Server")
    parser.add_argument('port_pos', nargs='?', type=int, default=None, help='Custom port number (e.g. 3001, 8080)')
    parser.add_argument('-p', '--port', type=int, default=None, help='Custom port number (e.g. -p 3001 or --port 3001)')
    args = parser.parse_args()

    explicit_port = args.port or args.port_pos
    if explicit_port is None and 'PORT' in os.environ:
        try:
            explicit_port = int(os.environ['PORT'])
        except ValueError:
            pass

    target_port = explicit_port if explicit_port is not None else DEFAULT_PORT
    auto_fallback = (explicit_port is None)

    curr_port = target_port
    max_tries = 50
    httpd = None

    for attempt in range(max_tries):
        try:
            httpd = http.server.ThreadingHTTPServer(('', curr_port), CVHandler)
            break
        except OSError as e:
            if e.errno == 48 or 'Address already in use' in str(e):
                if auto_fallback:
                    print(f"[!] Port {curr_port} sedang digunakan. Mencoba port {curr_port + 1}...")
                    curr_port += 1
                    continue
                else:
                    print(f"Error: Port {curr_port} sedang digunakan.")
                    print(f"Gunakan port lain, contoh: python3 server.py {curr_port + 1}")
                    sys.exit(1)
            else:
                raise

    if not httpd:
        print(f"Error: Tidak dapat menemukan port yang tersedia setelah {max_tries} percobaan.")
        sys.exit(1)

    with httpd:
        print(f"✓ CV Studio server running at: http://localhost:{curr_port}")
        print("Tekan Ctrl+C untuk menghentikan server.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer dihentikan.")

if __name__ == '__main__':
    start_server()
