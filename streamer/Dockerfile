FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Chromium (Debian ships a real .deb, not a snap), ffmpeg, virtual X server,
# and fonts so the dashboard + emoji/CJK render correctly on the stream.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      chromium-sandbox \
      ffmpeg \
      xvfb \
      ca-certificates \
      procps \
      tini \
      fonts-liberation \
      fonts-dejavu-core \
      fonts-noto-core \
      fonts-noto-color-emoji \
      fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

COPY stream.sh /usr/local/bin/stream.sh
RUN chmod +x /usr/local/bin/stream.sh

# tini reaps the Xvfb/Chromium/ffmpeg child processes cleanly.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/usr/local/bin/stream.sh"]
