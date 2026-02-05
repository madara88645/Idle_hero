from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base, User, CharacterStats, UsageLog, BossEnemy, Kingdom, Building
from schemas import (
    UserCreate, SyncResponse, UsageLogCreate, 
    BossStatus, BattleSummary, SyncResponseWithBattle,
    Kingdom as KingdomSchema, BuildRequest, KingdomSyncResult, SyncResponseWithKingdom
)
import schemas
from game_logic import (
    calculate_xp_and_stats, 
    generate_daily_boss, 
    get_todays_boss, 
    calculate_battle_outcome,
    collect_resources,
    calculate_battle_outcome,
    collect_resources,
    construct_building,
    check_quests
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
    """Create a new user and initialize their stats and kingdom."""
    db_user = models.User(username=user.username, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Init stats with combat defaults
    stats = models.CharacterStats(user_id=db_user.id)
    db.add(stats)
    # Init kingdom
    kingdom = models.Kingdom(user_id=db_user.id, name=f"{user.username}'s Kingdom")
    db.add(kingdom)
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
# SYNC ENDPOINT (with Battle + Kingdom)
# =====================

@app.post("/sync/usage/{user_id}", response_model=SyncResponseWithKingdom)
def sync_usage(user_id: str, logs: list[UsageLogCreate], db: Session = Depends(get_db)):
    """
    Sync usage logs and calculate battle outcome + kingdom resources.
    
    This endpoint:
    1. Saves usage logs
    2. Gets or creates today's boss
    3. Calculates battle outcome
    4. Collects kingdom resources
    5. Checks for disasters
    6. Returns battle + kingdom summary
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
    
    # Calculate time metrics
    total_screen_seconds = sum(log.duration_seconds for log in logs)
    total_screen_minutes = total_screen_seconds / 60
    assumed_waking_minutes = 480  # 8 hours
    focus_minutes = max(0, assumed_waking_minutes - total_screen_minutes)
    
    # --- BOSS BATTLE LOGIC ---
    boss = get_todays_boss(db, user_id)
    if not boss:
        boss = generate_daily_boss(db, user)
    
    battle_summary = None
    if not boss.is_defeated:
        battle_result = calculate_battle_outcome(stats, logs, boss, user.rules)
        battle_summary = BattleSummary(**battle_result)
        
        if battle_result["boss_defeated"]:
            insight = f"🎉 Victory! You defeated {boss.name}! +{battle_result['xp_gained']} XP!"
        elif battle_result["player_hp_remaining"] <= 20:
            insight = f"⚠️ Warning! Your hero is getting weak. {boss.name} is winning!"
        else:
            insight = f"⚔️ Battle in progress. {boss.name} HP: {battle_result['boss_hp_remaining']}/{boss.total_hp}"
    else:
        xp, leveled_up, _ = calculate_xp_and_stats(stats, logs, user.rules)
        insight = "✨ Today's boss already defeated! Enjoy your victory."
    
        xp, leveled_up, _ = calculate_xp_and_stats(stats, logs, user.rules)
        insight = "✨ Today's boss already defeated! Enjoy your victory."
    
    # --- QUEST CHECK ---
    if battle_summary:
        # Convert Pydantic model to dict for logic function
        check_quests(user, battle_summary.dict())
    
    # --- KINGDOM RESOURCE COLLECTION ---
    kingdom_result = None
    kingdom = user.kingdom
    if kingdom:
        resource_result = collect_resources(
            focus_minutes=focus_minutes,
            screen_time_minutes=total_screen_minutes,
            kingdom=kingdom,
            buildings=list(kingdom.buildings)
        )
        kingdom_result = KingdomSyncResult(**resource_result)
        
        # Add kingdom info to insight
        if resource_result["disaster_occurred"]:
            insight += f" ⚠️ Disaster! {resource_result['damaged_building']} was damaged!"
        insight += f" 🪵+{resource_result['wood_gained']} 🪨+{resource_result['stone_gained']}"
    
    db.commit()
    
    return {
        "xp_gained": battle_summary.xp_gained if battle_summary else xp,
        "level_up": battle_summary.level_up if battle_summary else leveled_up,
        "new_stats": stats,
        "insight": insight,
        "battle": battle_summary,
        "kingdom": kingdom_result
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


# =====================
# KINGDOM ENDPOINTS
# =====================

@app.get("/kingdom/{user_id}", response_model=KingdomSchema)
def get_kingdom(user_id: str, db: Session = Depends(get_db)):
    """Get the user's kingdom with all buildings."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    kingdom = user.kingdom
    if not kingdom:
        # Auto-create kingdom if missing (for existing users)
        kingdom = models.Kingdom(user_id=user_id, name=f"{user.username}'s Kingdom")
        db.add(kingdom)
        db.commit()
        db.refresh(kingdom)
    
    return kingdom





@app.post("/kingdom/build/{user_id}", response_model=KingdomSchema)
def build_structure(user_id: str, request: BuildRequest, db: Session = Depends(get_db)):
    """Construct a new building in the kingdom."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    kingdom = user.kingdom
    if not kingdom:
        raise HTTPException(status_code=404, detail="Kingdom not found. Call GET /kingdom first.")
    
    # Attempt to construct
    success, message = construct_building(kingdom, request.building_type)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    # Create building record
    new_building = models.Building(
        kingdom_id=kingdom.id,
        type=request.building_type,
        level=1,
        health=100
    )
    db.add(new_building)
    db.commit()
    db.refresh(kingdom)
    
    return kingdom


# =====================
# HERO CLASS ENDPOINTS
# =====================

def seed_classes(db: Session):
    """Seed initial hero classes if they don't exist."""
    existing_classes = db.query(models.HeroClass).count()
    if existing_classes > 0:
        return

    classes = [
        models.HeroClass(
            name="Night Owl",
            bonus_type=models.ClassBonusType.NIGHT_OWL,
            description="Less focus penalty late at night (22:00-04:00)."
        ),
        models.HeroClass(
            name="Morning Star",
            bonus_type=models.ClassBonusType.MORNING_STAR,
            description="Bonus XP for morning focus sessions (06:00-12:00)."
        ),
        models.HeroClass(
            name="Hardcore",
            bonus_type=models.ClassBonusType.HARDCORE,
            description="High Risk/Reward: 2x XP gain, but 3x penalty for distractions."
        ),
        models.HeroClass(
            name="Balanced",
            bonus_type=models.ClassBonusType.BALANCED,
            description="Standard progression with no modifiers."
        )
    ]
    db.add_all(classes)
    db.commit()


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    seed_classes(db)


@app.get("/classes", response_model=list[schemas.HeroClass])
def get_classes(db: Session = Depends(get_db)):
    """Get list of available hero classes."""
    return db.query(models.HeroClass).all()


@app.post("/user/{user_id}/class/{class_id}", response_model=schemas.CharacterStats)
def select_class(user_id: str, class_id: str, db: Session = Depends(get_db)):
    """Assign a hero class to a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    hero_class = db.query(models.HeroClass).filter(models.HeroClass.id == class_id).first()
    if not hero_class:
        raise HTTPException(status_code=404, detail="Hero Class not found")
        
    if not user.stats:
        user.stats = models.CharacterStats(user_id=user.id)
        db.add(user.stats)
    
    # Update class
    user.stats.class_id = class_id
    db.commit()
    db.refresh(user.stats)
    
    return user.stats


# =====================
# QUEST ENDPOINTS
# =====================

def seed_default_quests(db: Session):
    """Ensure default quest definitions exist."""
    defaults = [
        models.QuestDefinition(
            code="DAILY_SYNC",
            title="First Step",
            description="Sync your usage stats for the first time today.",
            quest_type=models.QuestType.DAILY,
            target_progress=1,
            reward_xp=50,
            reward_gold=10
        ),
        models.QuestDefinition(
            code="FOCUS_MASTER",
            title="Focus Master",
            description="Complete a day with 0 damage taken.",
            quest_type=models.QuestType.DAILY,
            target_progress=1,
            reward_xp=150,
            reward_gold=50
        ),
         models.QuestDefinition(
            code="BOSS_SLAYER",
            title="Boss Slayer",
            description="Defeat the daily boss.",
            quest_type=models.QuestType.DAILY,
            target_progress=1,
            reward_xp=200,
            reward_gold=100
        )
    ]
    
    for q in defaults:
        exists = db.query(models.QuestDefinition).filter_by(code=q.code).first()
        if not exists:
            db.add(q)
    db.commit()


@app.get("/quests/{user_id}", response_model=list[schemas.UserQuest])
def get_user_quests(user_id: str, db: Session = Depends(get_db)):
    """Get active quests for user. Seeds defaults if none exist."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Seed definitions if missing
    seed_default_quests(db)

    # Assign quests to user if they don't have them
    definitions = db.query(models.QuestDefinition).all()
    for definition in definitions:
        # Check if user has this quest (active or completed today)
        # For DAILY quests, logic might be more complex (reset daily), 
        # but for MVP we just check if it exists at all.
        exists = db.query(models.UserQuest).filter_by(
            user_id=user_id, 
            quest_def_id=definition.id
        ).first()
        
        if not exists:
            new_quest = models.UserQuest(
                user_id=user_id,
                quest_def_id=definition.id,
                status=models.QuestStatus.IN_PROGRESS,
                current_progress=0
            )
            db.add(new_quest)
    
    db.commit()
    return user.quests


@app.post("/quests/claim/{quest_id}", response_model=schemas.UserQuest)
def claim_quest_reward(quest_id: str, db: Session = Depends(get_db)):
    """Claim reward for a completed quest."""
    quest = db.query(models.UserQuest).filter(models.UserQuest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
        
    if quest.status != models.QuestStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Quest not completed or already claimed")
        
    # Grant rewards
    user = quest.user
    rewards = quest.definition
    
    # XP
    if user.stats:
        user.stats.xp += rewards.reward_xp
        # Simple level up check (could utilize reuse logic but keeping inline script for safety)
        if user.stats.xp >= 100 * user.stats.level:
            user.stats.level += 1
            user.stats.xp -= 100 * (user.stats.level - 1)
            user.stats.health = user.stats.max_health # Heal on level up
            
    # Gold (Kingdom)
    if user.kingdom:
        user.kingdom.gold += rewards.reward_gold
        
    # Update Status
    quest.status = models.QuestStatus.CLAIMED
    db.commit()
    db.refresh(quest)
    
    return quest

