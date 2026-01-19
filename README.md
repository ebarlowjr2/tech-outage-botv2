# Tech Outage Bot 2.1

A fully automated bot that monitors tech outages (AWS, GitHub, Google Cloud, PyPI), generates summaries using OpenAI, creates a live dashboard, and streams it to YouTube with a looping video background and TTS audio.

## Features
- **Live Monitoring**: Checks RSS feeds every 5 minutes.
- **AI Summaries**: Uses OpenAI GPT-4 to write breaking news scripts.
- **TTS**: Uses OpenAI TTS to speak the report.
- **Video Overlay**: Overlays the dashboard on a custom background video.
- **Auto-Recovery**: Automatically restarts the stream if it crashes.

## Quick Start

1. **Install Dependencies**:
   ```bash
   brew install ffmpeg
   pip install -r requirements.txt
   ```

2. **Configure Keys**:
   Edit `config/api_config.json`:
   ```json
   {
       "openai_api_key": "sk-...",
       "youtube_stream_key": "abcd-1234-..."
   }
   ```

3. **Run the Bot**:
   ```bash
   python3 src/main.py
   ```

4. **Stop the Bot**:
   Press `Ctrl+C` in the terminal.

## Configuration
Customize the stream in `config/stream_config.json`:
- **background_video_path**: Path to your looping MP4 (e.g., `assets/my_bot.mp4`).
- **tts_enabled**: Set to `false` to disable audio.
- **tts_voice**: OpenAI voice (alloy, echo, fable, onyx, nova, shimmer).
- **overlay_x/y**: Position of the dashboard panel.

## Logs
Check `bot.log` for detailed activity and error reports.
Bot for commenting on major tech outages
