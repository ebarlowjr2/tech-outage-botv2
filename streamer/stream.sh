#!/usr/bin/env bash
#
# Tech Outage Bot — 24/7 stream engine
# Captures the live dashboard in a headless Chromium on a virtual X display
# and pushes it to YouTube (or any RTMP target) via ffmpeg, with auto-recovery.
#
set -uo pipefail

# --- Config (all overridable via env) ---
STREAM_URL="${YOUTUBE_STREAM_URL:-rtmp://a.rtmp.youtube.com/live2}"
STREAM_KEY="${YOUTUBE_STREAM_KEY:?YOUTUBE_STREAM_KEY is required}"
DASHBOARD_URL="${DASHBOARD_URL:-https://tech-outage-botv2.vercel.app/}"
WIDTH="${STREAM_WIDTH:-1920}"
HEIGHT="${STREAM_HEIGHT:-1080}"
FPS="${STREAM_FPS:-30}"
VIDEO_BITRATE="${VIDEO_BITRATE:-4500k}"
BUFSIZE="${VIDEO_BUFSIZE:-9000k}"
DISPLAY_NUM="${DISPLAY_NUM:-99}"
PAGE_WARMUP_SECONDS="${PAGE_WARMUP_SECONDS:-10}"
export DISPLAY=":${DISPLAY_NUM}"

# Pick whichever chromium binary the base image provides.
CHROMIUM_BIN="$(command -v chromium || command -v chromium-browser || true)"
if [ -z "${CHROMIUM_BIN}" ]; then
  echo "[stream] FATAL: no chromium binary found on PATH" >&2
  exit 1
fi

log() { echo "[stream $(date -u +%H:%M:%S)] $*"; }

cleanup() {
  log "shutting down..."
  pkill -f "ffmpeg" 2>/dev/null || true
  pkill -f "${CHROMIUM_BIN}" 2>/dev/null || true
  pkill -f "Xvfb" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# --- 1. Virtual framebuffer ---
log "starting Xvfb on ${DISPLAY} at ${WIDTH}x${HEIGHT}"
Xvfb ":${DISPLAY_NUM}" -screen 0 "${WIDTH}x${HEIGHT}x24" -ac -nolisten tcp +extension GLX +render -noreset &
XVFB_PID=$!
sleep 2

# --- 2. Headless Chromium in kiosk mode (WebGL via SwiftShader for the globe) ---
BROWSER_PID=""
launch_browser() {
  log "launching Chromium -> ${DASHBOARD_URL}"
  "${CHROMIUM_BIN}" \
    --no-sandbox \
    --disable-setuid-sandbox \
    --disable-dev-shm-usage \
    --kiosk \
    --start-fullscreen \
    --window-position=0,0 \
    --window-size="${WIDTH},${HEIGHT}" \
    --force-device-scale-factor=1 \
    --hide-scrollbars \
    --disable-infobars \
    --disable-notifications \
    --disable-session-crashed-bubble \
    --noerrdialogs \
    --disable-features=Translate,TranslateUI \
    --use-gl=angle \
    --use-angle=swiftshader \
    --enable-unsafe-swiftshader \
    --disable-gpu-vsync \
    --autoplay-policy=no-user-gesture-required \
    --app="${DASHBOARD_URL}" \
    >/tmp/chromium.log 2>&1 &
  BROWSER_PID=$!
}
launch_browser
log "warming up page for ${PAGE_WARMUP_SECONDS}s..."
sleep "${PAGE_WARMUP_SECONDS}"

# --- 3. Encode + push, restart on failure ---
while true; do
  # Relaunch the browser if it has died.
  if [ -z "${BROWSER_PID}" ] || ! kill -0 "${BROWSER_PID}" 2>/dev/null; then
    log "browser not running, relaunching"
    launch_browser
    sleep "${PAGE_WARMUP_SECONDS}"
  fi

  log "starting ffmpeg -> ${STREAM_URL}/****"
  ffmpeg -hide_banner -loglevel warning \
    -f x11grab -draw_mouse 0 -framerate "${FPS}" -video_size "${WIDTH}x${HEIGHT}" -i ":${DISPLAY_NUM}" \
    -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
    -c:v libx264 -preset veryfast -tune zerolatency -pix_fmt yuv420p \
      -b:v "${VIDEO_BITRATE}" -maxrate "${VIDEO_BITRATE}" -bufsize "${BUFSIZE}" \
      -g "$((FPS * 2))" -r "${FPS}" \
    -c:a aac -b:a 128k -ar 44100 \
    -f flv "${STREAM_URL}/${STREAM_KEY}"

  log "ffmpeg exited (code $?). Restarting in 5s..."
  sleep 5
done
