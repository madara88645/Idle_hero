from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, ARRAY
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    stats = relationship("CharacterStats", back_populates="user", uselist=False)
    rules = relationship("DetoxRule", back_populates="user")
    logs = relationship("UsageLog", back_populates="user")
    city_state = relationship("CityState", back_populates="user", uselist=False)
    buildings = relationship("UserBuilding", back_populates="user")

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
    
    # Resources
    gold = Column(Integer, default=0)
    diamond = Column(Integer, default=0)
    bronze = Column(Integer, default=0)
    
    last_sync_time = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="stats")

class DetoxRule(Base):
    __tablename__ = "detox_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    
    app_package_name = Column(String, index=True)
    daily_limit_minutes = Column(Integer, nullable=True)
    is_blocked = Column(Boolean, default=False)
    active_days = Column(String, default="Mon,Tue,Wed,Thu,Fri,Sat,Sun") # Simple comma separated

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
