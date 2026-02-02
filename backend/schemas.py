from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: str
    created_at: datetime
    class Config:
        orm_mode = True

# Hero Class Schemas
class HeroClassBase(BaseModel):
    name: str
    bonus_type: str
    description: Optional[str] = None

class HeroClass(HeroClassBase):
    id: str
    class Config:
        orm_mode = True

class ClassSelectRequest(BaseModel):
    class_id: str

# Stats Schemas
class CharacterStats(BaseModel):
    level: int
    xp: int
    focus: int
    discipline: int
    energy: int
    willpower: int
    class_id: Optional[str] = None
    skill_points: int = 0
    hero_class: Optional["HeroClass"] = None
    class Config:
        orm_mode = True

# Skill Schemas
class Skill(BaseModel):
    code: str
    cost: int
    description: str
    unlocked: bool = False

class SkillUnlockRequest(BaseModel):
    skill_code: str

class SkillUnlockResponse(BaseModel):
    success: bool
    message: str
    remaining_points: int

# Rule Schemas
class DetoxRuleBase(BaseModel):
    app_package_name: str
    daily_limit_minutes: Optional[int] = None
    is_blocked: bool = False
    active_days: str = "Mon,Tue,Wed,Thu,Fri,Sat,Sun"

class DetoxRuleCreate(DetoxRuleBase):
    pass

class DetoxRule(DetoxRuleBase):
    id: str
    user_id: str
    class Config:
        orm_mode = True

# Usage Log Schemas
class UsageLogCreate(BaseModel):
    app_package_name: str
    start_time: datetime
    end_time: datetime
    duration_seconds: int

class SyncResponse(BaseModel):
    xp_gained: int
    level_up: bool
    new_stats: CharacterStats
    insight: Optional[str] = None

class UserProfile(User):
    stats: Optional[CharacterStats] = None
    rules: List[DetoxRule] = []


# Boss Battle Schemas
class BossStatus(BaseModel):
    """Current boss status for GET /game/boss"""
    id: str
    name: str
    total_hp: int
    current_hp: int
    damage_dealt_to_user: int
    is_defeated: bool
    class Config:
        orm_mode = True


class BattleSummary(BaseModel):
    """Battle result summary included in sync response"""
    player_damage_dealt: int
    boss_damage_dealt: int
    boss_hp_remaining: int
    player_hp_remaining: int
    boss_defeated: bool
    xp_gained: int
    level_up: bool
    boss_name: str


class SyncResponseWithBattle(BaseModel):
    """Extended sync response with battle summary"""
    xp_gained: int
    level_up: bool
    new_stats: CharacterStats
    insight: Optional[str] = None
    battle: Optional[BattleSummary] = None


# Kingdom Schemas
class Building(BaseModel):
    id: str
    type: str
    level: int
    health: int
    class Config:
        orm_mode = True


class Kingdom(BaseModel):
    id: str
    name: str
    wood: int
    stone: int
    gold: int
    buildings: List[Building] = []
    class Config:
        orm_mode = True


class BuildRequest(BaseModel):
    building_type: str


class KingdomSyncResult(BaseModel):
    wood_gained: int
    stone_gained: int
    disaster_occurred: bool
    damaged_building: Optional[str] = None


class SyncResponseWithKingdom(BaseModel):
    """Extended sync response with kingdom resources"""
    xp_gained: int
    level_up: bool
    new_stats: CharacterStats
    insight: Optional[str] = None
    battle: Optional[BattleSummary] = None
    kingdom: Optional[KingdomSyncResult] = None
