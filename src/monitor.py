from db_manager import DBManager

# List of RSS feeds to monitor
FEEDS = {
    "AWS": "https://status.aws.amazon.com/rss/all.rss",
    "GitHub": "https://www.githubstatus.com/history.rss",
    "Google Cloud": "https://status.cloud.google.com/feed.atom",
    "PyPI": "https://status.python.org/history.rss"
}

def check_outages():
    """
    Checks RSS feeds and updates the database.
    Returns a list of significant updates (for TTS).
    """
    db = DBManager()
    updates = []
    
    for service, url in FEEDS.items():
        try:
            feed = feedparser.parse(url)
            if feed.entries:
                # Check top 3 entries for active issues
                for entry in feed.entries[:3]:
                    # Simple heuristic: if title implies "resolved" or "normal", maybe skip or mark resolved?
                    # For v1, we ingest everything that looks like an incident.
                    
                    title = entry.title
                    link = entry.link
                    summary = entry.get("summary", "")
                    published = entry.get("published", "")
                    
                    # Basic severity detection
                    severity = "minor"
                    if "degraded" in title.lower(): severity = "major"
                    if "outage" in title.lower(): severity = "critical"
                    
                    status = "Active"
                    if "resolved" in title.lower() or "operational" in title.lower():
                        status = "Resolved"
                    
                    # Filter: Only ingest if it's NOT just "Service is operating normally"
                    if "operating normally" in title.lower():
                        continue

                    # Upsert Incident
                    incident_id = db.upsert_incident(
                        provider_name=service,
                        title=title,
                        status=status,
                        severity=severity,
                        url=link,
                        raw_text=summary
                    )
                    
                    if incident_id:
                        # We should check if we already have this specific event logged?
                        # For now, let's just Log it if it's "New" (heuristic needed)
                        # or just return it to main to decide if we want to announcer it.
                        updates.append({
                            "service": service,
                            "title": title,
                            "status": status,
                            "incident_id": incident_id
                        })
                        
        except Exception as e:
            print(f"Error checking {service}: {e}")
            
    return updates

if __name__ == "__main__":
    # Test
    print("Running monitor...")
    updates = check_outages()
    print(f"Found {len(updates)} relevant updates.")
