import openai
import os
import json

# Dynamically determine the path to the configuration file
current_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(current_dir, "../config/api_config.json")

# Check if the configuration file exists
if not os.path.exists(config_path):
    print(f"Configuration file not found at {config_path}. Please ensure the file exists and contains your API key.")
    exit(1)

# Load the API key from the configuration file
try:
    with open(config_path) as config_file:
        config = json.load(config_file)
        openai.api_key = config.get("api_key")
except json.JSONDecodeError:
    print(f"Error: Unable to parse the configuration file at {config_path}. Ensure it's valid JSON.")
    exit(1)

# Check if the API key is provided
if not openai.api_key:
    print("Error: API key is missing in the configuration file.")
    exit(1)

def ask_chatgpt(prompt):
    """
    Send a prompt to ChatGPT and return the response using the latest ChatCompletion API.
    """
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",  # Replace with "gpt-3.5-turbo" if you want to use GPT-3.5
            messages=[
                {"role": "system", "content": "You are a helpful assistant that comments on tech outages."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message["content"].strip()
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    print("Welcome to the Tech Outage Bot!")
    while True:
        try:
            user_prompt = input("\nEnter your prompt (or type 'exit' to quit): ")
            if user_prompt.lower() == "exit":
                print("Goodbye!")
                break
            response = ask_chatgpt(user_prompt)
            print(f"\nChatGPT Response: {response}")
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
