from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base, User, CharacterStats, UsageLog, BossEnemy
from schemas import (
    UserCreate, SyncResponse, UsageLogCreate, 
    BossStatus, BattleSummary, SyncResponseWithBattle
)
import schemas
from game_logic import (
    calculate_xp_and_stats, 
    generate_daily_boss, 
    get_todays_boss, 
    calculate_battle_outcome
)
import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Idle Hero API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================
# USER ENDPOINTS
# =====================

@app.post("/user/onboard", response_model=schemas.User)
def onboard(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user and initialize their stats."""
    db_user = models.User(username=user.username, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Init stats with combat defaults
    stats = models.CharacterStats(user_id=db_user.id)
    db.add(stats)
    db.commit()
    return db_user


@app.get("/user/profile/{user_id}", response_model=schemas.UserProfile)
def get_profile(user_id: str, db: Session = Depends(get_db)):
    """Get user profile with stats and rules."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# =====================
# BOSS BATTLE ENDPOINTS
# =====================

@app.get("/game/boss/{user_id}", response_model=BossStatus)
def get_boss(user_id: str, db: Session = Depends(get_db)):
    """
    Get today's boss for the user.
    If no boss exists for today, generate a new one.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Try to get existing boss
    boss = get_todays_boss(db, user_id)
    
    # If no boss, generate new one
    if not boss:
        boss = generate_daily_boss(db, user)
    
    return boss


# =====================
# SYNC ENDPOINT (with Battle)
# =====================

@app.post("/sync/usage/{user_id}", response_model=SyncResponseWithBattle)
def sync_usage(user_id: str, logs: list[UsageLogCreate], db: Session = Depends(get_db)):
    """
    Sync usage logs and calculate battle outcome.
    
    This endpoint:
    1. Saves usage logs
    2. Gets or creates today's boss
    3. Calculates battle outcome
    4. Updates stats
    5. Returns battle summary
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get or create stats
    stats = user.stats
    if not stats:
        stats = models.CharacterStats(user_id=user.id)
        db.add(stats)
    
    # Save logs
    for log in logs:
        db_log = models.UsageLog(
            user_id=user_id,
            app_package_name=log.app_package_name,
            start_time=log.start_time,
            end_time=log.end_time,
            duration_seconds=log.duration_seconds
        )
        db.add(db_log)
    
    # --- BOSS BATTLE LOGIC ---
    # Get or generate today's boss
    boss = get_todays_boss(db, user_id)
    if not boss:
        boss = generate_daily_boss(db, user)
    
    battle_summary = None
    if not boss.is_defeated:
        # Calculate battle outcome
        battle_result = calculate_battle_outcome(stats, logs, boss)
        battle_summary = BattleSummary(**battle_result)
        
        # Generate insight based on battle
        if battle_result["boss_defeated"]:
            insight = f"🎉 Victory! You defeated {boss.name}! +{battle_result['xp_gained']} XP!"
        elif battle_result["player_hp_remaining"] <= 20:
            insight = f"⚠️ Warning! Your hero is getting weak. {boss.name} is winning!"
        else:
            insight = f"⚔️ Battle in progress. {boss.name} HP: {battle_result['boss_hp_remaining']}/{boss.total_hp}"
    else:
        # Boss already defeated, just calculate normal XP
        xp, leveled_up, _ = calculate_xp_and_stats(stats, logs, user.rules)
        insight = "✨ Today's boss already defeated! Enjoy your victory."
    
    db.commit()
    
    return {
        "xp_gained": battle_summary.xp_gained if battle_summary else xp,
        "level_up": battle_summary.level_up if battle_summary else leveled_up,
        "new_stats": stats,
        "insight": insight,
        "battle": battle_summary
    }


# =====================
# RULES ENDPOINTS
# =====================

@app.get("/rules/{user_id}", response_model=list[schemas.DetoxRule])
def get_rules(user_id: str, db: Session = Depends(get_db)):
    """Get all detox rules for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.rules


@app.post("/rules/{user_id}", response_model=schemas.DetoxRule)
def create_rule(user_id: str, rule: schemas.DetoxRuleCreate, db: Session = Depends(get_db)):
    """Create a new detox rule for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_rule = models.DetoxRule(
        user_id=user_id,
        app_package_name=rule.app_package_name,
        daily_limit_minutes=rule.daily_limit_minutes,
        is_blocked=rule.is_blocked,
        active_days=rule.active_days
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule
