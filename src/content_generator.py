import openai
import json
import os

def load_config():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "../config/api_config.json")
    with open(config_path) as f:
        return json.load(f)

def generate_alert_script(service: str, title: str, status: str, internet_status: str = "stable") -> str:
    """
    Generates a single-sentence alert script for TTS using professional NOC persona.
    Includes context if internet is unstable.
    """
    
    # Base Outage Script
    base_script = f"Service outage detected for {service}. {title}."
    
    # Correlation Logic
    if internet_status == "unstable":
        context_script = " Broader internet instability is also being observed. Use caution."
        return base_script + context_script
    
    # Standard Script
    endings = [
        "Investigation is ongoing.",
        "We are monitoring the situation.",
        "Stand by for updates.",
        "Engineering teams are investigating."
    ]
    import random
    return f"{base_script} {random.choice(endings)}"

def generate_script(outage_report):
    # Backward compatibility wrapper or just a general summary
    # For now, we return a generic message as we are moving to event-based
    return "System status monitoring active."

if __name__ == "__main__":
    # Test with dummy data
    dummy_report = {
        "AWS Health": {"title": "EC2 Instance Issues", "summary": "Increased error rates in us-east-1"},
        "GitHub Status": {"status": "No recent updates found."}
    }
    print(generate_script(dummy_report))
