from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from models.message import ChatRequest
from services.openai_client import chat as llm_chat, chat_stream as llm_chat_stream
from services.emotion_service import analyze_emotion
from services.agent_coordinator import decide
from routers.auth import get_current_user # Import get_current_user
from models.user import UserDB # Import UserDB
import json

router = APIRouter()


def get_system_prompt(user_type: str) -> dict:
    """
    Generate a personalized system prompt based on user type.

    Args:
        user_type: The type of user (student, young_professional, pregnant_woman, general)

    Returns:
        System prompt message dict
    """
    base_prompt = (
        "You are the ChatService for a mental-health support app. "
        "Respond in a supportive, empathetic, non-judgmental, and safe manner. "
        "Avoid clinical or medical advice. Use gentle and validating language, "
        "and encourage coping strategies when appropriate."
    )

    # Add user-type-specific context
    user_context = {
        "student": (
            "\n\nYou are speaking with a STUDENT. Be mindful of academic pressures, exam stress, "
            "study-life balance, social dynamics on campus, and the challenges of young adulthood. "
            "Tailor your suggestions to their academic lifestyle (e.g., study breaks, time management, "
            "campus resources, peer relationships)."
        ),
        "young_professional": (
            "\n\nYou are speaking with a YOUNG PROFESSIONAL. Consider workplace stress, career pressures, "
            "work-life balance, professional relationships, and the demands of building a career. "
            "Offer practical suggestions that fit a working schedule (e.g., desk exercises, lunch breaks, "
            "boundary-setting at work, professional development stress)."
        ),
        "pregnant_woman": (
            "\n\nYou are speaking with a PREGNANT WOMAN. Be especially sensitive to prenatal concerns, "
            "physical changes, hormonal fluctuations, preparing for motherhood, and the unique emotional "
            "journey of pregnancy. Suggest pregnancy-safe activities (e.g., prenatal breathing, gentle "
            "movement, partner bonding, preparing for baby). ALWAYS prioritize safety and recommend "
            "consulting healthcare providers when appropriate."
        ),
        "general": (
            "\n\nYou are speaking with a user who hasn't specified a particular life situation. "
            "Provide generally applicable mental health support while being attentive to any context "
            "they share about their life circumstances."
        )
    }

    content = base_prompt + user_context.get(user_type, user_context["general"])

    return {
        "role": "system",
        "content": content
    }

@router.post("")
async def chat_endpoint(req: ChatRequest, current_user: UserDB = Depends(get_current_user)): # Add dependency
    """
    Main chat entry point (non-streaming):
    1. Extract latest user message
    2. Emotion analysis
    3. Decide next action: normal / support / crisis
    4. Return the reply & decision
    """

    # 1) Get latest user message
    last_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "")

    try:
        # 2) Emotion analysis
        emotion = await analyze_emotion(last_user_msg)

        # 3) Decision
        decision = decide(emotion)

        # 4) Crisis Flow (UC-001)
        if decision.next_action == "crisis_flow":
            reply = (
                "It sounds like you may be going through a very overwhelming and difficult moment right now. "
                "Thank you for sharing this with me — you're not alone here.\n\n"
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
                "Thank you for expressing how you're feeling. It makes sense that this situation may feel stressful or heavy for you.\n\n"
                "If you'd like, we could try something that may help you feel a little more grounded:\n"
                "• A 5-minute breathing exercise\n"
                "• The 5-4-3-2-1 grounding technique\n"
                "• A one-sentence mood journaling activity (I can guide you)\n\n"
                "Would any of these feel helpful to try?"
            )

        # 6) Normal Chat (LLM) with user-type-specific prompt
        else:
            system_prompt = get_system_prompt(current_user.user_type)
            messages = [system_prompt] + [m.dict() for m in req.messages]
            reply = await llm_chat(messages, temperature=0.5)

        return {
            "reply": reply,
            "decision": decision.dict()
        }
    except Exception as e:
        print(f"An error occurred during chat processing: {e}")
        raise HTTPException(status_code=503, detail="The chat service is currently unavailable.")


@router.post("/stream")
async def chat_stream_endpoint(req: ChatRequest, current_user: UserDB = Depends(get_current_user)):
    """
    Streaming chat endpoint:
    1. Extract latest user message
    2. Emotion analysis (async, non-blocking)
    3. Stream the response in real-time
    """

    # Get latest user message
    last_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "")

    async def generate_stream():
        try:
            # Perform emotion analysis
            emotion = await analyze_emotion(last_user_msg)
            decision = decide(emotion)

            # Send decision metadata first
            yield f"data: {json.dumps({'type': 'metadata', 'decision': decision.dict()})}\n\n"

            # Crisis Flow
            if decision.next_action == "crisis_flow":
                reply = (
                    "It sounds like you may be going through a very overwhelming and difficult moment right now. "
                    "Thank you for sharing this with me — you're not alone here.\n\n"
                    "Here are a few supportive options that may help you cope in this moment:\n"
                    "• A short guided breathing exercise (30 seconds)\n"
                    "• A grounding technique to help you feel more present\n"
                    "• Reaching out to someone you trust for support\n"
                    "• Accessing a crisis helpline if you feel you may be in immediate danger\n\n"
                    "Which of these would you feel most comfortable trying right now?"
                )
                yield f"data: {json.dumps({'type': 'content', 'content': reply})}\n\n"

            # Support Suggestion
            elif decision.next_action == "support_suggestion":
                reply = (
                    "Thank you for expressing how you're feeling. It makes sense that this situation may feel stressful or heavy for you.\n\n"
                    "If you'd like, we could try something that may help you feel a little more grounded:\n"
                    "• A 5-minute breathing exercise\n"
                    "• The 5-4-3-2-1 grounding technique\n"
                    "• A one-sentence mood journaling activity (I can guide you)\n\n"
                    "Would any of these feel helpful to try?"
                )
                yield f"data: {json.dumps({'type': 'content', 'content': reply})}\n\n"

            # Normal Chat with streaming and user-type-specific prompt
            else:
                system_prompt = get_system_prompt(current_user.user_type)
                messages = [system_prompt] + [m.dict() for m in req.messages]
                async for chunk in llm_chat_stream(messages, temperature=0.5):
                    yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"

            # Signal completion
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            print(f"An error occurred during streaming: {e}")
            error_msg = "I apologize, I'm having trouble responding right now. Please try again in a moment."
            yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable buffering for nginx
        }
    )
