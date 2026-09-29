#!/usr/bin/env python3
import http.server
import json
import os
import sys

PORT = 3000
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

if __name__ == '__main__':
    with http.server.ThreadingHTTPServer(('', PORT), CVHandler) as httpd:
        print(f"CV Studio server running at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
