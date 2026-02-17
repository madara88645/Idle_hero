from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from game_logic import generate_daily_boss

router = APIRouter(
    prefix="/debug",
    tags=["debug"],
    responses={404: {"description": "Not found"}},
)

@router.post("/add_resources/{user_id}")
def add_resources(
    user_id: str, 
    gold: int = 1000, 
    diamond: int = 100, 
    bronze: int = 1000, 
    db: Session = Depends(get_db)
):
    """Cheat: Add resources to user."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.stats:
        user.stats = models.CharacterStats(user_id=user.id)
        db.add(user.stats)
        
    user.stats.gold += gold
    user.stats.diamond += diamond
    user.stats.bronze += bronze
    db.commit()
    return {"message": "Resources added", "new_stats": user.stats}

@router.post("/reset_boss/{user_id}")
def reset_boss(user_id: str, db: Session = Depends(get_db)):
    """Cheat: Delete today's boss and generate a fresh one."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Find existing boss
    # Note: Logic in game_logic.get_todays_boss might need bypass if we want to force re-fight SAME day.
    # We will just delete ALL active bosses for simplicity or mark them deleted.
    
    bosses = db.query(models.BossEnemy).filter(models.BossEnemy.user_id == user_id).all()
    for b in bosses:
        db.delete(b)
    
    db.commit()
    
    # Generate new
    new_boss = generate_daily_boss(db, user)
    return {"message": "Boss reset", "boss": new_boss}

@router.post("/set_level/{user_id}/{level}")
def set_level(user_id: str, level: int, db: Session = Depends(get_db)):
    """Cheat: Set hero level directly."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    
    if not user.stats: user.stats = models.CharacterStats(user_id=user.id)
    
    user.stats.level = level
    # Scale HP/Attack roughly
    user.stats.max_health = 100 + (level * 10)
    user.stats.health = user.stats.max_health
    user.stats.attack_power = 5 + level
    
    db.commit()
    return {"message": f"Level set to {level}", "stats": user.stats}

@router.post("/unlock_all_cities/{user_id}")
def unlock_cities(user_id: str, db: Session = Depends(get_db)):
    """Cheat: Unlock all city rings."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    
    if not user.city_state: user.city_state = models.CityState(user_id=user.id)
    
    user.city_state.unlocked_rings = 5 # Max?
    user.city_state.population += 1000
    db.commit()
    return {"message": "City rings unlocked", "city": user.city_state}
