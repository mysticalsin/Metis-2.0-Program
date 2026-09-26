#!/usr/bin/env python3
"""Serve this kit on loopback only. No install, source mutation, directory index or cloud access."""
from __future__ import annotations
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def list_directory(self, path):
        self.send_error(403, 'Directory listing is disabled; open /OPEN-METIS-2.html')
        return None
    def log_message(self, fmt, *args):
        pass  # no request/URL log files
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8765)
    args=parser.parse_args()
    if not 1024 <= args.port <= 65535:parser.error('Choose an unprivileged port from 1024 to 65535.')
    try:
        server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(Handler,directory=str(ROOT)))
    except OSError as exc:
        raise SystemExit(f'Could not start the local preview: {exc}. Choose another --port.')
    print(f'Open http://127.0.0.1:{args.port}/OPEN-METIS-2.html\nLoopback only. Ctrl+C stops the server.')
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
