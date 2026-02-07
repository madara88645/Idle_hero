from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import os

from database import get_db
import models, schemas

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

# Setup Templates
templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
templates = Jinja2Templates(directory=templates_dir)

# --- Template Routes ---

@router.get("/")
async def admin_dashboard(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

# --- API Routes ---

@router.get("/api/users")
def get_all_users(db: Session = Depends(get_db)):
    """Get brief summary of all users."""
    users = db.query(models.User).all()
    summary = []
    for u in users:
        stats = u.stats
        summary.append({
            "id": u.id,
            "username": u.username,
            "level": stats.level if stats else 1,
            "class": u.stats.hero_class.name if u.stats and u.stats.hero_class else "None",
            "last_active": u.created_at.isoformat() # Placeholder for real last active
        })
    return summary

@router.get("/api/users/{user_id}")
def get_user_details(user_id: str, db: Session = Depends(get_db)):
    """Get full details for inspector."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user": user,
        "stats": user.stats,
        "kingdom": user.kingdom,
        "quests": user.quests,
        "logs": user.logs[-5:] if user.logs else [] # Last 5 logs
    }

@router.post("/api/users/{user_id}/grant")
def grant_resources(user_id: str, xp: int = 0, gold: int = 0, db: Session = Depends(get_db)):
    """Grant resources to a user."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.stats:
        user.stats.xp += xp
        user.stats.gold += gold
        # Check level up
        while user.stats.xp >= 100 * user.stats.level:
            user.stats.level += 1
            user.stats.xp -= 100 * (user.stats.level - 1)
            user.stats.health = user.stats.max_health
            
    db.commit()
    return {"message": f"Granted {xp} XP and {gold} Gold", "new_stats": user.stats}

@router.post("/api/users/{user_id}/reset")
def reset_user(user_id: str, db: Session = Depends(get_db)):
    """Reset user progress to fresh start (Level 1)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Reset Stats
    if user.stats:
        user.stats.level = 1
        user.stats.xp = 0
        user.stats.gold = 0
        user.stats.health = 100
        user.stats.energy = 100
        user.stats.focus = 10
        
    # Reset Quests
    db.query(models.UserQuest).filter(models.UserQuest.user_id == user_id).delete()
    
    # Reset Kingdom
    if user.kingdom:
        db.delete(user.kingdom)
        
    # Reset Bosses (keep history? nah reset all for testing)
    db.query(models.BossEnemy).filter(models.BossEnemy.user_id == user_id).delete()
    
    db.commit()
    return {"message": "User reset successfully"}
