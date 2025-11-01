# Quick Start Guide

Get the Mental Health Companion up and running in 5 minutes!

## What is this?

A mental health support app with:
- **AI Chat Therapist** - Talk to GPT-4 powered AI
- **Mood Journal** - Track your daily mood (1-10 scale)
- **Trend Visualization** - See your mood patterns over time
- **Personalized Suggestions** - Get wellness tips based on your mood and user type

## Prerequisites

You need to install:
- **Python 3.9+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **OpenAI API Key** - [Get free trial key](https://platform.openai.com/api-keys)

## Setup Steps

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/Mental-Health-Companion.git
cd Mental-Health-Companion

# Backend setup
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt

# Frontend setup (new terminal)
cd ../frontend
npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

**Generate a secret key**:
```bash
# Windows PowerShell or macOS/Linux Terminal
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Edit `.env` file** with the following:
```env
# Paste the generated secret key
SECRET_KEY=paste_generated_key_here

# Paste your OpenAI API Key
OPENAI_API_KEY=sk-your-key-here

# Database configuration (no need to change)
DATABASE_URL=sqlite:///./test.db

# Frontend URL (no need to change)
CORS_ORIGINS=["http://localhost:5173"]
```

### 3. Initialize Database

```bash
cd backend
alembic upgrade head
```

### 4. Run Application

**Terminal 1 (Backend)**:
```bash
cd backend
# Activate venv if not already active
uvicorn main:app --reload
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```

### 5. Access Application

Open http://localhost:5173 in your browser!

## First Steps

1. **Register** a new account
2. Select your **user type** (Student, Young Professional, etc.)
3. Explore the 4 tabs:
   - **AI Chat** - Talk to AI therapist
   - **Journal** - Log your mood
   - **Trends** - View mood charts
   - **Suggestions** - Get personalized tips

## How to Use

### Registration and Login
1. Open http://localhost:5173
2. Click "Register" to create a new account
3. Fill in your information and select your **user type**:
   - **Student** - Academic stress, study tips, campus resources
   - **Young Professional** - Work-life balance, career stress management
   - **Pregnant Woman** - Prenatal wellness, gentle activities
   - **General** - Comprehensive mental health support

### Main Features

After logging in, you'll see 4 tabs:

#### Tab 1: AI Chat
- Talk to AI therapist like chatting with a friend
- AI provides personalized advice based on your user type
- Crisis detection with emergency resources

#### Tab 2: Journal
- Click "Add New Entry" to record your mood
- Rate your mood from 1-10
- Add notes and tag activities (exercise, meditation, etc.)
- View your mood history

#### Tab 3: Trends
- View your mood changes in charts
- Select time range: Today/Week/Month/Custom
- Understand your mood patterns

#### Tab 4: Suggestions
- Get personalized wellness recommendations
- Select analysis time range
- Click "Refresh" for template-based suggestions
- Click "Generate with AI" for AI-generated recommendations
- Mark suggestions as complete or skip them

### Profile Management
- Click "Profile" button at the top
- Update your email and user type
- Click "Logout" to end your session

## Troubleshooting

### Issue: Backend won't start - "ModuleNotFoundError"
```bash
# Ensure virtual environment is activated
cd backend
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Database error - "no such column"
```bash
cd backend
alembic upgrade head
```

### Issue: Frontend error - "Failed to resolve import"
```bash
cd frontend
rm -rf node_modules package-lock.json  # Remove old dependencies
npm install  # Reinstall
```

### Issue: CORS error
- Ensure backend is running on http://localhost:8000
- Check `CORS_ORIGINS` setting in backend/.env

### Issue: OpenAI API error
- Verify API key is correct
- Confirm OpenAI account has credits
- Check rate limits: https://platform.openai.com/account/limits

### Issue: Port 5173 is in use
- Vite will automatically try other ports (5174, 5175...)
- Use the URL shown in terminal

## Need More Help?

- **Full Documentation**: See [README.md](README.md) for complete docs
- **API Documentation**: Visit http://localhost:8000/docs to view all APIs
- **Report Issues**: Open an issue on GitHub

## Important Notice

This application is a mental health **support tool** and is not a replacement for professional mental health care.

**If you're experiencing a mental health crisis, please contact**:
- **Australia**:
  - Lifeline: 13 11 14 (24/7 crisis support)
  - Beyond Blue: 1300 22 4636 (24/7)
  - Kids Helpline: 1800 55 1800 (ages 5-25)
- **US**: National Suicide Prevention Lifeline: 1-800-273-8255
- **UK**: Samaritans: 116 123
- **International**: https://www.befrienders.org/

---

Enjoy using the app! Remember to take care of your mental health.
