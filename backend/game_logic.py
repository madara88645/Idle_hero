"""
Game Logic for Idle Hero: Digital Detox RPG
Includes Boss Battle mechanics.
"""
import random
from datetime import date, datetime, timedelta
from typing import Optional, Tuple
import math

from sqlalchemy.orm import Session

from models import CharacterStats as StatsModel, BossEnemy, User, UnlockedSkill, UserQuest, QuestDefinition, QuestStatus
from schemas import UsageLogCreate

# Boss name pool for random generation
BOSS_NAMES = [
    "Doom Scroller",
    "Procrastination Demon",
    "Infinite Feed Phantom",
    "Notification Wraith",
    "Algorithm Beast",
    "Clickbait Goblin",
    "FOMO Specter",
    "Blue Light Vampire",
    "Distraction Drake",
    "Meme Lord of Chaos",
]


def generate_daily_boss(db: Session, user: User) -> BossEnemy:
    """
    Generate a new daily boss for the user.
    Called on first API interaction of the day.
    
    Boss HP scales with player level.
    """
    level = user.stats.level if user.stats else 1
    base_hp = 100
    
    # HP = BaseHP * Level * Random Multiplier (1.0 - 1.5)
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
    """
    Get the boss for today. Returns None if no boss exists yet.
    """
    today_start = datetime.combine(date.today(), datetime.min.time())
    
    boss = db.query(BossEnemy).filter(
        BossEnemy.user_id == user_id,
        BossEnemy.date >= today_start,
        BossEnemy.is_defeated == False
    ).first()
    
    return boss


def calculate_battle_outcome(
    stats: StatsModel, 
    logs: list[UsageLogCreate], 
    boss: BossEnemy,
    rules: list
) -> dict:
    """
    Calculate the battle outcome based on usage logs.
    
    - Focus Time (time NOT using BLOCKED apps) = Damage to Boss
    - Screen Time (time using BLOCKED apps) = Damage to Player (from Boss)
    
    Returns a dict with battle summary.
    """
    # 1. Identify Blocked Packages
    blocked_packages = {r.app_package_name for r in rules if r.is_blocked}
    
    # 2. Filter logs: Only count blocked apps as "Screen Time" (Damage)
    # Neutral apps (not in list or not blocked) do not count as screen time.
    screen_time_seconds = sum(
        log.duration_seconds for log in logs 
        if log.app_package_name in blocked_packages
    )
    total_screen_minutes = screen_time_seconds / 60
    
    # Assume 8 hours of waking time (480 minutes)
    # Focus Time = Waking Time - Blocked Screen Time
    assumed_waking_minutes = 480
    focus_minutes = max(0, assumed_waking_minutes - total_screen_minutes)
    
    # --- Player attacks Boss ---
    player_damage = int(focus_minutes * stats.attack_power)
    boss.current_hp = max(0, boss.current_hp - player_damage)
    
    # --- Boss attacks Player ---
    boss_damage_per_minute = 1  # Base boss attack
    raw_boss_damage = int(total_screen_minutes * boss_damage_per_minute)
    actual_boss_damage = max(0, raw_boss_damage - stats.defense)
    
    stats.health = max(0, stats.health - actual_boss_damage)
    boss.damage_dealt_to_user += actual_boss_damage
    
    # --- Check if Boss is defeated ---
    boss_defeated = boss.current_hp <= 0
    if boss_defeated:
        boss.is_defeated = True
        # Victory rewards
        xp_reward = boss.total_hp * 2
        stats.xp += xp_reward
        stats.skill_points += 1
    else:
        xp_reward = 0
    
    # --- XP and Level Up from normal calculation ---
    base_xp = max(0, int(100 - (total_screen_minutes / 5)))
    stats.xp += base_xp
    
    leveled_up = False
    if stats.xp >= 100 * stats.level:
        stats.level += 1
        stats.xp = stats.xp - (100 * (stats.level - 1))  # Carry over
        leveled_up = True
        # Restore health on level up
        stats.health = stats.max_health
    
    print(f"DEBUG: logs={len(logs)}, screen_min={total_screen_minutes}, boss_dmg={actual_boss_damage}, hp={stats.health}, leveled={leveled_up}")
    return {
        "player_damage_dealt": player_damage,
        "boss_damage_dealt": actual_boss_damage,
        "boss_hp_remaining": boss.current_hp,
        "player_hp_remaining": stats.health,
        "boss_defeated": boss_defeated,
        "xp_gained": base_xp + xp_reward,
        "level_up": leveled_up,
        "boss_name": boss.name
    }


