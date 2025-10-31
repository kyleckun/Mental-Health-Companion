from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.emotion_service import analyze_emotion
from services.agent_coordinator import decide
from models.message import AgentDecision
from routers.auth import get_current_user # Import get_current_user
from models.user import UserDB # Import UserDB

router = APIRouter()

class AgentRequest(BaseModel):
    text: str

@router.post("/decide", response_model=AgentDecision)
async def agent_decide(req: AgentRequest, current_user: UserDB = Depends(get_current_user)):
    """
    Input: User text
    Process: Analyze emotion first, then make decision
    Output: System's next action (normal/support/crisis)
    """
    try:
        emotion = await analyze_emotion(req.text)
        decision = decide(emotion)
        return decision
    except Exception as e:
        # For production, you would have more robust logging
        print(f"An error occurred during agent decision: {e}")
        raise HTTPException(status_code=503, detail="The agent service is currently unavailable.")
