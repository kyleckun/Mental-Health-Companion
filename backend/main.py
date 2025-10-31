from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware

# Import routers
from routers import chat, emotion, agent, mood, auth, suggestions
# MODIFICATION: Import new router
from routers import emergency_contacts # ADD THIS LINE

# Import database
from database import Base, engine

# Import models to ensure they are registered with SQLAlchemy
from models import user  # noqa: F401
from models import mood as mood_models  # noqa: F401
# MODIFICATION: Import new model
from models import emergency_contact # ADD THIS LINE


# Custom CORS middleware to ensure headers are always added
class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            return response

        # Process actual request
        response = await call_next(request)

        # Add CORS headers to response
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"

        return response


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup: Create database tables
    print("[START] Starting Mental Health Companion API...")
    print("[INFO] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created successfully!")

    yield

    # Shutdown
    print("[STOP] Shutting down Mental Health Companion API...")


# Initialize FastAPI application
app = FastAPI(
    title="Mental Health Companion API",
    description="Backend API for Mental Health Companion - Stage 2",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add custom CORS middleware FIRST
app.add_middleware(CustomCORSMiddleware)

# Also add standard CORS middleware as backup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register API routers
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    mood.router,
    prefix="/api/mood-entries",
    tags=["Mood Entries"]
)

app.include_router(
    chat.router,
    prefix="/api/chat",
    tags=["Chat Service"]
)

app.include_router(
    emotion.router,
    prefix="/api/emotion",
    tags=["Emotion Analysis"]
)

app.include_router(
    agent.router,
    prefix="/api/agent",
    tags=["AI Agent"]
)

app.include_router(
    suggestions.router,
    prefix="/api/suggestions",
    tags=["Personalized Suggestions"]
)

# MODIFICATION: Register new router
app.include_router(
    emergency_contacts.router,
    prefix="/api/emergency-contacts",
    tags=["Emergency Contacts"]
)

# Root endpoint
@app.get("/", tags=["Health Check"])
def root():
    """
    Root endpoint - Health check
    """
    return {
        "ok": True,
        "service": "Mental Health Companion API",
        "version": "2.0.0",
        "stage": "Stage 2",
        "status": "running"
    }


# Health check endpoint
@app.get("/health", tags=["Health Check"])
def health_check():
    """
    Detailed health check endpoint
    """
    return {
        "status": "healthy",
        "service": "Mental Health Companion API",
        "database": "connected",
        "endpoints": {
            "auth": "/api/auth",
            "mood": "/api/mood-entries",
            "chat": "/api/chat",
            "emotion": "/api/emotion",
            "agent": "/api/agent",
            "suggestions": "/api/suggestions",
            "emergency_contacts": "/api/emergency-contacts" # MODIFICATION: Add new endpoint
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )