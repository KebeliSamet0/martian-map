"""Önbelleksiz yerel geliştirme sunucusu (yalnız statik dosya). Repo kökünden:  python sim/tools/devserver.py [port]  → /sim/"""
import functools
import http.server
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 512      # varsayılan 5: yüzlerce eşzamanlı döşeme isteğinde bağlantı reddi (ERR_CONNECTION_REFUSED)
    daemon_threads = True


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"http://127.0.0.1:{port}/sim/", flush=True)
    Server(("127.0.0.1", port), functools.partial(NoCache, directory=str(ROOT))).serve_forever()
