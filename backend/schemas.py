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

# Stats Schemas
class CharacterStats(BaseModel):
    level: int
    xp: int
    focus: int
    discipline: int
    energy: int
    willpower: int
    class Config:
        orm_mode = True

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
