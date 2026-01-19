from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime

def create_dashboard(outage_report, output_path="dashboard.png"):
    """
    Creates a visual dashboard of the outage report.
    """
    # Create a black background
    width, height = 1280, 720
    img = Image.new('RGB', (width, height), color=(10, 10, 10))
    draw = ImageDraw.Draw(img)

    # Load fonts (using default if custom not found)
    try:
        title_font = ImageFont.truetype("Arial.ttf", 60)
        text_font = ImageFont.truetype("Arial.ttf", 30)
        status_font = ImageFont.truetype("Arial.ttf", 25)
    except IOError:
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
        status_font = ImageFont.load_default()

    # Draw Title
    draw.text((50, 50), "LIVE TECH OUTAGE REPORT", font=title_font, fill=(255, 0, 0))
    draw.text((50, 120), f"Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", font=text_font, fill=(200, 200, 200))

    # Draw Services
    y_offset = 200
    for service, data in outage_report.items():
        # Service Name
        draw.text((50, y_offset), service, font=text_font, fill=(255, 255, 255))
        
        # Status
        status_text = data.get("title", data.get("status", "Unknown"))
        if "No recent updates" in status_text:
            color = (0, 255, 0) # Green for good
        else:
            color = (255, 165, 0) # Orange for issues
            
        draw.text((400, y_offset), status_text[:60] + "..." if len(status_text) > 60 else status_text, font=status_font, fill=color)
        
        y_offset += 60

    # Save the image
    img.save(output_path)
    return output_path

if __name__ == "__main__":
    # Test
    dummy_report = {
        "AWS Health": {"title": "EC2 Instance Issues", "summary": "Increased error rates"},
        "GitHub Status": {"status": "No recent updates found."},
        "Google Cloud": {"status": "No recent updates found."}
    }
    create_dashboard(dummy_report)
    print("Dashboard created: dashboard.png")
