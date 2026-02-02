import uvicorn
import os
import sys

# Add the current directory to sys.path to ensure modules can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Attempting to import main...")
try:
    import main
    print("Successfully imported main.")
except Exception as e:
    print(f"CRITICAL ERROR: Could not import main module.")
    print(f"Error details: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

if __name__ == "__main__":
    print("Starting Uvicorn server...")
    # Using factory or simple string string reference
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
