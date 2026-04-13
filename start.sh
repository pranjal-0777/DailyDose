#!/bin/bash
# ─────────────────────────────────────────────────────────
#  DailyDose of Practise — Start Server
#  Usage: bash start.sh  (or double-click in Finder)
# ─────────────────────────────────────────────────────────

cd "$(dirname "$0")"

# Open browser automatically
sleep 0.8 && open "http://localhost:8080" &

# Start server
python3 server.py
