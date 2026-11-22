#!/usr/bin/env bash
#
# Tech Outage Bot — 24/7 stream engine
# Captures the live dashboard in a headless Chromium on a virtual X display and
# pushes it to YouTube (or any RTMP target) via ffmpeg, with auto-recovery.
# The dashboard's TTS presenter voice is routed through PulseAudio into the
# stream (AUDIO_MODE=pulse); AUDIO_MODE=silent broadcasts a silent track.
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
AUDIO_MODE="${AUDIO_MODE:-pulse}"   # pulse | silent
export DISPLAY=":${DISPLAY_NUM}"

# PulseAudio (and Chromium) need a writable runtime dir.
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/runtime-$(id -u)}"
mkdir -p "${XDG_RUNTIME_DIR}" && chmod 700 "${XDG_RUNTIME_DIR}"

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
  pulseaudio --kill 2>/dev/null || true
  pkill -f "Xvfb" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# --- 1. Virtual framebuffer ---
log "starting Xvfb on ${DISPLAY} at ${WIDTH}x${HEIGHT}"
Xvfb ":${DISPLAY_NUM}" -screen 0 "${WIDTH}x${HEIGHT}x24" -ac -nolisten tcp +extension GLX +render -noreset &
sleep 2

# --- 2. Audio: PulseAudio null sink whose monitor ffmpeg records ---
AUDIO_INPUT=(-f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100")
if [ "${AUDIO_MODE}" = "pulse" ]; then
  log "starting PulseAudio + virtual sink"
  pulseaudio -D --exit-idle-time=-1 --disallow-exit 2>/dev/null || log "WARN: pulseaudio failed to start, continuing"
  sleep 1
  if pactl info >/dev/null 2>&1; then
    pactl load-module module-null-sink sink_name=vsink sink_properties=device.description=OutageBotSink >/dev/null 2>&1 || true
    pactl set-default-sink vsink 2>/dev/null || true
    AUDIO_INPUT=(-f pulse -thread_queue_size 1024 -i vsink.monitor)
    log "audio: capturing vsink.monitor"
  else
    log "WARN: PulseAudio unavailable, falling back to silent audio"
  fi
fi

# --- 3. Headless Chromium in kiosk mode (WebGL globe via SwiftShader) ---
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
    --user-data-dir="${HOME}/chrome-profile" \
    --app="${DASHBOARD_URL}" \
    >/tmp/chromium.log 2>&1 &
  BROWSER_PID=$!
}
launch_browser
log "warming up page for ${PAGE_WARMUP_SECONDS}s..."
sleep "${PAGE_WARMUP_SECONDS}"

# --- 4. Encode + push, restart on failure ---
while true; do
  # Relaunch the browser if it has died.
  if [ -z "${BROWSER_PID}" ] || ! kill -0 "${BROWSER_PID}" 2>/dev/null; then
    log "browser not running, relaunching"
    launch_browser
    sleep "${PAGE_WARMUP_SECONDS}"
  fi

  log "starting ffmpeg -> ${STREAM_URL}/**** (audio: ${AUDIO_MODE})"
  ffmpeg -hide_banner -loglevel warning \
    -f x11grab -draw_mouse 0 -thread_queue_size 1024 -framerate "${FPS}" -video_size "${WIDTH}x${HEIGHT}" -i ":${DISPLAY_NUM}" \
    "${AUDIO_INPUT[@]}" \
    -c:v libx264 -preset veryfast -tune zerolatency -pix_fmt yuv420p \
      -b:v "${VIDEO_BITRATE}" -maxrate "${VIDEO_BITRATE}" -bufsize "${BUFSIZE}" \
      -g "$((FPS * 2))" -r "${FPS}" \
    -c:a aac -b:a 128k -ar 44100 -ac 2 \
    -f flv "${STREAM_URL}/${STREAM_KEY}"

  log "ffmpeg exited (code $?). Restarting in 5s..."
  sleep 5
done
