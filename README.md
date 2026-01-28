# Idle Hero: Digital Detox RPG

**Idle Hero** is a mobile-first application that gamifies digital detox. By reducing screen time on specific apps, you progress your RPG character, building discipline in the real world to level up in the game.

## 🎮 Core Concept
- **Goal:** Help users reduce compulsive social media usage through behavioral feedback and game-based rewards.
- **Philosophy:** Realistic, minimal, and non-intrusive.
- **Mechanism:** Stay off "problem apps" -> Gain XP and Stats (Focus, Discipline). Open them -> Lose Energy.

---

## 🏗️ Tech Stack

This project follows a standard client-server architecture:

- **Frontend (Mobile App):** React Native (Expo)
- **Backend (API):** Python (FastAPI)
- **Database:** PostgreSQL
- **Environment:** Docker (optional but recommended)

---

## 🚀 Getting Started

### 1. Backend Setup (Server)
The backend manages user data, game logic, and rules.

```bash
# Navigate to backend folder
cd backend

# Create a virtual environment (optional)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```
*Server will start at `http://127.0.0.1:8000`*
*API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`*

### 2. Frontend Setup (Mobile App)
The frontend is the interface for the user.

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the app
npm start
```
*You can scan the QR code with the Expo Go app on your phone.*

---

## 📱 Current Features (MVP)

- **User Onboarding:** Create a basic profile.
- **Dashboard:** View your RPG Character stats (Level, XP, Discipline, Focus).
- **Rules Engine:** Set daily time limits for specific apps (e.g., "Max 30 mins on Instagram").
- **Sync (Demo):** A simulation of data synchronization to test the rewards system.

---

## 🛠️ Project Structure

```
idle-hero/
├── backend/            # FastAPI Server
│   ├── main.py        # Entry point & API Endpoints
│   ├── models.py      # Database Tables (User, Stats, Rules)
│   ├── schemas.py     # Pydantic Models (Data validation)
│   └── game_logic.py  # RPG calculations (XP, Leveling)
│
├── frontend/           # React Native App
│   ├── App.js         # Main Navigation
│   └── src/
│       ├── screens/   # UI Pages (Dashboard, Rules)
│       └── api.js     # Axios configuration
```
