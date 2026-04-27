#!/usr/bin/env bash
# Double-click in Finder to start a local HTTP server for DEV_MODE treatment videos.
# WeChat <video> can't play local package paths, so videos are served over HTTP.
# In WeChat DevTools enable: 详情 → 本地设置 → 不校验合法域名...

PORT=8000
ROOT="$(cd "$(dirname "$0")" && pwd)"
DIR="$ROOT/miniprogram/asset/treatments"
APP_JS="$ROOT/miniprogram/app.js"

if [ ! -d "$DIR" ]; then
  echo "Missing $DIR"
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi

# Guard: only run when DEV_MODE = true in app.js. Production runs serve videos
# from cloud:// storage and should not need this script.
if ! grep -qE "^const[[:space:]]+DEV_MODE[[:space:]]*=[[:space:]]*true" "$APP_JS"; then
  echo "DEV_MODE is not true in app.js — refusing to start."
  echo "  Edit $APP_JS and set: const DEV_MODE = true"
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi

cd "$DIR"
echo "Serving $DIR on http://127.0.0.1:$PORT"
echo "Files:"
ls -1 *.mp4 2>/dev/null || echo "  (no .mp4 files)"
echo
echo "Ctrl+C to stop."
echo
python3 -m http.server "$PORT"
