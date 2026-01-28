from schemas import CharacterStats, UsageLogCreate
from models import CharacterStats as StatsModel

def calculate_xp_and_stats(current_stats: StatsModel, logs: list[UsageLogCreate], rules: list):
    """
    Idle Game Logic:
    - XP is gained for time spent AWAY from bad apps (time elapsed since last sync).
    - Usage reported in logs reduces the gained XP.
    """
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    
    # Calculate time elapsed since last sync
    if current_stats.last_sync_time:
        # Ensure last_sync_time is timezone-aware if now is
        last_sync = current_stats.last_sync_time
        if last_sync.tzinfo is None:
            last_sync = last_sync.replace(tzinfo=timezone.utc)
            
        elapsed_seconds = (now - last_sync).total_seconds()
    else:
        elapsed_seconds = 0
        
    elapsed_minutes = elapsed_seconds / 60
    
    # Cooldown Check: 60 Minutes (1 Hour)
    if elapsed_minutes < 60:
        return 0, False, current_stats, "It hasn't been 1 hour since your last activity."
    
    # Base Reward: 1 XP per minute of idle time
    base_xp = int(elapsed_minutes * 1)
    
    # Usage Penalty: 
    total_usage_seconds = sum(log.duration_seconds for log in logs)
    usage_minutes = total_usage_seconds / 60
    
    # Penalty: 2 XP lost per minute of usage
    penalty_xp = int(usage_minutes * 2)
    
    # Net XP
    xp_gained = max(0, base_xp - penalty_xp)
    
    # Update stats
    current_stats.last_sync_time = now
    current_stats.xp += xp_gained
    
    if current_stats.xp >= 100 * current_stats.level:
        current_stats.level += 1
        current_stats.xp = 0 # Rollover or keep remainder
        return xp_gained, True, current_stats, "Great job! Level Up!"
        
    return xp_gained, False, current_stats, "Great job! Your focus is improving."
