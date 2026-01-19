import os
import json
import logging
from supabase import create_client, Client

class DBManager:
    def __init__(self):
        self.config = self._load_config()
        self.url = self.config.get("supabase_url")
        self.key = self.config.get("supabase_key")
        self.client: Client = None
        
        if self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
                logging.info("Connected to Supabase.")
            except Exception as e:
                logging.error(f"Failed to connect to Supabase: {e}")
        else:
            logging.warning("Supabase URL/Key not found in config.")

    def _load_config(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(current_dir, "../config/api_config.json")
        try:
            with open(config_path) as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Error loading config: {e}")
            return {}

    def get_provider_id(self, provider_name):
        if not self.client: return None
        try:
            response = self.client.table("providers").select("id").eq("name", provider_name).execute()
            if response.data:
                return response.data[0]['id']
            else:
                logging.warning(f"Provider {provider_name} not found in DB.")
                return None
        except Exception as e:
            logging.error(f"Error fetching provider ID: {e}")
            return None

    def upsert_incident(self, provider_name, title, status, severity="minor", url=None, raw_text=None, start_time=None):
        """
        Upserts an incident based on (provider_id, title) or similar logic.
        Since we don't have a unique constraint on title per provider in schema (yet), 
        we might look it up first or just insert new ones if they are truly new.
        For simplicity in v1: We check if an active incident exists with same title.
        """
        if not self.client: return None
        
        provider_id = self.get_provider_id(provider_name)
        if not provider_id: return None

        try:
            # Check for existing active incident with same title
            existing = self.client.table("incidents").select("id").eq("provider_id", provider_id).eq("title", title).eq("active", True).execute()
            
            data = {
                "provider_id": provider_id,
                "title": title,
                "status": status,
                "severity": severity,
                "url": url,
                "raw_text": raw_text,
                "last_update": "now()"
            }
            if start_time:
                data["start_time"] = start_time

            if existing.data:
                # Update
                incident_id = existing.data[0]['id']
                self.client.table("incidents").update(data).eq("id", incident_id).execute()
                return incident_id
            else:
                # Insert
                if not start_time:
                    data["start_time"] = "now()"
                response = self.client.table("incidents").insert(data).execute()
                if response.data:
                    return response.data[0]['id']
                return None
        except Exception as e:
            logging.error(f"Error upserting incident: {e}")
            return None

    def insert_event(self, incident_id, description, event_type="update"):
        if not self.client or not incident_id: return
        try:
            data = {
                "incident_id": incident_id,
                "description": description,
                "event_type": event_type
            }
            self.client.table("incident_events").insert(data).execute()
            logging.info(f"Logged event for incident {incident_id}: {event_type}")
        except Exception as e:
            logging.error(f"Error inserting event: {e}")
