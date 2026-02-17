from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import uuid
import enum

Base = declarative_base()

# Enum for Hero Class Types
class ClassBonusType(str, enum.Enum):
    NIGHT_OWL = "NIGHT_OWL"      # Less penalty at night (22:00-06:00)
    MORNING_STAR = "MORNING_STAR"  # Bonus XP in morning (06:00-12:00)
    HARDCORE = "HARDCORE"        # 2x XP, 3x Penalty
    BALANCED = "BALANCED"        # No modifier (default)

class HeroClass(Base):
    __tablename__ = "hero_classes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)  # e.g., "Techno Monk"
    bonus_type = Column(String, nullable=False)  # ClassBonusType value
    description = Column(String)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    stats = relationship("CharacterStats", back_populates="user", uselist=False)
    rules = relationship("DetoxRule", back_populates="user")
    logs = relationship("UsageLog", back_populates="user")
    
    # Hybrid Integration: All Relationships
    unlocked_skills = relationship("UnlockedSkill", back_populates="user")
    boss_enemies = relationship("BossEnemy", back_populates="user")
    quests = relationship("UserQuest", back_populates="user")
    
    # Friend's City Features
    city_state = relationship("CityState", back_populates="user", uselist=False)
    buildings = relationship("UserBuilding", back_populates="user")
    
    # Legacy Kingdom (Deprecated in favor of CityState, but kept for compatibility if needed)
    kingdom = relationship("Kingdom", back_populates="user", uselist=False)


class CharacterStats(Base):
    __tablename__ = "character_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    focus = Column(Integer, default=10)
    discipline = Column(Integer, default=10)
    energy = Column(Integer, default=100)
    willpower = Column(Integer, default=10)
    
    # COMBAT STATS (For Boss Battles)
    attack_power = Column(Integer, default=5)   # Damage per focus minute
    defense = Column(Integer, default=2)        # Damage reduction
    health = Column(Integer, default=100)       # Player health
    max_health = Column(Integer, default=100)   # Max health cap
    
    # ECONOMY (Hybrid)
    gold = Column(Integer, default=0)           # Currency (Shared)
    diamond = Column(Integer, default=0)        # Premium (Friend)
    bronze = Column(Integer, default=0)         # Basic (Friend)
    
    last_sync_time = Column(DateTime(timezone=True), server_default=func.now())
    
    # Class system
    class_id = Column(String, ForeignKey("hero_classes.id"), nullable=True)
    skill_points = Column(Integer, default=0)

    user = relationship("User", back_populates="stats")
    hero_class = relationship("HeroClass")

class UnlockedSkill(Base):
    __tablename__ = "unlocked_skills"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    skill_code = Column(String, index=True)  # e.g., "DOUBLE_XP_WEEKEND"
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="unlocked_skills")

class DetoxRule(Base):
    __tablename__ = "detox_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    
    app_package_name = Column(String, index=True)
    daily_limit_minutes = Column(Integer, nullable=True)
    is_blocked = Column(Boolean, default=False)
    active_days = Column(String, default="Mon,Tue,Wed,Thu,Fri,Sat,Sun")

    user = relationship("User", back_populates="rules")

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    
    app_package_name = Column(String, index=True)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)
    synced_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="logs")


class BossEnemy(Base):
    """Daily boss enemy for the Boss Battle mechanic."""
    __tablename__ = "boss_enemies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    
    date = Column(DateTime(timezone=True), server_default=func.now())  # The day this boss is active
    name = Column(String, nullable=False)                              # e.g., "Doom Scroller"
    total_hp = Column(Integer, nullable=False)                         # Starting HP
    current_hp = Column(Integer, nullable=False)                       # Remaining HP
    damage_dealt_to_user = Column(Integer, default=0)                  # Damage done to player
    is_defeated = Column(Boolean, default=False)                       # True if HP <= 0
    
    user = relationship("User", back_populates="boss_enemies")


# --- CITY BUILDER SYSTEM (Friend's Additions) ---

class CityState(Base):
    __tablename__ = "city_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    
    level = Column(Integer, default=1)
    unlocked_rings = Column(Integer, default=1) # 1 = Core only, 2 = Core + 1st ring, etc.
    population = Column(Integer, default=0)
    
    user = relationship("User", back_populates="city_state")

class UserBuilding(Base):
    __tablename__ = "user_buildings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    
    building_type = Column(String) # mine, town_hall, etc.
    level = Column(Integer, default=1)
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="buildings")


# --- QUEST SYSTEM ---

class QuestType(str, enum.Enum):
    DAILY = "DAILY"           # Resets every day
    STORY = "STORY"           # One-time progression
    ACHIEVEMENT = "ACHIEVEMENT" # Long term milestones

class QuestStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"   # Finished but reward not claimed
    CLAIMED = "CLAIMED"       # Done and dusted

class QuestDefinition(Base):
    """Template for a quest (e.g., 'Focus Master')."""
    __tablename__ = "quest_definitions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, index=True) # Unique code for logic maps
    title = Column(String, nullable=False)
    description = Column(String)
    quest_type = Column(String, default=QuestType.DAILY)
    
    target_progress = Column(Integer, default=1) # e.g. 100 minutes
    reward_xp = Column(Integer, default=0)
    reward_gold = Column(Integer, default=0)

class UserQuest(Base):
    """Link between User and Quest (Progress tracking)."""
    __tablename__ = "user_quests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    quest_def_id = Column(String, ForeignKey("quest_definitions.id"))
    
    status = Column(String, default=QuestStatus.IN_PROGRESS)
    current_progress = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="quests")
    definition = relationship("QuestDefinition")


# --- DEPRECATED/COMPATIBILITY ---
class Kingdom(Base):
    """Kingdom for resource management system. Deprecated in favor of CityState."""
    __tablename__ = "kingdoms"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    
    name = Column(String, default="My Kingdom")
    wood = Column(Integer, default=0)
    stone = Column(Integer, default=0)
    gold = Column(Integer, default=0)

    user = relationship("User", back_populates="kingdom")
    buildings = relationship("Building", back_populates="kingdom")


class Building(Base):
    """Buildings within a Kingdom. Deprecated."""
    __tablename__ = "buildings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    kingdom_id = Column(String, ForeignKey("kingdoms.id"))
    
    type = Column(String, index=True)  # "Library", "Barracks", "Mine"
    level = Column(Integer, default=1)
    health = Column(Integer, default=100)  # 0-100%

    kingdom = relationship("Kingdom", back_populates="buildings")
