from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="chat history + latest user msg")
    user_id: Optional[str] = None

class EmotionResult(BaseModel):
    label: str           # e.g., "sadness", "stress", "anger", "neutral", "joy"
    intensity: float     # 0-1
    rationale: str

class AgentDecision(BaseModel):
    next_action: str     # "normal_reply" | "support_suggestion" | "crisis_flow"
    reason: str
    emotion: EmotionResult
    metadata: Dict[str, str] = {}
