import requests
import json

base_url = "http://127.0.0.1:8001"

print("Fetching openapi.json...")
try:
    r = requests.get(f"{base_url}/openapi.json")
    if r.status_code == 200:
        spec = r.json()
        print("Paths found:", list(spec.get("paths", {}).keys()))
    else:
        print(f"Could not get openapi.json: {r.status_code}")
except Exception as e:
    print(f"Exception: {e}")

print("Trying with trailing slash...")
try:
    response = requests.post(
        f"{base_url}/user/onboard/",
        json={"username": "DemoUser", "email": "demo@example.com"}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"USER_ID:{data['id']}")
    else:
        print(f"ERROR: {response.status_code} {response.text}")
except Exception as e:
    print(f"EXCEPTION: {e}")
