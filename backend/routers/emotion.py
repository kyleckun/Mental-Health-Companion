from fastapi import APIRouter
from pydantic import BaseModel
from services.emotion_service import analyze_emotion
from models.message import EmotionResult

router = APIRouter()

class EmotionRequest(BaseModel):
    text: str

@router.post("", response_model=EmotionResult)
async def emotion_endpoint(req: EmotionRequest):
    """
    输入：用户文本
    输出：情绪分析结果（情绪标签、强度、理由）
    """
    return await analyze_emotion(req.text)
