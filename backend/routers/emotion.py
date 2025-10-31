from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.emotion_service import analyze_emotion
from models.message import EmotionResult
from routers.auth import get_current_user # Import get_current_user
from models.user import UserDB # Import UserDB

router = APIRouter()

class EmotionRequest(BaseModel):
    text: str

@router.post("", response_model=EmotionResult)
async def emotion_endpoint(req: EmotionRequest, current_user: UserDB = Depends(get_current_user)):
    """
    Input: User text
    Output: Emotion analysis result (emotion label, intensity, rationale)
    """
    try:
        return await analyze_emotion(req.text)
    except Exception as e:
        print(f"An error occurred during emotion analysis: {e}")
        raise HTTPException(status_code=503, detail="The emotion analysis service is currently unavailable.")
