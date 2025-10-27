from services.openai_client import chat
from models.message import EmotionResult

import json, re

EMOTION_SYSTEM_PROMPT = """
You are an emotion classifier for mental-health chat messages.

Your job is ONLY to classify the user's emotional state.

Return a JSON with EXACTLY these 3 fields:
- label: one of ["joy", "neutral", "stress", "sadness", "anger"]
- intensity: a float between 0 and 1
- rationale: a short 1-sentence explanation for the classification

Do NOT include any extra text outside the JSON.
"""

async def analyze_emotion(text: str) -> EmotionResult:
    system_msg = {"role": "system", "content": EMOTION_SYSTEM_PROMPT}
    user_msg = {"role": "user", "content": text}

    raw = await chat([system_msg, user_msg], temperature=0.0)

    # 处理模型可能输出带文本或格式的情况，只提取 JSON
    try:
        data = json.loads(raw)
    except Exception:
        match = re.search(r"\{.*\}", raw, re.S)
        data = json.loads(match.group(0)) if match else {"label": "neutral", "intensity": 0.0, "rationale": "fallback"}

    return EmotionResult(
        label=data.get("label", "neutral"),
        intensity=float(data.get("intensity", 0)),
        rationale=data.get("rationale", "")
    )
