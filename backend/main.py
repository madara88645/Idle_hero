from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base, User, CharacterStats, UsageLog
from schemas import UserCreate, SyncResponse, UsageLogCreate
import schemas
from game_logic import calculate_xp_and_stats
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

@app.get("/")
def read_root():
    return {"message": "Backend is running"}

@app.post("/user/onboard", response_model=schemas.User)
def onboard(user: UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(username=user.username, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Init stats
    stats = models.CharacterStats(user_id=db_user.id)
    db.add(stats)
    # Init city
    city = models.CityState(user_id=db_user.id)
    db.add(city)
    db.commit()
    return db_user

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
    
    # Init city if missing
    if not user.city_state:
        city = models.CityState(user_id=user.id)
        db.add(city)

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
    xp, leveled_up, new_stats, message = calculate_xp_and_stats(stats, logs, user.rules)
    
    # Simple city progression logic (stub)
    if leveled_up and user.city_state:
        user.city_state.level += 1
        if user.city_state.level % 5 == 0:
             user.city_state.unlocked_rings += 1

    db.commit()
    
    return {
        "xp_gained": xp,
        "level_up": leveled_up,
        "new_stats": new_stats,
        "insight": message
    }

@app.get("/user/profile/{user_id}", response_model=schemas.UserProfile)
def get_profile(user_id: str, db: Session = Depends(get_db)):
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
    
    # Ensure city state exists
    if not user.city_state:
        city = models.CityState(user_id=user.id)
        db.add(city)
        db.commit()
        db.refresh(user)

    # TEMPORARY: Boost resources for testing
    if user.stats:
        changed = False
        if user.stats.bronze < 10000:
            user.stats.bronze = 10000
            changed = True
        if user.stats.gold < 10000:
            user.stats.gold = 10000
            changed = True
        if user.stats.diamond < 10000:
            user.stats.diamond = 10000
            changed = True
        
        if changed:
            db.commit()
            db.refresh(user)
        
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
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@app.post("/city/buy/{user_id}/{building_type}")
def buy_building(user_id: str, building_type: str, db: Session = Depends(get_db)):
    from game_logic import BUILDING_COSTS
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if building_type not in BUILDING_COSTS:
        raise HTTPException(status_code=400, detail="Invalid building type")
        
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
        
        # Calculate total buildings (including the one just added)
        # Helper to calculate capacity: Ring 1 = 8, Ring 2 = 12, Ring 3 = 16...
        def get_ring_capacity(ring_level):
            return 8 + (ring_level - 1) * 4
            
        current_unlocked = user.city_state.unlocked_rings
        total_buildings = db.query(models.UserBuilding).filter(models.UserBuilding.user_id == user_id).count() + 1
        
        # Calculate max capacity of currently unlocked rings
        current_capacity = 0
        for i in range(1, current_unlocked + 1):
             current_capacity += get_ring_capacity(i)
             
        # If we exceeded capacity, unlock next ring
        if total_buildings > current_capacity:
             user.city_state.unlocked_rings += 1
        
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
    
    # Check user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check building ownership
    building = db.query(models.UserBuilding).filter(models.UserBuilding.id == building_id, models.UserBuilding.user_id == user_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found or not owned by user")
        
    # Calculate Cost
    current_level = building.level
    cost = calculate_upgrade_cost(building.building_type, current_level)
    
    if not cost:
        raise HTTPException(status_code=400, detail="Cannot upgrade this building type")
        
    stats = user.stats
    if stats.bronze < cost["bronze"] or stats.gold < cost["gold"] or stats.diamond < cost["diamond"]:
        raise HTTPException(status_code=400, detail="Not enough resources")
        
    # Pay cost
    stats.bronze -= cost["bronze"]
    stats.gold -= cost["gold"]
    stats.diamond -= cost["diamond"]
    
    # Upgrade
    building.level += 1
    
    # Effect: Add more population?
    if user.city_state:
        user.city_state.population += 50 # Bonus pop per level
        
    db.commit()
    
    return {"message": f"Upgraded {building.building_type} to level {building.level}", "success": True, "new_level": building.level, "new_stats": stats}