def check_quests(user: User, battle_summary: dict):
    """
    Evaluates active quests and updates progress.
    Call this AFTER battle calculation.
    """
    
    for uq in user.quests:
        if uq.status != QuestStatus.IN_PROGRESS:
            continue
            
        code = uq.definition.code
        
        # --- Logic Mapping ---
        
        # 1. DAILY_SYNC: Just syncing counts as 1
        if code == "DAILY_SYNC":
            uq.current_progress = 1
            
        # 2. FOCUS_MASTER: If player took 0 damage (perfect focus)
        elif code == "FOCUS_MASTER":
            if battle_summary["boss_damage_dealt"] == 0:
                uq.current_progress += 1
                
        # 3. BOSS_SLAYER: Defeat the boss
        elif code == "BOSS_SLAYER":
             if battle_summary["boss_defeated"]:
                 uq.current_progress += 1

        # --- Completion Check ---
        if uq.current_progress >= uq.definition.target_progress:
            uq.status = QuestStatus.COMPLETED
            uq.completed_at = datetime.utcnow()



def calculate_xp_and_stats(current_stats: StatsModel, logs: list[UsageLogCreate], rules: list):
    """
    Legacy function for backwards compatibility.
    Simple Game Logic:
    - XP = Base daily amount - (Penalty * usage)
    - Discipline = +1 if usage < limit, -1 if usage > limit
    """
    total_usage_seconds = sum(log.duration_seconds for log in logs)
    total_minutes = total_usage_seconds / 60
    
    # Simple logic for MVP
    xp_gained = max(0, int(100 - (total_minutes / 5)))
    
    # Update stats
    current_stats.xp += xp_gained
    if current_stats.xp >= 100 * current_stats.level:
        current_stats.level += 1
        current_stats.xp = 0  # Rollover or keep remainder
        return xp_gained, True, current_stats
        
    return xp_gained, False, current_stats


# =====================================================================
# KINGDOM RESOURCE MANAGEMENT
# =====================================================================

# Building costs: (wood, stone)
BUILDING_COSTS = {
    "Library": (50, 30),
    "Barracks": (80, 50),
    "Mine": (100, 80),
}


def collect_resources(
    focus_minutes: float,
    screen_time_minutes: float,
    kingdom,
    buildings: list
) -> dict:
    """
    Convert focus time into resources and check for disasters.
    
    Args:
        focus_minutes: Minutes NOT spent on tracked apps
        screen_time_minutes: Minutes spent on tracked apps
        kingdom: Kingdom model instance
        buildings: List of Building model instances
    
    Returns:
        dict with wood_gained, stone_gained, disaster_occurred, damaged_building
    """
    # Resource calculation
    wood_gained = int(focus_minutes * 1)
    stone_gained = int(focus_minutes * 0.5)
    
    # Update kingdom resources
    kingdom.wood += wood_gained
    kingdom.stone += stone_gained
    
    # Disaster check
    disaster_occurred = False
    damaged_building = None
    
    if buildings:
        disaster_chance = screen_time_minutes / 100.0
        if random.random() < disaster_chance:
            disaster_occurred = True
            # Pick a random building to damage
            target_building = random.choice(buildings)
            target_building.health = max(0, target_building.health - 20)
            damaged_building = target_building.type
    
    return {
        "wood_gained": wood_gained,
        "stone_gained": stone_gained,
        "disaster_occurred": disaster_occurred,
        "damaged_building": damaged_building
    }


def construct_building(kingdom, building_type: str) -> Tuple[bool, str]:
    """
    Attempt to construct a building in the kingdom.
    
    Args:
        kingdom: Kingdom model instance
        building_type: Type of building to construct
    
    Returns:
        Tuple of (success: bool, message: str)
    """
    if building_type not in BUILDING_COSTS:
        return False, f"Unknown building type: {building_type}"
    
    wood_cost, stone_cost = BUILDING_COSTS[building_type]
    
    if kingdom.wood < wood_cost:
        return False, f"Not enough wood. Need {wood_cost}, have {kingdom.wood}"
    
    if kingdom.stone < stone_cost:
        return False, f"Not enough stone. Need {stone_cost}, have {kingdom.stone}"
    
    # Deduct resources
    kingdom.wood -= wood_cost
    kingdom.stone -= stone_cost
    
    return True, f"Successfully constructed {building_type}"

