#!/usr/bin/env python3
"""Static file server with cache-busting and live-reload.

Live-reload works by:
  1. A background thread watches all .js / .css / .html files for mtime changes.
  2. GET /livereload returns {"v": <max_mtime_int>} as JSON.
  3. A small polling script is injected into index.html; it calls /livereload
     every second and reloads when the version number changes.
"""
import http.server, sys, os, re, time, json, threading

BUST = str(int(time.time()))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

# ── Live-reload state ─────────────────────────────────────────────────────────
_watched_exts = {'.js', '.css', '.html'}
_lr_lock      = threading.Lock()
_lr_version   = 0   # incremented whenever a file changes

def _scan_version():
    """Return the max mtime across all watched files."""
    latest = 0
    for root, dirs, files in os.walk('.'):
        # Skip hidden dirs and node_modules
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        for fn in files:
            if os.path.splitext(fn)[1] in _watched_exts:
                try:
                    t = os.path.getmtime(os.path.join(root, fn))
                    if t > latest:
                        latest = t
                except OSError:
                    pass
    return int(latest)

def _watch_loop():
    global _lr_version
    last = _scan_version()
    with _lr_lock:
        _lr_version = last
    while True:
        time.sleep(0.8)
        current = _scan_version()
        if current != last:
            last = current
            with _lr_lock:
                _lr_version = current

threading.Thread(target=_watch_loop, daemon=True).start()

# ── Injected live-reload script ───────────────────────────────────────────────
_LR_SCRIPT = """
<script>
(function(){
  var _lrv = null;
  function check(){
    fetch('/livereload').then(function(r){return r.json();}).then(function(d){
      if(_lrv === null){ _lrv = d.v; return; }
      if(d.v !== _lrv){ location.reload(true); }
    }).catch(function(){});
  }
  setInterval(check, 1000);
})();
</script>
"""

# ── Request handler ───────────────────────────────────────────────────────────
class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/livereload':
            self._serve_livereload()
        elif path in ('/', '/index.html'):
            self._serve_index()
        else:
            super().do_GET()

    def _serve_livereload(self):
        with _lr_lock:
            v = _lr_version
        body = json.dumps({'v': v}).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def _serve_index(self):
        try:
            with open('index.html', 'rb') as f:
                html = f.read().decode('utf-8')
        except FileNotFoundError:
            self.send_error(404)
            return
        # Cache-bust all local .js and .css references
        html = re.sub(
            r'((?:src|href)="(?!https?://)([^"]+\.(js|css)))"',
            lambda m: f'{m.group(1).rstrip("?")}?v={BUST}"',
            html
        )
        # Inject live-reload polling script just before </body>
        html = html.replace('</body>', _LR_SCRIPT + '</body>', 1)
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

print(f'Serving on http://localhost:{PORT} (cache-bust: {BUST}, live-reload: ON)')
http.server.test(HandlerClass=NoCacheHandler, port=PORT)
