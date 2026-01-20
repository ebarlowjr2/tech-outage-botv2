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
    
    # Initialize DB 
    db = DBManager()
    
    try:
        while True:
            logging.info("--- Starting Polling Loop ---")
            
            # 1. Check for outages
            try:
                # Assuming check_outages() performs scraping and Upserting to DB
                # Ideally check_outages(db) is better, but following existing pattern:
                updates = check_outages() 
                logging.info(f"Processed feeds. Found {len(updates)} significant updates.")
                
                # Fetch Context
                internet_status = db.get_internet_condition()
                logging.info(f"Context: Internet is {internet_status}")

                # 2. Process Updates
                for update in updates:
                    service = update['service']
                    title = update['title']
                    status = update['status']
                    incident_id = update['incident_id']
                    
                    logging.info(f"Processing Alert: {service} - {title}")
                    
                    # Generate Context-Aware Script
                    alert_text = generate_alert_script(service, title, status, internet_status)
                    logging.info(f"Generated Script: {alert_text}")

                    # Insert Event into DB (Triggers Frontend Animation)
                    db.insert_event(incident_id, alert_text, event_type="alert")
                    
                    # Audio generation removed for V1 (Frontend TTS future)
                    
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
