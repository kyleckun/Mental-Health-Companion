from models.message import EmotionResult, AgentDecision

# 高风险情绪标签
HIGH_RISK_LABELS = {"sadness", "stress", "anger"}

# 阈值（可调节以符合 Demo 效果）
CRISIS_THRESHOLD = 0.85     # ≥ 0.85 → 升级危机干预
SUPPORT_THRESHOLD = 0.55    # ≥ 0.55 → 给支持建议

def decide(emotion: EmotionResult) -> AgentDecision:
    """
    根据情绪分析结果，决定下一步系统行为：
    - normal_reply：正常聊天
    - support_suggestion：提供情绪支持建议
    - crisis_flow：触发 UC-001 危机干预流程
    """

    # 情绪非常严重 → 危机干预（UC-001）
    if emotion.label in HIGH_RISK_LABELS and emotion.intensity >= CRISIS_THRESHOLD:
        return AgentDecision(
            next_action="crisis_flow",
            reason="High-risk emotional state detected; escalate to crisis support (UC-001).",
            emotion=emotion,
            metadata={"escalation": "UC-001"}
        )

    # 情绪偏负面但未到危机 → 给支持建议
    if emotion.label in HIGH_RISK_LABELS and emotion.intensity >= SUPPORT_THRESHOLD:
        return AgentDecision(
            next_action="support_suggestion",
            reason="Negative emotion detected; provide coping strategies.",
            emotion=emotion,
            metadata={"suggestions": "breathing, grounding_54321, journaling"}
        )

    # 情绪正常 → 继续正常聊天
    return AgentDecision(
        next_action="normal_reply",
        reason="Emotion within normal/positive levels; continue regular chat.",
        emotion=emotion
    )
