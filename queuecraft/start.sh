#!/usr/bin/env bash
# QueueCraft Startup & Development Script
# Uses strict shell error handling
set -euo pipefail

echo "=========================================================="
echo " Starting QueueCraft — Smart Queue Management System"
echo "=========================================================="

# 1. Prerequisite verification
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required but not installed or not in PATH." >&2
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Warning: Node.js 18+ is recommended (found $(node -v))." >&2
fi

# 2. Dependency check
if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Installing dependencies via npm install..."
  npm install
else
  echo "Dependencies verified."
fi

# 3. Environment configuration
export PORT="${PORT:-3000}"
export HOST="0.0.0.0"
export NODE_ENV="${NODE_ENV:-development}"

echo "Binding server to http://${HOST}:${PORT}"
echo "Watch mode active (restarts automatically on server code edits)"
echo "----------------------------------------------------------"

# 4. Start with Node's native lightweight file watcher
exec node --watch server.js
