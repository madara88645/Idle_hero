# Contributing to Idle Hero

Welcome to the team! To ensure we work together smoothly and avoid code conflicts, please follow these guidelines.

## 🤝 The 3 Golden Rules
1.  **Main Branch is Sacred:** Never push code directly to `main`. It should always be the stable version.
2.  **Branch Per Feature:** Always create a new branch for every task.
3.  **Communication:** Tell the team what you are working on before you start.

## 🌿 Workflow (How to add code)

### 1. Get the latest code
Before starting, make sure your local `main` is up to date.
```bash
git checkout main
git pull origin main
```

### 2. Create a new branch
Name your branch descriptively based on what you are doing (feature, fix, or docs).
```bash
# Format: git checkout -b <type>/<description>
git checkout -b feature/login-screen
# or
git checkout -b fix/dashboard-crash
```

### 3. Make your changes
Write your code, save files, and test them.

### 4. Commit and Push
```bash
git add .
git commit -m "Added login screen UI"
git push origin feature/login-screen
```

### 5. Create a Pull Request (PR)
1.  Go to the GitHub repository page.
2.  You will see a "Compare & pull request" button. Click it.
3.  Write a description of what you added.
4.  Request a review from your teammate.

### 6. Merge
Once the code is approved, merge it into `main`.

---

## 📦 Directory Structure Rules
- **Backend changes:** Go in `backend/`. If you change the database models (`models.py`), remember to let the team know so they can reset their local DB if needed.
- **Frontend changes:** Go in `frontend/`. Keep new screens in `src/screens/` and reusable components in `src/components/`.
