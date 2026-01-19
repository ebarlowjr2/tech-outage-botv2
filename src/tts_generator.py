import openai
import os
import json

def load_config():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "../config/api_config.json")
    with open(config_path) as f:
        return json.load(f)

def generate_tts(script_text, output_path="audio/report.pcm"):
    """
    Generates audio from the script text using OpenAI's TTS API.
    """
    config = load_config()
    openai.api_key = config.get("openai_api_key")
    
    if not openai.api_key or openai.api_key == "YOUR_OPENAI_API_KEY":
        print("Error: OpenAI API Key not configured for TTS.")
        return None

    # Load stream config for TTS settings
    stream_config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../config/stream_config.json")
    try:
        with open(stream_config_path) as f:
            stream_config = json.load(f)
    except:
        stream_config = {}

    if not stream_config.get("tts_enabled", True):
        print("TTS is disabled in config.")
        return None

    voice = stream_config.get("tts_voice", "alloy")
    model = stream_config.get("tts_model", "tts-1")

    # Ensure audio directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    print(f"Generating TTS for: {script_text[:50]}... (Voice: {voice}, Model: {model})")
    
    try:
        response = openai.audio.speech.create(
            model=model,
            voice=voice,
            input=script_text,
            response_format="pcm"
        )
        
        response.stream_to_file(output_path)
        print(f"Audio saved to {output_path}")
        return output_path
    except Exception as e:
        print(f"Error generating TTS: {e}")
        return None

if __name__ == "__main__":
    # Test
    generate_tts("This is a test of the Tech Outage Bot audio system. All systems are operational.")
