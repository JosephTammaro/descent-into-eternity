#!/usr/bin/env python3
"""Static file server that cache-busts all script/style tags in index.html."""
import http.server, sys, os, re, time

BUST = str(int(time.time()))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Strip query string for file resolution
        path = self.path.split('?')[0]
        if path in ('/', '/index.html'):
            self._serve_index()
        else:
            super().do_GET()

    def _serve_index(self):
        try:
            with open('index.html', 'rb') as f:
                html = f.read().decode('utf-8')
        except FileNotFoundError:
            self.send_error(404)
            return
        # Inject ?v=BUST on all local .js and .css src/href attributes
        html = re.sub(
            r'((?:src|href)="(?!https?://)([^"]+\.(js|css)))"',
            lambda m: f'{m.group(1).rstrip("?")}?v={BUST}"',
            html
        )
        data = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # suppress request logs

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
print(f'Serving on http://localhost:{port} (cache-bust: {BUST})')
http.server.test(HandlerClass=NoCacheHandler, port=port)
