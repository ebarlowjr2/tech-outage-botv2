import openai
import json
import os

def load_config():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "../config/api_config.json")
    with open(config_path) as f:
        return json.load(f)

def generate_alert_script(service, title, status):
    """
    Generates a 1-sentence breaking news alert for a specific incident.
    """
    config = load_config()
    openai.api_key = config.get("openai_api_key")
    
    if not openai.api_key: return f"Update: {service} is reporting {title}."
    
    prompt = f"Write a single, urgent, breaking-news sentence about this tech incident:\nService: {service}\nIssue: {title}\nStatus: {status}\nKeep it under 20 words."
    
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a robotic alert system."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return f"Alert: {service} {title} is now {status}."

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
