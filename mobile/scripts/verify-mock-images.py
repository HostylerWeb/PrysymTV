#!/usr/bin/env python3
"""Verify all remote mock image URLs return HTTP 200."""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / 'src/lib/mock-images.ts').read_text()

urls = set()

for pid, w, h in re.findall(r"unsplash\('([^']+)'(?:,\s*(\d+),\s*(\d+))?\)", text):
    w = w or '640'
    h = h or '360'
    urls.add(f'https://images.unsplash.com/{pid}?auto=format&fit=crop&w={w}&h={h}&q=80')

for path in re.findall(r"path: '([^']+)'", text):
    urls.add(f'https://image.tmdb.org/t/p/w500/{path}')

bad = []
for u in sorted(urls):
    r = subprocess.run(
        ['curl', '-sI', '-L', '-o', '/dev/null', '-w', '%{http_code}', u],
        capture_output=True,
        text=True,
        timeout=20,
    )
    code = r.stdout.strip()
    if code != '200':
        bad.append((code, u))

print(f'Checked {len(urls)} URLs')
if bad:
    print(f'FAILED {len(bad)}:')
    for code, u in bad:
        print(f'  [{code}] {u}')
    sys.exit(1)
print('All image URLs OK (200)')
