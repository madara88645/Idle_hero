import pytest
from datetime import datetime, timedelta

def test_sync_usage_focus(client, test_user):
    """Test syncing usage with 0 distraction."""
    user_id = test_user.id
    
    # 1. Sync
    response = client.post(f"/sync/usage/{user_id}", json=[])
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "xp_gained" in data
    assert "battle" in data
    assert data["battle"]["boss_damage_dealt"] == 0 # Perfect focus
    assert data["battle"]["player_damage_dealt"] > 0

    # 2. Check Profile Updated
    response = client.get(f"/user/profile/{user_id}")
    assert response.status_code == 200
    profile = response.json()
    print(f"DEBUG: XP Gained={data['xp_gained']}, Profile XP={profile['stats']['xp']}, Level={profile['stats']['level']}")
    
    # Calculate total accumulated XP (assuming linear 100 XP per level for simplicity in test)
    # Be careful if your logic changes, but currently it's (level-1)*100 + xp
    level = profile["stats"]["level"]
    current_xp = profile["stats"]["xp"]
    total_xp = (level - 1) * 100 + current_xp
    
    # Allow for some margin if quests auto-claimed or something, but mainly check it matches
    assert total_xp >= data["xp_gained"]

def test_quest_flow(client, test_user):
    """Test Quest listing and claiming."""
    user_id = test_user.id
    
    # 1. Initial Get (Seeds defaults)
    response = client.get(f"/quests/{user_id}")
    assert response.status_code == 200
    quests = response.json()
    assert len(quests) >= 3 # Should seed defaults
    
    # Find DAILY_SYNC quest
    daily_quest = next((q for q in quests if q["definition"]["code"] == "DAILY_SYNC"), None)
    assert daily_quest is not None
    
    # 2. Trigger Sync to complete DAILY_SYNC
    client.post(f"/sync/usage/{user_id}", json=[])
    
    # 3. Check Quest Status
    response = client.get(f"/quests/{user_id}")
    quests = response.json()
    daily_quest = next((q for q in quests if q["definition"]["code"] == "DAILY_SYNC"), None)
    assert daily_quest["status"] == "COMPLETED"
    
    # 4. Claim Reward
    quest_id = daily_quest["id"]
    response = client.post(f"/quests/claim/{quest_id}")
    assert response.status_code == 200
    claim_data = response.json()
    assert claim_data["status"] == "CLAIMED"
    
    # 5. Check Gold/XP Added
    response = client.get(f"/user/profile/{user_id}")
    profile = response.json()
    assert profile["stats"]["gold"] >= 10 # Reward
