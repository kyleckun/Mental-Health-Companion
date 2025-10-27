from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from routers import chat, emotion, agent

app = FastAPI(title="Mental Health Support – ChatService & AI Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册三个路由模块
app.include_router(chat.router, prefix="/api/chat", tags=["ChatService"])
app.include_router(emotion.router, prefix="/api/emotion", tags=["Emotion Analysis"])
app.include_router(agent.router, prefix="/api/agent", tags=["Agent Coordinator"])

@app.get("/")
def root():
    return {"ok": True, "service": "ELEC5620 Stage2 ChatService"}
