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
        # Get existing columns
        cursor.execute("PRAGMA table_info(character_stats)")
        columns = [info[1] for info in cursor.fetchall()]
        print(f"Existing columns: {columns}")
        
        # Columns to check and add
        new_columns = {
            "gold": "INTEGER DEFAULT 0",
            "diamond": "INTEGER DEFAULT 0",
            "bronze": "INTEGER DEFAULT 0",
            "last_sync_time": "TIMESTAMP",
            "class_id": "TEXT",
            "skill_points": "INTEGER DEFAULT 0"
        }
        
        for col, dtype in new_columns.items():
            if col not in columns:
                print(f"Adding column: {col}")
                cursor.execute(f"ALTER TABLE character_stats ADD COLUMN {col} {dtype}")
            else:
                print(f"Column {col} exists.")
                
        conn.commit()
        print("Migration complete.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
