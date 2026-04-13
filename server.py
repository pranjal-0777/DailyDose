#!/usr/bin/env python3
"""
DailyDose of Practise — Local Server
=====================================
Serves the website AND saves entries permanently to category files.

  data/dsa.json  — all DSA entries
  data/lld.json  — all LLD entries
  data/hld.json  — all HLD entries

Usage:
    python3 server.py   (or:  bash start.sh)

Then open:  http://localhost:8080
"""

import http.server
import json
import os
import uuid

BASE     = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, 'data')

# Category → file mapping (lowercase key for safety)
CATEGORY_FILES = {
    'dsa': os.path.join(DATA_DIR, 'dsa.json'),
    'lld': os.path.join(DATA_DIR, 'lld.json'),
    'hld': os.path.join(DATA_DIR, 'hld.json'),
}
ALL_CATEGORIES = list(CATEGORY_FILES.keys())


# ─── File helpers ──────────────────────────────────────────────────────────────

def _file_for(category: str) -> str:
    """Return the data file path for a given category string."""
    return CATEGORY_FILES.get((category or '').lower(),
                              CATEGORY_FILES['dsa'])  # fallback to dsa


def _read(path: str) -> list:
    """Read a JSON array from disk, return [] if missing/corrupt."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []


def _write(path: str, data: list):
    """Write a JSON array to disk atomically-ish."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def read_category(category: str) -> list:
    return _read(_file_for(category))


def write_category(category: str, data: list):
    _write(_file_for(category), data)


def read_all() -> list:
    """Combine all category files into one list (for GET /api/questions)."""
    result = []
    for path in CATEGORY_FILES.values():
        result.extend(_read(path))
    return result


def find_entry(qid: str):
    """Return (entry_dict, category_key) or (None, None)."""
    for cat, path in CATEGORY_FILES.items():
        for q in _read(path):
            if q.get('id') == qid:
                return q, cat
    return None, None


# ─── Request Handler ───────────────────────────────────────────────────────────

class Handler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE, **kwargs)

    # ── CORS pre-flight ─────────────────────────────────
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    # ── GET ─────────────────────────────────────────────
    def do_GET(self):
        if self.path == '/api/questions':
            self._json(read_all())

        elif self.path.startswith('/api/questions/'):
            qid      = self.path.rsplit('/', 1)[-1]
            entry, _ = find_entry(qid)
            if entry:
                self._json(entry)
            else:
                self.send_error(404, 'Not found')

        else:
            super().do_GET()

    # ── POST — create ────────────────────────────────────
    def do_POST(self):
        if self.path == '/api/questions':
            data = self._body()
            if not data.get('id'):
                data['id'] = 'user_' + uuid.uuid4().hex[:10]
            cat      = (data.get('category') or 'dsa').lower()
            entries  = read_category(cat)
            entries.insert(0, data)
            write_category(cat, entries)
            print(f'  ✅  Saved → data/{cat}.json  |  [{data.get("category")}] {data.get("title", "(untitled)")}')
            self._json({'ok': True, 'id': data['id']})
        else:
            self.send_error(404)

    # ── PUT — update ─────────────────────────────────────
    def do_PUT(self):
        if self.path.startswith('/api/questions/'):
            qid      = self.path.rsplit('/', 1)[-1]
            data     = self._body()
            _, cat   = find_entry(qid)
            if cat is None:
                self.send_error(404, 'Not found')
                return
            entries = read_category(cat)
            for i, q in enumerate(entries):
                if q.get('id') == qid:
                    entries[i] = data
                    break
            write_category(cat, entries)
            print(f'  ✏️   Updated → data/{cat}.json  |  [{data.get("category")}] {data.get("title", "(untitled)")}')
            self._json({'ok': True})
        else:
            self.send_error(404)

    # ── DELETE ───────────────────────────────────────────
    def do_DELETE(self):
        if self.path.startswith('/api/questions/'):
            qid      = self.path.rsplit('/', 1)[-1]
            _, cat   = find_entry(qid)
            if cat is None:
                self.send_error(404, 'Not found')
                return
            entries  = read_category(cat)
            new_list = [q for q in entries if q.get('id') != qid]
            write_category(cat, new_list)
            print(f'  🗑️   Deleted {qid} from data/{cat}.json')
            self._json({'ok': True})
        else:
            self.send_error(404)

    # ── Helpers ──────────────────────────────────────────
    def _json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self._cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(n).decode('utf-8'))

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, fmt, *args):
        pass  # suppress default noise; we print our own


# ─── Entry point ────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    PORT = 8080

    # Ensure all category files exist
    os.makedirs(DATA_DIR, exist_ok=True)
    for cat, path in CATEGORY_FILES.items():
        if not os.path.exists(path):
            _write(path, [])
            print(f'   📄  Created empty data/{cat}.json')

    print()
    print('  ━' * 26)
    print('   ⚡  DailyDose of Practise — Local Server')
    print('  ━' * 26)
    print(f'   🌐  Open   →  http://localhost:{PORT}')
    print(f'   💾  Data   →  data/dsa.json  |  data/lld.json  |  data/hld.json')
    print(f'   🛑  Stop   →  Ctrl + C')
    print('  ━' * 26)
    print()

    with http.server.HTTPServer(('', PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n\n   👋  Server stopped. Your data is safe in data/*.json\n')
