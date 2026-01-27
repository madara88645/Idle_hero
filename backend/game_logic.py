from schemas import CharacterStats, UsageLogCreate
from models import CharacterStats as StatsModel

def calculate_xp_and_stats(current_stats: StatsModel, logs: list[UsageLogCreate], rules: list):
    """
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
        current_stats.xp = 0 # Rollover or keep remainder
        return xp_gained, True, current_stats
        
    return xp_gained, False, current_stats
