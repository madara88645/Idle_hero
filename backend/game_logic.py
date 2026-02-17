"""
Game Logic for Idle Hero: Digital Detox RPG
Includes Boss Battle mechanics AND City Builder logic.
"""
import random
from datetime import date, datetime, timedelta
from typing import Optional, Tuple
import math

from sqlalchemy.orm import Session

# Import ALL necessary models
from models import CharacterStats as StatsModel, BossEnemy, User, UnlockedSkill, UserQuest, QuestDefinition, QuestStatus
from schemas import UsageLogCreate

# ==========================================
# CONSTANTS & CONFIG
# ==========================================

# Boss name pool
BOSS_NAMES = [
    "Doom Scroller", "Procrastination Demon", "Infinite Feed Phantom",
    "Notification Wraith", "Algorithm Beast", "Clickbait Goblin",
    "FOMO Specter", "Blue Light Vampire", "Distraction Drake", "Meme Lord of Chaos"
]

# Experience Curve (Friend's Logic)
BASE_XP = 100
FACTOR = 1.5

def calculate_xp_required(level: int) -> int:
    return int(BASE_XP * (level ** FACTOR))

# Building Costs (Friend's Logic)
BUILDING_COSTS = {
    "mine": {"bronze": 500, "gold": 50, "diamond": 0},
    "park": {"bronze": 200, "gold": 100, "diamond": 0},
    "school": {"bronze": 1000, "gold": 200, "diamond": 5},
    "fire_station": {"bronze": 1500, "gold": 300, "diamond": 10},
    "hospital": {"bronze": 2000, "gold": 500, "diamond": 20},
    "town_hall": {"bronze": 5000, "gold": 1000, "diamond": 50},
}

# ==========================================
# BOSS BATTLE LOGIC (My Logic)
# ==========================================

def generate_daily_boss(db: Session, user: User) -> BossEnemy:
    """Generate a new daily boss scaling with player level."""
    level = user.stats.level if user.stats else 1
    base_hp = 100
    total_hp = int(base_hp * level * random.uniform(1.0, 1.5))
    
    boss = BossEnemy(
        user_id=user.id,
        name=random.choice(BOSS_NAMES),
        total_hp=total_hp,
        current_hp=total_hp,
        damage_dealt_to_user=0,
        is_defeated=False
    )
    db.add(boss)
    db.commit()
    db.refresh(boss)
    return boss

def get_todays_boss(db: Session, user_id: str) -> Optional[BossEnemy]:
    """Get the boss for today."""
    today_start = datetime.combine(date.today(), datetime.min.time())
    return db.query(BossEnemy).filter(
        BossEnemy.user_id == user_id,
        BossEnemy.date >= today_start,
        BossEnemy.is_defeated == False
    ).first()

def calculate_battle_outcome(stats: StatsModel, logs: list[UsageLogCreate], boss: BossEnemy, rules: list) -> dict:
    """
    Calculate battle outcome.
    Returns damage dealt, taken, and XP reward (BUT DOES NOT APPLY XP directly to avoid double counting).
    """
    # 1. Identify Blocked Packages
    blocked_packages = {r.app_package_name for r in rules if r.is_blocked}
    
    # 2. Filter logs
    screen_time_seconds = sum(log.duration_seconds for log in logs if log.app_package_name in blocked_packages)
    total_screen_minutes = screen_time_seconds / 60
    
    # Assume 8 hours waking time
    assumed_waking_minutes = 480
    focus_minutes = max(0, assumed_waking_minutes - total_screen_minutes)
    
    # Player Attacks Boss
    player_damage = int(focus_minutes * stats.attack_power)
    boss.current_hp = max(0, boss.current_hp - player_damage)
    
    # Boss Attacks Player
    boss_damage_per_minute = 1
    raw_boss_damage = int(total_screen_minutes * boss_damage_per_minute)
    actual_boss_damage = max(0, raw_boss_damage - stats.defense)
    
    stats.health = max(0, stats.health - actual_boss_damage)
    boss.damage_dealt_to_user += actual_boss_damage
    
    # Check Defeat
    boss_defeated = boss.current_hp <= 0
    xp_reward = 0
    if boss_defeated:
        boss.is_defeated = True
        xp_reward = boss.total_hp * 2
        # Bonus rewards handled in main logic
    
    return {
        "player_damage_dealt": player_damage,
        "boss_damage_dealt": actual_boss_damage,
        "boss_hp_remaining": boss.current_hp,
        "player_hp_remaining": stats.health,
        "boss_defeated": boss_defeated,
        "xp_reward": xp_reward,
        "boss_name": boss.name
    }

# ==========================================
# QUEST LOGIC (My Logic)
# ==========================================

def check_quests(user: User, battle_summary: dict):
    """Evaluates active quests and updates progress."""
    for uq in user.quests:
        if uq.status != QuestStatus.IN_PROGRESS:
            continue
            
        code = uq.definition.code
        
        if code == "DAILY_SYNC":
            uq.current_progress = 1
        elif code == "FOCUS_MASTER":
            if battle_summary["boss_damage_dealt"] == 0:
                uq.current_progress += 1
        elif code == "BOSS_SLAYER":
             if battle_summary["boss_defeated"]:
                 uq.current_progress += 1

        if uq.current_progress >= uq.definition.target_progress:
            uq.status = QuestStatus.COMPLETED
            uq.completed_at = datetime.utcnow()

# ==========================================
# HYBRID REWARD LOGIC (Combined)
# ==========================================

def calculate_hybrid_rewards(stats: StatsModel, logs: list[UsageLogCreate], rules: list) -> Tuple[int, str]:
    """
    Calculates XP/Resource checks based on Rules (Friend's Logic).
    Returns (xp_gained, message).
    """
    total_xp_gained = 0
    message = "Good job!"

    for log in logs:
        rule = next((r for r in rules if r.app_package_name == log.app_package_name), None)
        duration_mins = log.duration_seconds / 60
        
        if rule:
             if duration_mins > rule.daily_limit_minutes:
                 total_xp_gained -= 10 # Penalty
                 message = "Limit exceeded! Lost XP."
             else:
                 total_xp_gained += 20 # Reward
        else:
             total_xp_gained += 5 # Default

    # Ensure non-negative per tick? Or allow regression? Use max(0) generally.
    return total_xp_gained, message

def apply_level_up(stats: StatsModel) -> Tuple[bool, str]:
    """
    Checks if player levels up based on current XP and Curve.
    Updates Level, resets XP, restores Health.
    Returns (leveled_up, message).
    """
    if stats.level is None: stats.level = 1
    xp_req = calculate_xp_required(stats.level)
    
    if stats.xp >= xp_req:
        stats.level += 1
        stats.xp -= xp_req
        
        # Stat Improvements
        stats.health = stats.max_health # Heal
        stats.max_health += 10
        stats.attack_power += 1
        
        # Resource Bonus (Friend's Logic)
        if stats.gold is None: stats.gold = 0
        if stats.diamond is None: stats.diamond = 0
        stats.gold += 100
        stats.diamond += 5
        
        return True, "LEVEL UP! City expanded."
    
    return False, ""

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
