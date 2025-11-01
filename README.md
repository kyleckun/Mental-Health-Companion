# Mental Health Companion

A comprehensive mental health support application that combines mood tracking, AI-powered chat therapy, personalized wellness suggestions, and data visualization to help users manage their mental well-being.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Python](https://img.shields.io/badge/python-3.9+-green)
![React](https://img.shields.io/badge/react-18.2-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Features

- **User Authentication & Profiles**
  - Secure JWT-based authentication
  - User type selection (Student, Young Professional, Pregnant Woman, General)
  - Profile management and customization

- **Mood Journal**
  - Track daily mood levels (1-10 scale)
  - Add contextual notes and activities
  - View mood history with timestamps
  - Edit and delete mood entries

- **AI-Powered Chat Therapy**
  - Real-time conversation with GPT-4 powered assistant
  - Context-aware responses based on user type
  - Personalized mental health support
  - Crisis detection and intervention
  - Streaming responses for better UX

- **Personalized Suggestions**
  - Template-based wellness recommendations
  - AI-generated personalized suggestions
  - Filtered by user type and mood trends
  - Time range selection (Today/Week/Month/Custom)
  - Track completion status

- **Data Visualization**
  - Interactive mood trend charts
  - Time-based filtering (Today/Week/Month/Custom)
  - Mood pattern analysis
  - Visual insights into mental health trends

- **Multi-User Type Support**
  - **Students**: Academic stress management, study breaks, campus resources
  - **Young Professionals**: Work-life balance, career stress, productivity tips
  - **Pregnant Women**: Prenatal wellness, gentle activities, maternal health
  - **General Users**: Comprehensive mental health support

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: SQLAlchemy
- **Authentication**: JWT (python-jose, passlib)
- **AI Integration**: OpenAI GPT-4o-mini
- **API Client**: httpx
- **Migrations**: Alembic
- **Logging**: python-json-logger

### Frontend
- **Framework**: React 18 + TypeScript
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Build Tool**: Vite
- **Styling**: Inline CSS (React CSSProperties)

### Development Tools
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Package Management**: npm, pip

## Project Structure

```
Mental-Health-Companion/
├── backend/
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py         # User model with user_type
│   │   ├── mood.py         # Mood entry model
│   │   ├── message.py      # Chat message model
│   │   └── refresh_token.py
│   ├── routers/            # FastAPI route handlers
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── mood.py         # Mood journal endpoints
│   │   ├── chat.py         # AI chat endpoints
│   │   ├── suggestions.py  # Personalized suggestions
│   │   └── emotion.py      # Emotion analysis
│   ├── services/           # Business logic
│   │   ├── auth_service.py
│   │   ├── emotion_service.py
│   │   └── openai_client.py
│   ├── schemas/            # Pydantic schemas
│   │   └── auth.py
│   ├── migrations/         # Alembic migrations
│   │   └── versions/
│   ├── main.py             # FastAPI app entry point
│   ├── config.py           # Configuration management
│   ├── database.py         # Database setup
│   ├── dependencies.py     # FastAPI dependencies
│   ├── logger.py           # Logging configuration
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Chat/       # AI chat interface
│   │   │   ├── MoodJournal/ # Mood tracking components
│   │   │   └── Visualization/ # Charts
│   │   ├── pages/          # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── MoodJournalPage.tsx  # Main app (4 tabs)
│   │   │   ├── ChatPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── services/       # API clients
│   │   │   ├── apiClient.ts
│   │   │   ├── authService.ts
│   │   │   ├── moodService.ts
│   │   │   └── suggestionsService.ts
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── README.md               # This file
├── REDUNDANT_FILES.md      # Cleanup documentation
└── cleanup_redundant_files.py  # Cleanup script
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** and npm ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/downloads))
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

### System Requirements
- **OS**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB free space

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Mental-Health-Companion.git
cd Mental-Health-Companion
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Create virtual environment (macOS/Linux)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

## Configuration

### Backend Configuration

1. **Create environment file**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` file** with your settings:

   ```bash
   # Generate a secret key
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

   Then update `.env`:
   ```env
   # Security
   SECRET_KEY=your_generated_secret_key_here

   # OpenAI API
   OPENAI_API_KEY=your_openai_api_key_here

   # Database (SQLite for development)
   DATABASE_URL=sqlite:///./test.db

   # CORS (update if frontend runs on different port)
   CORS_ORIGINS=["http://localhost:5173"]
   ```

3. **Initialize the database**:
   ```bash
   # Run Alembic migrations
   alembic upgrade head
   ```

### Frontend Configuration

The frontend is pre-configured to connect to `http://localhost:8000`. If you need to change this:

1. Edit `frontend/src/services/apiClient.ts`:
   ```typescript
   const API_BASE_URL = 'http://localhost:8000'; // Change if needed
   ```

## Running the Application

### Option 1: Run Both Services Separately

**Terminal 1 - Backend**:
```bash
cd backend
# Activate virtual environment first (if not already activated)
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### Option 2: Using Background Processes

**Windows (PowerShell)**:
```powershell
# Start backend in background
cd backend
Start-Process -NoNewWindow python -ArgumentList "-m", "uvicorn", "main:app", "--reload"

# Start frontend
cd ..\frontend
npm run dev
```

**macOS/Linux**:
```bash
# Start backend in background
cd backend
uvicorn main:app --reload &

# Start frontend
cd ../frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc (ReDoc)

## Usage Guide

### 1. User Registration

1. Navigate to http://localhost:5173
2. Click "Register" or "Sign Up"
3. Fill in:
   - Username (unique)
   - Email address
   - Password (minimum requirements apply)
   - Select your **User Type**:
     - Student
     - Young Professional
     - Pregnant Woman
     - General User
4. Click "Register"

### 2. Login

1. Enter your username/email and password
2. Optional: Check "Remember Me" for persistent login
3. Click "Login"

### 3. Main Application Features

After logging in, you'll see the main dashboard with 4 tabs:

#### AI Chat Tab
- Real-time conversation with AI therapist
- Type your message and press Enter or click Send
- AI responses are personalized based on your user type
- Crisis detection automatically triggers support resources

#### Journal Tab
- Click "Add New Entry" to log your mood
- Select mood level (1-10 scale)
- Add optional notes about your day
- Tag activities (exercise, meditation, etc.)
- View and edit your mood history

#### Trends Tab
- View interactive mood charts
- Select time range:
  - Today: Current day only
  - Week: Past 7 days
  - Month: Past 30 days
  - Custom: Select specific date range
- Analyze mood patterns over time

#### Suggestions Tab
- Get personalized wellness recommendations
- Select analysis time range (Today/Week/Month/Custom)
- Click "Refresh" for template-based suggestions
- Click "Generate with AI" for dynamic AI recommendations
- Mark suggestions as complete or skip them

### 4. Profile Management

1. Click "Profile" button in the header
2. Update your:
   - Email address
   - User type
3. Click "Save Changes"
4. Use "Logout" to end your session

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user info |
| PUT | `/api/auth/me` | Update user profile |

### Mood Journal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mood/entries` | Get all mood entries |
| POST | `/api/mood/entries` | Create mood entry |
| PUT | `/api/mood/entries/{id}` | Update mood entry |
| DELETE | `/api/mood/entries/{id}` | Delete mood entry |
| GET | `/api/mood/trends` | Get mood trend data |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/messages` | Send chat message (streaming) |
| GET | `/api/chat/history` | Get chat history |

### Suggestions Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suggestions` | Get personalized suggestions |
| POST | `/api/suggestions/generate-ai` | Generate AI suggestions |
| POST | `/api/suggestions/{id}/complete` | Mark suggestion complete |
| POST | `/api/suggestions/{id}/skip` | Skip suggestion |

### Interactive API Documentation

Visit http://localhost:8000/docs for the full interactive Swagger UI documentation where you can:
- Test all endpoints
- View request/response schemas
- See example payloads
- Authenticate and make authorized requests

## Database

### Development (SQLite)

The default configuration uses SQLite, which creates a `test.db` file in the `backend/` directory.

**Pros**:
- Zero configuration
- File-based, easy to backup
- Perfect for development

**Cons**:
- Not suitable for production
- Limited concurrency

### Production (PostgreSQL)

For production deployment, use PostgreSQL:

1. **Install PostgreSQL**:
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create database**:
   ```sql
   CREATE DATABASE mental_health_db;
   CREATE USER mh_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE mental_health_db TO mh_user;
   ```

3. **Update `.env`**:
   ```env
   DATABASE_URL=postgresql://mh_user:secure_password@localhost:5432/mental_health_db
   ```

4. **Run migrations**:
   ```bash
   alembic upgrade head
   ```

### Database Migrations

Create a new migration after model changes:

```bash
cd backend

# Auto-generate migration
alembic revision --autogenerate -m "Description of changes"

# Review the generated file in migrations/versions/

# Apply migration
alembic upgrade head
```

Rollback a migration:
```bash
alembic downgrade -1  # Go back one version
```

## Deployment

### Backend Deployment (Production)

1. **Set production environment variables**:
   ```env
   APP_ENV=production
   DEBUG=false
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

2. **Use production ASGI server** (Gunicorn + Uvicorn workers):
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

3. **Set up reverse proxy** (Nginx example):
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Frontend Deployment

1. **Build for production**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve static files**:
   - The `dist/` folder contains the production build
   - Deploy to: Vercel, Netlify, AWS S3 + CloudFront, etc.

3. **Update API URL**:
   - Before building, update `apiClient.ts` with production API URL

### Docker Deployment (Optional)

Create `Dockerfile` for backend:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: mental_health_db
      POSTGRES_USER: mh_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### 1. Backend won't start

**Error**: `ModuleNotFoundError: No module named 'fastapi'`
```bash
# Solution: Activate virtual environment and install dependencies
cd backend
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

**Error**: `sqlite3.OperationalError: no such column`
```bash
# Solution: Run database migrations
alembic upgrade head
```

#### 2. Frontend build errors

**Error**: `Failed to resolve import`
```bash
# Solution: Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Error**: `VITE v5.x.x ready in XXX ms` but blank page
```bash
# Check browser console for errors
# Usually CORS or API connection issue
# Verify backend is running on http://localhost:8000
```

#### 3. CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

Solution: Update `backend/.env`:
```env
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

#### 4. OpenAI API Errors

**Error**: `Invalid API key` or `Rate limit exceeded`

Solutions:
- Verify API key in `.env`
- Check OpenAI account has credits
- Check rate limits: https://platform.openai.com/account/limits

#### 5. Database Connection Issues

**Error**: `could not connect to server`

Solutions:
- For SQLite: Ensure `test.db` file permissions are correct
- For PostgreSQL: Verify database is running and credentials are correct
```bash
# Check PostgreSQL status (Linux/macOS)
sudo systemctl status postgresql

# Check PostgreSQL status (Windows)
Get-Service postgresql*
```

### Debug Mode

Enable debug logging in `backend/.env`:
```env
LOG_LEVEL=DEBUG
DEBUG=true
```

Check logs for detailed error information.

### Getting Help

If you encounter issues:

1. Check the logs (backend terminal output)
2. Review browser console (F12) for frontend errors
3. Consult API docs: http://localhost:8000/docs
4. Check existing GitHub issues
5. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Python version, Node version)

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to the branch**: `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

### Coding Standards

- **Backend**: Follow PEP 8 style guide
- **Frontend**: Use ESLint rules (run `npm run lint`)
- **Commits**: Use conventional commits (feat, fix, docs, etc.)
- **Documentation**: Update README for significant changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **OpenAI** for GPT-4 API
- **FastAPI** for the excellent web framework
- **React** community for amazing tools and libraries
- All contributors who help improve this project

## Contact

For questions or support:
- **Issues**: [GitHub Issues](https://github.com/yourusername/Mental-Health-Companion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/Mental-Health-Companion/discussions)

## Roadmap

Planned features for future releases:

- [ ] Mobile app (React Native)
- [ ] Group therapy sessions
- [ ] Mood prediction using ML
- [ ] Integration with wearable devices
- [ ] Multi-language support
- [ ] Therapist dashboard for professionals
- [ ] Voice chat with AI
- [ ] Medication reminders
- [ ] Community support forums

---

**Made for mental health awareness and support**

**Disclaimer**: This application is designed to support mental wellness but is not a replacement for professional mental health care. If you're experiencing a mental health crisis, please contact emergency services or a mental health professional immediately.

**Crisis Resources**:
- **Australia**:
  - Lifeline: 13 11 14 (24/7 crisis support)
  - Beyond Blue: 1300 22 4636 (24/7)
  - Kids Helpline: 1800 55 1800 (ages 5-25)
- **US**: National Suicide Prevention Lifeline: 1-800-273-8255
- **UK**: Samaritans: 116 123
- **International**: https://www.befrienders.org/
