from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base, User, CharacterStats, UsageLog
from schemas import UserCreate, SyncResponse, UsageLogCreate
from game_logic import calculate_xp_and_stats
import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Idle Hero API")

@app.post("/user/onboard", response_model=UserCreate)
def onboard(user: UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(username=user.username, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Init stats
    stats = models.CharacterStats(user_id=db_user.id)
    db.add(stats)
    db.commit()
    return user

@app.post("/sync/usage/{user_id}", response_model=SyncResponse)
def sync_usage(user_id: str, logs: list[UsageLogCreate], db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get current stats
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
    
    # Calculate rewards
    xp, leveled_up, new_stats = calculate_xp_and_stats(stats, logs, user.rules)
    db.commit()
    
    return {
        "xp_gained": xp,
        "level_up": leveled_up,
        "new_stats": new_stats,
        "insight": "Great job! Your focus is improving." # Stub AI
    }

@app.get("/user/profile/{user_id}", response_model=schemas.UserProfile)
def get_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/rules/{user_id}", response_model=list[schemas.DetoxRule])
def get_rules(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.rules

@app.post("/rules/{user_id}", response_model=schemas.DetoxRule)
def create_rule(user_id: str, rule: schemas.DetoxRuleCreate, db: Session = Depends(get_db)):
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
