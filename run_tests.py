import time
import json
import os
from supabase import create_client, Client

# Load Config
def load_config():
    with open("config/api_config.json", "r") as f:
        return json.load(f)

config = load_config()
url = config.get("supabase_url")
key = config.get("supabase_key")
supabase: Client = create_client(url, key)

def clear_db():
    print("🧹 Cleaning DB (Resetting to Idle)...")
    supabase.table("incidents").update({"active": False}).neq("active", False).execute()
    supabase.table("internet_conditions").insert({"status": "stable", "description": "Global routing stable"}).execute()
    time.sleep(2)

def test_idle():
    print("\n🧪 TEST 1: IDLE STATE")
    clear_db()
    print("✅ System should be IDLE. Check Dashboard.")

def test_outage_only():
    print("\n🧪 TEST 2: OUTAGE ONLY")
    clear_db()
    time.sleep(2)
    print("Simulating AWS Outage...")
    # Upsert provider first? distinct provider lookup?
    # Simplified: We assume provider 'AWS' exists with id 1, or we query it.
    # For this script we will try to insert a fake one or use existing "Supabase" checks.
    
    # Check for provider
    prov = supabase.table("providers").select("id").eq("name", "Test Provider").execute()
    if not prov.data:
        prov = supabase.table("providers").insert({"name": "Test Provider"}).execute()
    p_id = prov.data[0]['id']

    # Insert Active Outage
    data = {
        "provider_id": p_id,
        "title": "API Latency Spike (TEST)",
        "severity": "major",
        "status": "investigating",
        "active": True,
        "last_update": "now()"
    }
    res = supabase.table("incidents").insert(data).execute()
    inc_id = res.data[0]['id']
    
    # Trigger Event (Bot would do this, but we simulate bot trigger)
    event_text = "Service outage detected for Test Provider. API Latency Spike (TEST). Investigation is ongoing."
    supabase.table("incident_events").insert({"incident_id": inc_id, "description": event_text, "event_type": "alert"}).execute()
    
    print("✅ Outage Injected. Check Dashboard for Red Alert + Speech.")

def test_context_only():
    print("\n🧪 TEST 3: CONTEXT ONLY")
    clear_db()
    time.sleep(2)
    print("Simulating Internet Instability...")
    supabase.table("internet_conditions").insert({"status": "unstable", "description": "Elevated routing instability observed"}).execute()
    print("✅ Context Injected. Check for Amber Vignette (No Outage).")

def test_correlation():
    print("\n🧪 TEST 4: CORRELATION (Outage + Context)")
    # Keep unstable from previous test
    print("Injecting Outage WHILE unstable...")
    
    prov = supabase.table("providers").select("id").eq("name", "Test Provider").execute()
    p_id = prov.data[0]['id']

    data = {
        "provider_id": p_id,
        "title": "Connectivity Loss (TEST)",
        "severity": "major",
        "status": "identified",
        "active": True,
        "last_update": "now()"
    }
    res = supabase.table("incidents").insert(data).execute()
    inc_id = res.data[0]['id']
    
    # Bot Logic simulation
    event_text = "Service outage detected for Test Provider. Connectivity Loss (TEST). Broader internet instability is also being observed. Use caution."
    supabase.table("incident_events").insert({"incident_id": inc_id, "description": event_text, "event_type": "alert"}).execute()
    
    print("✅ Correlated Event Injected. Check Dashboard for Context Message.")

def main():
    print("🚀 Tech Outage Bot Verification Suite")
    print("1. Idle")
    print("2. Outage Only")
    print("3. Context Only")
    print("4. Correlation")
    print("5. Reset All")
    
    choice = input("Select Test Scenario (1-5): ")
    
    if choice == "1": test_idle()
    elif choice == "2": test_outage_only()
    elif choice == "3": test_context_only()
    elif choice == "4": test_correlation()
    elif choice == "5": clear_db()

if __name__ == "__main__":
    main()
