
import random
from typing import Tuple

# ==========================================
# MOCK GAME LOGIC (Copied/Adapted from game_logic.py)
# ==========================================

BASE_XP = 100
FACTOR = 1.5

# "Bronze" seems to be a placeholder for Wood/Stone. Let's assume Wood.
BUILDING_COSTS = {
    "mine": {"wood": 500, "gold": 50, "diamond": 0},
    "town_hall": {"wood": 5000, "gold": 1000, "diamond": 50},
}

class MockStats:
    def __init__(self):
        self.level = 1
        self.xp = 0
        self.gold = 0
        self.diamond = 0
        self.wood = 0
        self.buildings = {"mine": 0} # Level 0
        
def calculate_xp_required(level: int) -> int:
    return int(BASE_XP * (level ** FACTOR))

def simulate_session(stats: MockStats) -> int:
    # Usage XP
    usage_xp = 20 
    stats.xp += usage_xp
    return usage_xp

def collect_resources(stats: MockStats):
    # Base gathering (Forest foraging) = 10 Wood/day (very low) or 5/hour?
    # Let's assume constant trickle: 5 Wood/hr * 4 hrs/session? 
    # Or daily total?
    # Let's assume 1 Day = 24 hours of passive income if "Idle".
    # Base: 5 Wood/hr.
    # Mine Lv 1: +10 Wood/hr.
    
    hourly_rate = 5 + (stats.buildings["mine"] * 10)
    daily_income = hourly_rate * 24
    stats.wood += daily_income
    # print(f"    Collected {daily_income} Wood (Rate: {hourly_rate}/hr)")

def attempt_build(stats: MockStats):
    # Try to build Mine
    if stats.buildings["mine"] == 0:
        cost = BUILDING_COSTS["mine"]
        if stats.wood >= cost["wood"] and stats.gold >= cost["gold"]:
            stats.wood -= cost["wood"]
            stats.gold -= cost["gold"]
            stats.buildings["mine"] = 1
            print(f"    [BUILD] Constructed Mine! (Wood: {stats.wood}, Gold: {stats.gold})")

def simulate_day(day_num, stats: MockStats):
    print(f"--- Day {day_num} Start: Lv {stats.level} ({stats.xp}/{calculate_xp_required(stats.level)} XP) [Wood: {stats.wood}, Gold: {stats.gold}] ---")
    
    # 1. Boss Battle
    boss_hp = int(100 * stats.level * 1.25)
    boss_xp = boss_hp * 2
    stats.xp += boss_xp
    check_level_up(stats)
    
    # 2. Sync Sessions (5 times)
    for i in range(5):
        simulate_session(stats)
        check_level_up(stats)
        
    # 3. Daily Resource Collection (Passive)
    collect_resources(stats)
    
    # 4. Try to Build
    attempt_build(stats)
        
    print(f"  End Day {day_num}: Lv {stats.level} [Wood: {stats.wood}, Gold: {stats.gold}]")

def check_level_up(stats: MockStats):
    req = calculate_xp_required(stats.level)
    while stats.xp >= req:
        stats.xp -= req
        stats.level += 1
        stats.gold += 100
        stats.diamond += 5
        # print(f"    -> LEVEL UP! Now {stats.level}")
        req = calculate_xp_required(stats.level)

# ==========================================
# MAIN SIMULATION
# ==========================================

def run_simulation():
    stats = MockStats()
    print("Starting 7-Day Simulation...")
    print(f"Config: BASE_XP={BASE_XP}, FACTOR={FACTOR}")
    
    for day in range(1, 8):
        simulate_day(day, stats)
        
    print("\n--- Final Report ---")
    print(f"Day 7 Result: Level {stats.level}, Wood: {stats.wood}, Gold: {stats.gold}")
    
    if stats.level > 10:
        print("VERDICT XP: Progression TOO FAST.")
    elif stats.level < 4:
        print("VERDICT XP: Progression TOO SLOW.")
    else:
        print("VERDICT XP: Progression BALANCED.")

    print("\n--- Building Cost Review ---")
    print(f"Town Hall Cost: {BUILDING_COSTS['town_hall']}")
    
    if stats.gold < BUILDING_COSTS['town_hall']['gold']:
        print(f"FAIL: Gold ({stats.gold}) < Required ({BUILDING_COSTS['town_hall']['gold']}).")
        print("  -> Suggestion: Increase Gold per Level Up or reduce Building Gold cost.")
    
    if stats.wood < BUILDING_COSTS['town_hall']['wood']:
        print(f"FAIL: Wood ({stats.wood}) < Required ({BUILDING_COSTS['town_hall']['wood']}).")
        print("  -> Suggestion: Increase Base Wood rate or Mine production.")
    else:
        print("SUCCESS: Enough Wood for Town Hall.")
    
if __name__ == "__main__":
    run_simulation()
