import time
import json
import os
from monitor import check_outages
from content_generator import generate_alert_script
from db_manager import DBManager
import argparse
import logging

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("bot.log"),
        logging.StreamHandler()
    ]
)

def load_config():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "../config/api_config.json")
    with open(config_path) as f:
        return json.load(f)

def main():
    parser = argparse.ArgumentParser(description="Tech Outage Bot 2.1")
    parser.add_argument("--dry-run", action="store_true", help="Stream to local file dry_run.flv instead of YouTube")
    parser.add_argument("--local-preview", action="store_true", help="Stream to local file preview.flv")
    args = parser.parse_args()

    local_output = None
    if args.dry_run:
        local_output = "dry_run.mp4"
    elif args.local_preview:
        local_output = "preview.flv"

    logging.info("Starting Tech Outage Bot 2.1...")
    config = load_config()
    poll_interval = config.get("poll_interval_seconds", 300)
    
    # Initialize Audio Queue (creates FIFO)
    audio_queue = AudioQueue()
    
    # Initialize DB (Connection happens in DBManager init)
    
    try:
        while True:
            logging.info("--- Starting Polling Loop ---")
            
            # 1. Check for outages (and update DB)
            try:
                updates = check_outages() # Returns list of new/significant updates
                logging.info(f"Processed feeds. Found {len(updates)} significant updates.")
                
                # 2. Process Updates (Generate Alert Content)
                for update in updates:
                    service = update['service']
                    title = update['title']
                    status = update['status']
                    incident_id = update['incident_id']
                    
                    logging.info(f"Processing Alert: {service} - {title}")
                    
                    # Generate AI Script
                    alert_text = generate_alert_script(service, title, status)
                    
                    # Insert Event into DB
                    db = DBManager()
                    db.insert_event(incident_id, alert_text, event_type="alert")
                    
                    # For v1: We rely on Frontend to subscribe to this event and play TTS/Animation.
                    # We do NOT generate local audio anymore.
                    
            except Exception as e:
                logging.error(f"Error in polling loop: {e}")

            # Wait for next poll
            logging.info(f"Sleeping for {poll_interval} seconds...")
            time.sleep(poll_interval)

    except KeyboardInterrupt:
        logging.info("Stopping bot...")
        if stream_process:
            stream_process.terminate()
        logging.info("Goodbye!")

if __name__ == "__main__":
    main()
