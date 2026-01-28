"""
Game Logic for Idle Hero: Digital Detox RPG
Includes Boss Battle mechanics.
"""
import random
from datetime import date, datetime
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from models import CharacterStats as StatsModel, BossEnemy, User
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
    boss: BossEnemy
) -> dict:
    """
    Calculate the battle outcome based on usage logs.
    
    - Focus Time (time NOT using apps) = Damage to Boss
    - Screen Time (time using blocked apps) = Damage to Player (from Boss)
    
    Returns a dict with battle summary.
    """
    # Calculate total screen time from logs
    total_screen_seconds = sum(log.duration_seconds for log in logs)
    total_screen_minutes = total_screen_seconds / 60
    
    # Assume 8 hours of waking time (480 minutes) minus screen time = focus time
    # This is a simplification; real implementation would use actual data
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
