import requests
import sys

BASE_URL = "http://127.0.0.1:8001"

def test_classes():
    print("Testing /classes...")
    try:
        res = requests.get(f"{BASE_URL}/classes")
        if res.status_code == 200:
            classes = res.json()
            print(f"Success! Found {len(classes)} classes.")
            for c in classes:
                print(f"- {c['name']} ({c['bonus_type']})")
            return classes
        else:
            print(f"Failed: {res.status_code} {res.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def test_select_class(class_id):
    print("\nTesting /user/onboard and class selection...")
    try:
        # Create user
        user_data = {"username": "TestHero", "email": "testhero@example.com"}
        res = requests.post(f"{BASE_URL}/user/onboard", json=user_data)
        if res.status_code == 200:
            user = res.json()
            user_id = user['id']
            print(f"User created: {user_id}")
        else:
            # Maybe user exists
            print("User creation failed (maybe exists), trying fetch...")
            # Ideally getting a user id from DB or something, but we can't easily.
            # Assuming onboard returns 200 even if exists? No, main.py says 200 OK.
            print(f"Response: {res.status_code} {res.text}")
            # If 500/400, assumes fail.
            # Assuming we can proceed if we have a valid user_id from somewhere?
            # Let's just exit if fail.
            if res.status_code != 200:
                 # Try to search or just fail
                 pass
            
            # If user already exists (unique constraint), we might fail.
            # Randomize username
            import random
            user_data["username"] = f"TestHero_{random.randint(1,10000)}"
            user_data["email"] = f"testhero_{random.randint(1,10000)}@example.com"
            res = requests.post(f"{BASE_URL}/user/onboard", json=user_data)
            user = res.json()
            user_id = user['id']
            print(f"User created (retry): {user_id}")

        # Select class
        print(f"Selecting class {class_id} for user {user_id}...")
        res = requests.post(f"{BASE_URL}/user/{user_id}/class/{class_id}")
        if res.status_code == 200:
            stats = res.json()
            print("Success! Class assigned.")
            print(stats)
            if stats['class_id'] == class_id:
                print("Verification passed!")
            else:
                print("Verification failed: ID mismatch")
        else:
             print(f"Failed to select class: {res.status_code} {res.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    classes = test_classes()
    if classes:
        test_select_class(classes[0]['id'])
