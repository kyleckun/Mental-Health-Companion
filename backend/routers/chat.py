from fastapi import APIRouter
from models.message import ChatRequest
from services.openai_client import chat as llm_chat
from services.emotion_service import analyze_emotion
from services.agent_coordinator import decide

router = APIRouter()

SYSTEM_PROMPT = {
    "role": "system",
    "content": (
        "You are the ChatService for a mental-health support app. "
        "Respond in a supportive, empathetic, non-judgmental, and safe manner. "
        "Avoid clinical or medical advice. Use gentle and validating language, "
        "and encourage coping strategies when appropriate."
    )
}

@router.post("")
async def chat_endpoint(req: ChatRequest):
    """
    Main chat entry point:
    1. Extract latest user message
    2. Emotion analysis
    3. Decide next action: normal / support / crisis
    4. Return the reply & decision
    """

    # 1) Get latest user message
    last_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "")

    # 2) Emotion analysis
    emotion = await analyze_emotion(last_user_msg)

    # 3) Decision
    decision = decide(emotion)

    # 4) Crisis Flow (UC-001)
    if decision.next_action == "crisis_flow":
        reply = (
            "It sounds like you may be going through a very overwhelming and difficult moment right now. "
            "Thank you for sharing this with me — you’re not alone here. 💛\n\n"
            "Here are a few supportive options that may help you cope in this moment:\n"
            "• A short guided breathing exercise (30 seconds)\n"
            "• A grounding technique to help you feel more present\n"
            "• Reaching out to someone you trust for support\n"
            "• Accessing a crisis helpline if you feel you may be in immediate danger\n\n"
            "Which of these would you feel most comfortable trying right now?"
        )

    # 5) Support Suggestion
    elif decision.next_action == "support_suggestion":
        reply = (
            "Thank you for expressing how you’re feeling. It makes sense that this situation may feel stressful or heavy for you.\n\n"
            "If you’d like, we could try something that may help you feel a little more grounded:\n"
            "• A 5-minute breathing exercise\n"
            "• The 5-4-3-2-1 grounding technique\n"
            "• A one-sentence mood journaling activity (I can guide you)\n\n"
            "Would any of these feel helpful to try?"
        )

    # 6) Normal Chat (LLM)
    else:
        messages = [SYSTEM_PROMPT] + [m.dict() for m in req.messages]
        reply = await llm_chat(messages, temperature=0.5)

    return {
        "reply": reply,
        "decision": decision.dict()
    }
