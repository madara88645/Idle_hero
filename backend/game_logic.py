from datetime import datetime
import math

# Experience Curve
BASE_XP = 100
FACTOR = 1.5

def calculate_xp_required(level: int) -> int:
    return int(BASE_XP * (level ** FACTOR))

BUILDING_COSTS = {
    "mine": {"bronze": 500, "gold": 50, "diamond": 0},
    "park": {"bronze": 200, "gold": 100, "diamond": 0},
    "school": {"bronze": 1000, "gold": 200, "diamond": 5},
    "fire_station": {"bronze": 1500, "gold": 300, "diamond": 10},
    "hospital": {"bronze": 2000, "gold": 500, "diamond": 20},
    "town_hall": {"bronze": 5000, "gold": 1000, "diamond": 50},
}

def calculate_xp_and_stats(current_stats, usage_logs, rules):
    total_xp_gained = 0
    message = "Good job!"
    
    # Simple logic
    for log in usage_logs:
        # Check against rules
        rule = next((r for r in rules if r.app_package_name == log.app_package_name), None)
        duration_mins = log.duration_seconds / 60
        
        if rule:
             if duration_mins > rule.daily_limit_minutes:
                 # Penalty
                 total_xp_gained -= 10
                 message = "Limit exceeded! Lost XP."
             else:
                 # Reward
                 total_xp_gained += 20
        else:
             # Default reward for tracking
             total_xp_gained += 5

    # Update Stats
    if current_stats.xp is None: current_stats.xp = 0
    current_stats.xp += total_xp_gained
    
    # Award resources based on XP (Stub logic)
    if total_xp_gained > 0:
        if current_stats.bronze is None: current_stats.bronze = 0
        if current_stats.gold is None: current_stats.gold = 0
        if current_stats.diamond is None: current_stats.diamond = 0
        
        current_stats.bronze += int(total_xp_gained * 2)
        current_stats.gold += int(total_xp_gained * 0.5) + 10000
        # Diamonds are rare, maybe only on level up
    
    # Level Up Check
    if current_stats.level is None: current_stats.level = 1
    xp_req = calculate_xp_required(current_stats.level)
    leveled_up = False
    if current_stats.xp >= xp_req:
        current_stats.level += 1
        current_stats.xp -= xp_req
        leveled_up = True
        message = "LEVEL UP! City expanded."
        # Bonus resources on level up
        current_stats.gold += 100
        current_stats.diamond += 5
        

    return total_xp_gained, leveled_up, current_stats, message

def calculate_upgrade_cost(building_type: str, current_level: int) -> dict:
    base_cost = BUILDING_COSTS.get(building_type)
    if not base_cost:
        return None
    
    multiplier = 1.5 ** current_level
    
    return {
        "bronze": int(base_cost["bronze"] * multiplier),
        "gold": int(base_cost["gold"] * multiplier),
        "diamond": int(base_cost["diamond"] * multiplier)
    }
