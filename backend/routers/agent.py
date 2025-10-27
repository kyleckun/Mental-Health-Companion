from fastapi import APIRouter
from pydantic import BaseModel
from services.emotion_service import analyze_emotion
from services.agent_coordinator import decide
from models.message import AgentDecision

router = APIRouter()

class AgentRequest(BaseModel):
    text: str

@router.post("/decide", response_model=AgentDecision)
async def agent_decide(req: AgentRequest):
    """
    输入：用户文本
    过程：先做情绪分析 → 决策
    输出：系统下一步动作（正常/支持/危机）
    """
    emotion = await analyze_emotion(req.text)
    decision = decide(emotion)
    return decision
