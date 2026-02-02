import requests
import sys
import json

BASE_URL = "http://127.0.0.1:8001"

def test_profile_structure(user_id):
    print(f"Testing /user/profile/{user_id} structure...")
    try:
        res = requests.get(f"{BASE_URL}/user/profile/{user_id}")
        if res.status_code == 200:
            profile = res.json()
            # print(json.dumps(profile, indent=2))
            
            stats = profile.get('stats')
            if not stats:
                print("Error: 'stats' missing in profile.")
                return False
                
            hero_class = stats.get('hero_class')
            if not hero_class:
                print("Error: 'hero_class' missing in stats (Schema update failed?).")
                # print("Stats object:", stats)
                return False
            
            print(f"Success! Stats has hero_class: {hero_class['name']} ({hero_class['bonus_type']})")
            return True
        else:
            print(f"Failed to get profile: {res.status_code} {res.text}")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # 1. Get a user ID from verify_classes output or create new one
    # For now, let's just create a new one to be sure
    try:
        print("Creating temp user...")
        import random
        user_data = {
            "username": f"AvatarTest_{random.randint(1,10000)}", 
            "email": f"avatar_{random.randint(1,10000)}@test.com"
        }
        res = requests.post(f"{BASE_URL}/user/onboard", json=user_data)
        user_id = res.json()['id']
        print(f"Created user: {user_id}")
        
        # 2. Assign class
        classes_res = requests.get(f"{BASE_URL}/classes")
        classes = classes_res.json()
        class_id = classes[0]['id']
        print(f"Assigning class: {classes[0]['name']}")
        requests.post(f"{BASE_URL}/user/{user_id}/class/{class_id}")
        
        # 3. Test Profile
        if test_profile_structure(user_id):
            print("VERIFICATION PASSED: Frontend will receive hero_class data.")
        else:
            print("VERIFICATION FAILED: Stats schema likely not updated.")
            sys.exit(1)
            
    except Exception as e:
        print(f"Setup failed: {e}")
