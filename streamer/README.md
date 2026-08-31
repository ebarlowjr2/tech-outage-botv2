# Tech Outage Bot — 24/7 Stream Engine

Broadcasts the live dashboard (`https://tech-outage-botv2.vercel.app/`) to YouTube
Live, 24/7, in the Yall-Bot style.

It runs a headless Chromium on a virtual X display (Xvfb), pointed at the dashboard
in kiosk mode, and screen-grabs that display with `ffmpeg`, pushing H.264/AAC over
RTMP to YouTube. The whole thing is one Docker container designed to sit on a cheap
always-on Linux VPS. `ffmpeg` and Chromium auto-restart if they crash.

```
Vercel dashboard ──▶ Chromium (kiosk, Xvfb :99) ──▶ ffmpeg x11grab ──▶ YouTube RTMP
```

The WebGL globe renders via Chromium's SwiftShader (software GL), so **no GPU is
required** — a small CPU-only VPS works.

## What you need

1. A Linux VPS with Docker + Docker Compose (e.g. a $5–10/mo box, 1–2 vCPU / 2 GB RAM).
   1080p30 at 4.5 Mbps encodes fine on 2 shared vCPUs with `veryfast`.
2. A YouTube channel with **live streaming enabled** (enabling it takes ~24h the first time).
3. Your YouTube **stream key**: YouTube Studio → *Go Live* → *Stream* → copy "Stream key".

## Deploy

```bash
# on the VPS, from this streamer/ directory
cp .env.example .env
# edit .env and paste your YOUTUBE_STREAM_KEY
docker compose up -d --build
docker compose logs -f          # watch it come online
```

Then in **YouTube Studio → Go Live**, YouTube will detect the incoming feed and let
you click **Go Live**. After that it stays up until you stop the container.

## Common tweaks

All via `.env` (no rebuild needed — just `docker compose up -d`):

| Variable | Default | Notes |
|---|---|---|
| `YOUTUBE_STREAM_KEY` | — | **required** |
| `DASHBOARD_URL` | Vercel URL | point at a staging build if you like |
| `STREAM_WIDTH` / `STREAM_HEIGHT` | `1920` / `1080` | drop to `1280`/`720` on a tiny VPS |
| `STREAM_FPS` | `30` | `24` or `20` to save CPU |
| `VIDEO_BITRATE` | `4500k` | YouTube 1080p30 recommends 4.5 Mbps |

Lower-spec box preset (720p, gentler on CPU/bandwidth):

```
STREAM_WIDTH=1280
STREAM_HEIGHT=720
STREAM_FPS=24
VIDEO_BITRATE=2500k
VIDEO_BUFSIZE=5000k
```

## Operating

```bash
docker compose logs -f         # live logs (look for "starting ffmpeg")
docker compose restart         # restart the stream
docker compose down            # stop streaming
docker compose exec streamer cat /tmp/chromium.log   # browser-side errors
```

## Audio

The stream currently carries a **silent** audio track (YouTube requires an audio
stream). This is the seam where the TTS presenter / captions plug in later — the
dashboard already reserves a "Presenter Dock" and caption bar for it. When that
exists, replace the `anullsrc` input in `stream.sh` with the live audio source.

## Notes & gotchas

- **First-time YouTube latency:** enabling live streaming on a fresh channel can take
  up to 24 hours before "Go Live" works.
- **Stream key is a secret.** It lives only in `.env` (gitignored here). Anyone with
  it can broadcast to your channel — rotate it in YouTube Studio if it leaks.
- **Frozen clock:** the dashboard's top-bar `LOCAL/UTC` time is currently a hardcoded
  placeholder in `web-dashboard/app/page.tsx`. Worth wiring to a live clock before a
  real 24/7 launch, or viewers will notice a stuck time.
- **Verify the look first:** run `docker compose up` (foreground) and, before going
  live, point a throwaway stream key at it, or lower resolution to test CPU headroom.
