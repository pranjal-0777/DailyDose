#!/bin/bash
# ============================================================
# sync-data.sh — Regenerate js/data.js from JSON data files
# Run this after adding new questions to data/*.json
# Usage: bash sync-data.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 Syncing data files..."

python3 - <<'EOF'
import json, os

base = os.path.dirname(os.path.abspath(__file__)) if '__file__' in dir() else '.'

def load(name):
    path = os.path.join(base, 'data', name)
    with open(path) as f:
        return json.load(f)

dsa = load('dsa.json')
lld = load('lld.json')
hld = load('hld.json')

total = len(dsa) + len(lld) + len(hld)

output = f"""/* =====================================================
   AUTO-GENERATED — Run sync-data.sh to regenerate
   DSA: {len(dsa)} | LLD: {len(lld)} | HLD: {len(hld)} | Total: {total}
   ===================================================== */
const DSA_DATA = {json.dumps(dsa, indent=2)};
const LLD_DATA = {json.dumps(lld, indent=2)};
const HLD_DATA = {json.dumps(hld, indent=2)};
"""

out_path = os.path.join(base, 'js', 'data.js')
with open(out_path, 'w') as f:
    f.write(output)

print(f"✅ Done! Generated js/data.js")
print(f"   DSA: {len(dsa)} questions")
print(f"   LLD: {len(lld)} designs")
print(f"   HLD: {len(hld)} systems")
print(f"   Total: {total} questions")
EOF

echo ""
echo "🌐 Open index.html in your browser to see the updates!"
