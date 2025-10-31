from models.message import EmotionResult, AgentDecision

HIGH_RISK_LABELS = {"sadness", "stress", "anger"}

CRISIS_THRESHOLD = 0.85
SUPPORT_THRESHOLD = 0.55

def decide(emotion: EmotionResult) -> AgentDecision:
    """
    Based on emotion analysis results, determine the system's next action:
    - normal_reply: Regular chat
    - support_suggestion: Provide emotional support suggestions
    - crisis_flow: Trigger crisis intervention flow (UC-001)
    """

    if emotion.label in HIGH_RISK_LABELS and emotion.intensity >= CRISIS_THRESHOLD:
        return AgentDecision(
            next_action="crisis_flow",
            reason="High-risk emotional state detected; escalate to crisis support (UC-001).",
            emotion=emotion,
            metadata={"escalation": "UC-001"}
        )

    if emotion.label in HIGH_RISK_LABELS and emotion.intensity >= SUPPORT_THRESHOLD:
        return AgentDecision(
            next_action="support_suggestion",
            reason="Negative emotion detected; provide coping strategies.",
            emotion=emotion,
            metadata={"suggestions": "breathing, grounding_54321, journaling"}
        )

    return AgentDecision(
        next_action="normal_reply",
        reason="Emotion within normal/positive levels; continue regular chat.",
        emotion=emotion
    )
