from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base, User, CharacterStats, UsageLog, BossEnemy, Kingdom, Building
import schemas
from schemas import (
    UserCreate, SyncResponse, UsageLogCreate, 
    BossStatus, BattleSummary
)
from game_logic import (
    generate_daily_boss, 
    get_todays_boss, 
    calculate_battle_outcome,
    calculate_hybrid_rewards,
    apply_level_up,
    check_quests,
    BUILDING_COSTS
)
import models

from routers import admin

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Idle Hero API",
    description="Backend for the Digital Detox RPG (Hybrid: City + Bosses)",
    version="1.1.0"
)

app.include_router(admin.router)
from routers import debug
app.include_router(debug.router)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Idle Hero Backend is running"}

# =====================
# USER ENDPOINTS
# =====================

@app.post("/user/onboard", response_model=schemas.User)
def onboard(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user and initialize their stats, city, and daily boss."""
    db_user = models.User(username=user.username, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Init stats
    stats = models.CharacterStats(user_id=db_user.id)
    db.add(stats)
    
    # Init city (Friend's logic)
    city = models.CityState(user_id=db_user.id)
    db.add(city)
    
    # Init Legacy Kingdom (just in case)
    kingdom = models.Kingdom(user_id=db_user.id, name=f"{user.username}'s Kingdom")
    db.add(kingdom)
    
    db.commit()
    
    # Generate first boss
    generate_daily_boss(db, db_user)
    
    return db_user


@app.get("/user/profile/{user_id}", response_model=schemas.UserProfile)
def get_profile(user_id: str, db: Session = Depends(get_db)):
    """Get user profile with stats, city, rules, quests."""
    user = db.query(User).filter(User.id == user_id).first()
    
    # Auto-create test user for dev environment if missing
    if not user and user_id == 'test-user-id':
        user = models.User(id=user_id, username="Test Hero", email="test@hero.com")
        db.add(user)
        db.commit()
        db.refresh(user)
        # Continue to ensure stats/city...
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure dependencies exist
    if not user.stats:
        user.stats = models.CharacterStats(user_id=user.id)
        db.add(user.stats)
    
    if not user.city_state:
        city = models.CityState(user_id=user.id)
        db.add(city)
        
    db.commit()
    db.refresh(user)

    # Debug Boost (Friend's Logic - kept for now)
    if user.stats.bronze < 1000:
         user.stats.bronze = 1000
         user.stats.gold += 1000  
         db.commit()

    return user

# =====================
# SYNC & GAME LOOP
# =====================

@app.post("/sync/usage/{user_id}", response_model=schemas.SyncResponse)
def sync_usage(user_id: str, logs: list[UsageLogCreate], db: Session = Depends(get_db)):
    """
    Core Game Loop:
    1. Save Logs
    2. Boss Battle (Damage Calc)
    3. Rule Checks (XP/Resource Rewards)
    4. Level Up Check
    5. Quest Update
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Ensure stats/city
    if not user.stats:
        user.stats = models.CharacterStats(user_id=user.id)
        db.add(user.stats)
    if not user.city_state:
        user.city_state = models.CityState(user_id=user.id)
        db.add(user.city_state)

    # 1. Save logs (Deduplication logic needed ideally, but naive for now)
    for log in logs:
        db_log = models.UsageLog(
            user_id=user_id,
            app_package_name=log.app_package_name,
            start_time=log.start_time,
            end_time=log.end_time,
            duration_seconds=log.duration_seconds
        )
        db.add(db_log)

    # 2. Boss Battle
    boss = get_todays_boss(db, user_id)
    if not boss:
        boss = generate_daily_boss(db, user)
    
    battle_summary = None
    if not boss.is_defeated:
        battle_result = calculate_battle_outcome(user.stats, logs, boss, user.rules)
        battle_summary = BattleSummary(**battle_result)
        
        # Determine insight message from battle
        if battle_result["boss_defeated"]:
             insight_msg = f"Victory! {boss.name} defeated!"
        else:
             insight_msg = f"Battle: {boss.name} HP {boss.current_hp}/{boss.total_hp}"
    else:
        insight_msg = "Boss already defeated today."

    # 3. Hybrid Rewards (XP, Resources based on Rules)
    resource_xp, resource_msg = calculate_hybrid_rewards(user.stats, logs, user.rules)
    
    # If boss was defeated in THIS tick, add boss reward to stats
    if battle_summary and battle_summary.boss_defeated and battle_summary.xp_reward > 0:
        # Check if we already awarded this (e.g. if logs sent multiple times)? 
        # For naive impl, we assume client sends fresh logs.
        user.stats.xp += battle_summary.xp_reward
        insight_msg += f" +{battle_summary.xp_reward} XP!"

    # 4. Level Up
    leveled_up, level_msg = apply_level_up(user.stats)
    if leveled_up:
        insight_msg = level_msg
        # City Expansion effect
        if user.city_state:
            user.city_state.level += 1
            if user.city_state.level % 5 == 0:
                user.city_state.unlocked_rings += 1

    # 5. Quests
    if battle_summary:
        check_quests(user, battle_summary.dict())

    db.commit()

    return {
        "xp_gained": resource_xp + (battle_summary.xp_reward if battle_summary else 0),
        "level_up": leveled_up,
        "new_stats": user.stats,
        "insight": f"{insight_msg} | {resource_msg}",
        "battle": battle_summary
    }


# =====================
# BOSS ENDPOINTS
# =====================

@app.get("/game/boss/{user_id}", response_model=schemas.BossStatus)
def get_boss(user_id: str, db: Session = Depends(get_db)):
    """Get today's boss status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    boss = get_todays_boss(db, user_id)
    if not boss:
        boss = generate_daily_boss(db, user)
    return boss

# =====================
# CITY ENDPOINTS (Friend's Logic)
# =====================

@app.post("/city/buy/{user_id}/{building_type}")
def buy_building(user_id: str, building_type: str, db: Session = Depends(get_db)):
    if building_type not in BUILDING_COSTS:
        raise HTTPException(status_code=400, detail="Invalid building type")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cost = BUILDING_COSTS[building_type]
    stats = user.stats
    
    # Check resources
    if stats.bronze < cost["bronze"] or stats.gold < cost["gold"] or stats.diamond < cost["diamond"]:
        raise HTTPException(status_code=400, detail="Not enough resources")
        
    # Deduct resources
    stats.bronze -= cost["bronze"]
    stats.gold -= cost["gold"]
    stats.diamond -= cost["diamond"]
    
    # Add building
    building = models.UserBuilding(user_id=user_id, building_type=building_type)
    db.add(building)
    
    # Add population based on building
    if user.city_state:
        user.city_state.population += 100
        # Unlock logic simplified for now
        
    db.commit()
    return {"message": f"Purchased {building_type}", "success": True, "new_stats": stats, "unlocked_rings": user.city_state.unlocked_rings}

@app.get("/city/buildings/{user_id}", response_model=list[schemas.UserBuilding])
def get_user_buildings(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.buildings

@app.post("/city/upgrade/{user_id}/{building_id}")
def upgrade_building(user_id: str, building_id: int, db: Session = Depends(get_db)):
    from game_logic import calculate_upgrade_cost
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    building = db.query(models.UserBuilding).filter(models.UserBuilding.id == building_id, models.UserBuilding.user_id == user_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
        
    cost = calculate_upgrade_cost(building.building_type, building.level)
    stats = user.stats
    
    if stats.bronze < cost["bronze"] or stats.gold < cost["gold"] or stats.diamond < cost["diamond"]:
        raise HTTPException(status_code=400, detail="Not enough resources")
        
    stats.bronze -= cost["bronze"]
    stats.gold -= cost["gold"]
    stats.diamond -= cost["diamond"]
    
    building.level += 1
    if user.city_state:
        user.city_state.population += 50
        
    db.commit()
    return {"message": f"Upgraded {building.building_type}", "success": True, "new_level": building.level, "new_stats": stats}


# =====================
# QUEST ENDPOINTS
# =====================
# (My Logic - Simplified for brevity but mostly intact)

@app.get("/quests/{user_id}", response_model=list[schemas.UserQuest])
def get_user_quests(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")

    # Seed logic inline to avoid cyclic imports if possible, or call helper
    # For now, simplistic:
    return user.quests 

@app.post("/quests/claim/{quest_id}", response_model=schemas.UserQuest)
def claim_quest_reward(quest_id: str, db: Session = Depends(get_db)):
    quest = db.query(models.UserQuest).filter(models.UserQuest.id == quest_id).first()
    if not quest: raise HTTPException(status_code=404, detail="Quest not found")
    if quest.status != models.QuestStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Not completed")
        
    user = quest.user
    rewards = quest.definition
    
    if user.stats:
        user.stats.xp += rewards.reward_xp
        user.stats.gold += rewards.reward_gold
        
        # Check level up from quest XP?
        # For simplicity, we skip full level-up curve check here or call apply_level_up
        # apply_level_up(user.stats) # Optional
    
    quest.status = models.QuestStatus.CLAIMED
    db.commit()
    db.refresh(quest)
    return quest


# =====================
# RULES & CLASSES
# =====================

@app.get("/classes", response_model=list[schemas.HeroClass])
def get_classes(db: Session = Depends(get_db)):
    return db.query(models.HeroClass).all()

@app.post("/user/{user_id}/class/{class_id}", response_model=schemas.CharacterStats)
def select_class(user_id: str, class_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    if not user.stats: user.stats = models.CharacterStats(user_id=user.id)
    
    user.stats.class_id = class_id
    db.commit()
    db.refresh(user.stats)
    return user.stats

@app.get("/rules/{user_id}", response_model=list[schemas.DetoxRule])
def get_rules(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    return user.rules

@app.post("/rules/{user_id}", response_model=schemas.DetoxRule)
def create_rule(user_id: str, rule: schemas.DetoxRuleCreate, db: Session = Depends(get_db)):
    db_rule = models.DetoxRule(user_id=user_id, **rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

# Startup Seeding
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    # Seed Classes
    if db.query(models.HeroClass).count() == 0:
        db.add_all([
            models.HeroClass(name="Night Owl", bonus_type="NIGHT_OWL"),
            models.HeroClass(name="Morning Star", bonus_type="MORNING_STAR"),
            models.HeroClass(name="Balanced", bonus_type="BALANCED")
        ])
        db.commit()
    
    # Seed Quests
    if db.query(models.QuestDefinition).count() == 0:
        db.add_all([
            models.QuestDefinition(code="DAILY_SYNC", title="First Step", target_progress=1, reward_xp=50, reward_gold=100),
            models.QuestDefinition(code="BOSS_SLAYER", title="Boss Slayer", target_progress=1, reward_xp=200, reward_gold=250),
            models.QuestDefinition(code="FOCUS_MASTER", title="Focus Master", target_progress=1, reward_xp=150, reward_gold=150)
        ])
        db.commit()
