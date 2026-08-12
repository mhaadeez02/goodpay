import http.server
import sys
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        if path.endswith('.json') or path.endswith('.webmanifest'):
            return 'application/json; charset=utf-8'
        if path.endswith('.svg'):
            return 'image/svg+xml'
        if path.endswith('.css'):
            return 'text/css; charset=utf-8'
        return super().guess_type(path)

if __name__ == '__main__':
    print(f"GoodPay Multi-threaded Server running on http://localhost:{PORT}")
    try:
        httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
        httpd.serve_forever()
    except Exception as e:
        print(f"Server error: {e}")
        sys.exit(1)
