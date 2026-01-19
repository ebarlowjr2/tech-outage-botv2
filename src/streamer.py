import subprocess
import os
import time
import json

def load_config():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "../config/api_config.json")
    with open(config_path) as f:
        return json.load(f)

def start_stream(image_path="dashboard.png", local_output=None):
    """
    Starts streaming. If local_output is set, saves to that file instead of RTMP.
    """
    config = load_config()
    stream_key = config.get("youtube_stream_key")
    stream_url = config.get("youtube_stream_url")
    
    if not stream_key or stream_key == "YOUR_YOUTUBE_STREAM_KEY":
        print("Error: YouTube Stream Key not configured.")
        return

    # Load stream config
    stream_config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../config/stream_config.json")
    try:
        with open(stream_config_path) as f:
            stream_config = json.load(f)
    except:
        stream_config = {
            "video_width": 1280, "video_height": 720,
            "overlay_width": 800, "overlay_height": 220,
            "overlay_x": 240, "overlay_y": 460
        }

    # Assets
    background_video = stream_config.get("background_video_path", "assets/yall_bot_idle.mp4")
    audio_source = "audio/report.wav"
    
    # Check if audio exists, otherwise use silent
    has_audio = os.path.exists(audio_source)
    
    # Construct FFmpeg command
    # Inputs:
    # 0: Background Video (looped)
    # 1: Dashboard Image (looped)
    # 2: Audio (looped if exists)
    
    cmd = [
        "ffmpeg",
        "-stream_loop", "-1", "-re", "-i", background_video,
        "-loop", "1", "-i", image_path
    ]
    
    # Audio Source
    if os.path.exists("audio/live_audio.fifo"):
        # Use FIFO with raw PCM settings (24kHz, 16-bit Mono)
        print("Using Audio FIFO...")
        cmd.extend([
            "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", "audio/live_audio.fifo"
        ])
    elif has_audio:
        # Legacy file mode
        cmd.extend(["-stream_loop", "-1", "-re", "-i", audio_source])
    else:
        # Silent audio fallback
        cmd.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"])

    # Filter Complex
    # Scale bg to 1280x720
    # Scale panel to 800x220
    # Overlay panel on bg
    
    video_w = stream_config.get("video_width", 1280)
    video_h = stream_config.get("video_height", 720)
    overlay_w = stream_config.get("overlay_width", 800)
    overlay_h = stream_config.get("overlay_height", 220)
    overlay_x = stream_config.get("overlay_x", 240)
    overlay_y = stream_config.get("overlay_y", 460)
    
    filter_complex = (
        f"[0:v]scale={video_w}:{video_h}[bg];"
        f"[1:v]scale={overlay_w}:{overlay_h}[panel];"
        f"[bg][panel]overlay=x={overlay_x}:y={overlay_y}[outv]"
    )
    
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-map", "2:a" if has_audio else "2:a", # Map the audio input (index 2 is either file or nullsrc)
        "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-g", "50",
        "-c:a", "aac", "-b:a", "128k",
        "-f", "flv"
    ])
    
    if local_output:
        print(f"Streaming locally to {local_output}...")
        cmd.append(local_output)
    else:
        cmd.append(f"{stream_url}/{stream_key}")

    print("Starting stream with command:", " ".join(cmd))
    try:
        # Run ffmpeg and redirect stderr to a log file
        with open("ffmpeg.log", "w") as log_file:
            process = subprocess.Popen(cmd, stderr=log_file)
        return process
    except FileNotFoundError:
        print("Error: FFmpeg not found. Please install FFmpeg.")
        return None

if __name__ == "__main__":
    # Test (Dry run without actual key might fail or just hang)
    print("Streamer module loaded.")
