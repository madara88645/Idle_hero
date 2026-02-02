import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

db_password = os.getenv("DB_PASSWORD")
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Default to SQLite for local development if not specified
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

print(f"DEBUG: Using DATABASE_URL={DATABASE_URL}")

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
