import json
import os

def check_config():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "../config/api_config.json")
    
    print(f"Checking config at: {config_path}")
    
    if not os.path.exists(config_path):
        print("ERROR: Config file does not exist!")
        return

    try:
        with open(config_path) as f:
            config = json.load(f)
            
        print("Config file loaded successfully.")
        
        # Check OpenAI Key
        openai_key = config.get("openai_api_key")
        if not openai_key:
            print("ERROR: 'openai_api_key' is missing or empty.")
        elif openai_key == "YOUR_OPENAI_API_KEY":
            print("ERROR: 'openai_api_key' is still set to the placeholder value.")
        else:
            print(f"SUCCESS: 'openai_api_key' is set (Length: {len(openai_key)}).")

        # Check YouTube Key
        youtube_key = config.get("youtube_stream_key")
        if not youtube_key:
            print("ERROR: 'youtube_stream_key' is missing or empty.")
        elif youtube_key == "YOUR_YOUTUBE_STREAM_KEY":
            print("ERROR: 'youtube_stream_key' is still set to the placeholder value.")
        else:
            print(f"SUCCESS: 'youtube_stream_key' is set (Length: {len(youtube_key)}).")
            
    except json.JSONDecodeError as e:
        print(f"ERROR: Config file is not valid JSON. {e}")
    except Exception as e:
        print(f"ERROR: Unexpected error reading config: {e}")

if __name__ == "__main__":
    check_config()
