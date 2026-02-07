import sqlite3
import os

DB_FILE = "sql_app.db"

def migrate():
    if not os.path.exists(DB_FILE):
        print("Database file not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Check if 'gold' column exists in 'character_stats'
        cursor.execute("PRAGMA table_info(character_stats)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "gold" not in columns:
            print("Adding 'gold' column to 'character_stats'...")
            cursor.execute("ALTER TABLE character_stats ADD COLUMN gold INTEGER DEFAULT 0")
            conn.commit()
            print("Migration successful.")
        else:
            print("'gold' column already exists.")
            
    except Exception as e:
        print(f"Error migrating database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
