from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
import json

from database import get_db
from dependencies import get_current_user
from models.user import UserDB, UserType
from models.mood import MoodEntryDB
from services.openai_client import chat as llm_chat

router = APIRouter()

# Pydantic models for suggestions
class SuggestionCard(BaseModel):
    id: str
    title: str
    description: str
    category: str  # e.g., "breathing", "exercise", "mindfulness", "study_break"
    duration_minutes: int
    user_type_specific: bool

class SuggestionsResponse(BaseModel):
    suggestions: List[SuggestionCard]
    user_mood_summary: dict
    message: str

# Suggestion templates based on user type
STUDENT_SUGGESTIONS = [
    {
        "id": "student_1",
        "title": "5-Minute Study Break",
        "description": "Take a quick break with stretching exercises to refresh your mind before continuing your studies.",
        "category": "study_break",
        "duration_minutes": 5
    },
    {
        "id": "student_2",
        "title": "Exam Anxiety Relief",
        "description": "Practice box breathing: Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 5 times.",
        "category": "breathing",
        "duration_minutes": 3
    },
    {
        "id": "student_3",
        "title": "Pomodoro Technique",
        "description": "Study for 25 minutes, then take a 5-minute break. This helps maintain focus and reduces burnout.",
        "category": "study_break",
        "duration_minutes": 30
    },
    {
        "id": "student_4",
        "title": "Quick Campus Walk",
        "description": "Take a 10-minute walk around campus or your study area to clear your mind and boost concentration.",
        "category": "exercise",
        "duration_minutes": 10
    }
]

PROFESSIONAL_SUGGESTIONS = [
    {
        "id": "prof_1",
        "title": "Desk Stretches",
        "description": "Reduce work tension with simple desk stretches: neck rolls, shoulder shrugs, and wrist circles.",
        "category": "exercise",
        "duration_minutes": 5
    },
    {
        "id": "prof_2",
        "title": "Workplace Mindfulness",
        "description": "Practice a 3-minute mindfulness exercise at your desk. Focus on your breath and let go of work stress.",
        "category": "mindfulness",
        "duration_minutes": 3
    },
    {
        "id": "prof_3",
        "title": "Power Lunch Break",
        "description": "Step away from your desk for lunch. Eat mindfully without checking emails or messages.",
        "category": "break",
        "duration_minutes": 30
    },
    {
        "id": "prof_4",
        "title": "End-of-Day Reset",
        "description": "Before leaving work, spend 5 minutes planning tomorrow's priorities and mentally closing today's tasks.",
        "category": "planning",
        "duration_minutes": 5
    }
]

PREGNANT_SUGGESTIONS = [
    {
        "id": "preg_1",
        "title": "Prenatal Breathing",
        "description": "Gentle breathing exercise safe for pregnancy. Sit comfortably and breathe deeply for relaxation.",
        "category": "breathing",
        "duration_minutes": 5
    },
    {
        "id": "preg_2",
        "title": "Pregnancy Affirmations",
        "description": "Read positive affirmations about pregnancy, birth, and motherhood. Focus on your strength and capability.",
        "category": "mindfulness",
        "duration_minutes": 5
    },
    {
        "id": "preg_3",
        "title": "Gentle Prenatal Yoga",
        "description": "Try gentle stretches designed for pregnant women. Focus on hip openers and pelvic floor exercises.",
        "category": "exercise",
        "duration_minutes": 15
    },
    {
        "id": "preg_4",
        "title": "Connect with Baby",
        "description": "Spend quiet time feeling your baby's movements. Practice bonding and visualization of meeting your baby.",
        "category": "bonding",
        "duration_minutes": 10
    }
]

GENERAL_SUGGESTIONS = [
    {
        "id": "gen_1",
        "title": "Deep Breathing Exercise",
        "description": "Practice deep breathing for 5 minutes to reduce stress and anxiety.",
        "category": "breathing",
        "duration_minutes": 5
    },
    {
        "id": "gen_2",
        "title": "Gratitude Journaling",
        "description": "Write down 3 things you're grateful for today. This helps shift focus to positive aspects of life.",
        "category": "mindfulness",
        "duration_minutes": 5
    },
    {
        "id": "gen_3",
        "title": "Short Walk",
        "description": "Take a 10-minute walk outside. Fresh air and movement can significantly improve mood.",
        "category": "exercise",
        "duration_minutes": 10
    }
]

def get_suggestions_for_user_type(user_type: UserType) -> List[dict]:
    """Get suggestion templates based on user type"""
    if user_type == UserType.STUDENT:
        return STUDENT_SUGGESTIONS
    elif user_type == UserType.YOUNG_PROFESSIONAL:
        return PROFESSIONAL_SUGGESTIONS
    elif user_type == UserType.PREGNANT_WOMAN:
        return PREGNANT_SUGGESTIONS
    else:
        return GENERAL_SUGGESTIONS

def analyze_mood_trend(entries: List[MoodEntryDB]) -> dict:
    """Analyze user's recent mood entries"""
    if not entries:
        return {
            "average_mood": 0,
            "trend": "unknown",
            "entry_count": 0
        }

    mood_scores = [entry.mood_score for entry in entries]
    avg_mood = sum(mood_scores) / len(mood_scores)

    # Determine trend (simple: compare first half vs second half)
    if len(mood_scores) >= 4:
        mid = len(mood_scores) // 2
        first_half_avg = sum(mood_scores[:mid]) / mid
        second_half_avg = sum(mood_scores[mid:]) / (len(mood_scores) - mid)

        if second_half_avg > first_half_avg + 1:
            trend = "improving"
        elif second_half_avg < first_half_avg - 1:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"

    return {
        "average_mood": round(avg_mood, 1),
        "trend": trend,
        "entry_count": len(mood_scores),
        "recent_scores": mood_scores[-5:]  # Last 5 scores
    }

def select_personalized_suggestions(
    user_type: UserType,
    mood_summary: dict
) -> List[SuggestionCard]:
    """Select 1-3 suggestions based on user type and mood"""

    all_suggestions = get_suggestions_for_user_type(user_type)
    selected = []

    avg_mood = mood_summary.get("average_mood", 5)
    trend = mood_summary.get("trend", "stable")

    # Logic for selecting suggestions based on mood
    if avg_mood < 4 or trend == "declining":
        # User is feeling low, prioritize breathing and mindfulness
        priority_categories = ["breathing", "mindfulness"]
    elif avg_mood >= 7:
        # User is feeling good, suggest exercise or proactive activities
        priority_categories = ["exercise", "break", "study_break"]
    else:
        # Balanced mood, mix of activities
        priority_categories = ["mindfulness", "exercise", "breathing"]

    # Select suggestions matching priority categories
    for category in priority_categories:
        matching = [s for s in all_suggestions if s["category"] == category and s not in selected]
        if matching:
            selected.append(matching[0])
        if len(selected) >= 3:
            break

    # If we don't have 3 yet, add random ones
    while len(selected) < 3 and len(selected) < len(all_suggestions):
        for suggestion in all_suggestions:
            if suggestion not in selected:
                selected.append(suggestion)
                break

    # Convert to SuggestionCard objects
    cards = []
    for s in selected[:3]:  # Maximum 3 suggestions
        cards.append(SuggestionCard(
            id=s["id"],
            title=s["title"],
            description=s["description"],
            category=s["category"],
            duration_minutes=s["duration_minutes"],
            user_type_specific=(user_type != UserType.GENERAL)
        ))

    return cards

@router.get("", response_model=SuggestionsResponse)
def get_personalized_suggestions(
    time_range: str = "week",
    start_date: str = None,
    end_date: str = None,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized suggestions based on user type and recent mood entries.

    Args:
        time_range: 'today', 'week', 'month', or 'custom'
        start_date: For custom range (YYYY-MM-DD format)
        end_date: For custom range (YYYY-MM-DD format)
    """

    # Calculate date range based on time_range parameter
    if time_range == "today":
        start_datetime = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == "month":
        start_datetime = datetime.utcnow() - timedelta(days=30)
    elif time_range == "custom" and start_date and end_date:
        try:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            start_datetime = datetime.utcnow() - timedelta(days=14)
    else:  # default to 'week' (14 days)
        start_datetime = datetime.utcnow() - timedelta(days=14)

    # Get recent mood entries based on time range
    recent_entries = db.query(MoodEntryDB).filter(
        MoodEntryDB.user_id == current_user.id,
        MoodEntryDB.timestamp >= start_datetime
    ).order_by(MoodEntryDB.timestamp.desc()).all()

    # Analyze mood trend
    mood_summary = analyze_mood_trend(recent_entries)

    # Generate message based on data availability
    if len(recent_entries) < 3:
        message = "Not enough data for personalized suggestions. Log at least 3 mood entries to get better recommendations."
    else:
        if mood_summary["trend"] == "improving":
            message = "Great! Your mood has been improving recently. Keep up the good work!"
        elif mood_summary["trend"] == "declining":
            message = "We've noticed your mood has been lower recently. These suggestions might help."
        else:
            message = "Here are some personalized suggestions to support your mental wellbeing."

    # Get user type from database
    user_type = UserType(current_user.user_type) if current_user.user_type else UserType.GENERAL

    # Select personalized suggestions
    suggestions = select_personalized_suggestions(user_type, mood_summary)

    return SuggestionsResponse(
        suggestions=suggestions,
        user_mood_summary=mood_summary,
        message=message
    )

@router.post("/complete/{suggestion_id}")
def complete_suggestion(
    suggestion_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a suggestion as completed.
    In a full implementation, this would track user preferences.
    """
    # TODO: Store completion data for learning user preferences
    return {
        "message": "Suggestion completed successfully!",
        "suggestion_id": suggestion_id
    }

@router.post("/skip/{suggestion_id}")
def skip_suggestion(
    suggestion_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Skip a suggestion.
    In a full implementation, this would adjust future recommendations.
    """
    # TODO: Store skip data for learning user preferences
    return {
        "message": "Suggestion skipped",
        "suggestion_id": suggestion_id
    }


@router.post("/generate-ai", response_model=SuggestionsResponse)
async def generate_ai_suggestions(
    time_range: str = "week",
    start_date: str = None,
    end_date: str = None,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate personalized suggestions using AI based on user type and mood history.
    This provides more dynamic and contextual suggestions than the template-based approach.

    Args:
        time_range: 'today', 'week', 'month', or 'custom'
        start_date: For custom range (YYYY-MM-DD format)
        end_date: For custom range (YYYY-MM-DD format)
    """
    # Calculate date range based on time_range parameter
    if time_range == "today":
        cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == "month":
        cutoff_date = datetime.utcnow() - timedelta(days=30)
    elif time_range == "custom" and start_date and end_date:
        try:
            cutoff_date = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            cutoff_date = datetime.utcnow() - timedelta(days=14)
    else:  # default to 'week'
        cutoff_date = datetime.utcnow() - timedelta(days=14)

    # Get user's recent mood entries based on time range
    recent_entries = db.query(MoodEntryDB).filter(
        MoodEntryDB.user_id == current_user.id,
        MoodEntryDB.timestamp >= cutoff_date
    ).order_by(MoodEntryDB.timestamp.desc()).all()

    # Analyze mood trend
    mood_summary = analyze_mood_trend(recent_entries)

    # Build context for AI
    user_type_labels = {
        "student": "a student dealing with academic pressures",
        "young_professional": "a young professional managing work-life balance",
        "pregnant_woman": "a pregnant woman experiencing prenatal journey",
        "general": "someone seeking mental health support"
    }

    user_context = user_type_labels.get(current_user.user_type, user_type_labels["general"])

    mood_context = ""
    if mood_summary["entry_count"] >= 3:
        mood_context = f"Their recent mood trend is {mood_summary['trend']} with an average mood score of {mood_summary['average_mood']:.1f}/10. "
        if mood_summary["trend"] == "declining":
            mood_context += "They seem to be struggling lately and need extra support. "
        elif mood_summary["trend"] == "improving":
            mood_context += "They're showing positive progress and could benefit from reinforcing activities. "
    else:
        mood_context = "They're just starting to track their mood and need gentle, accessible activities. "

    # Create AI prompt
    system_prompt = {
        "role": "system",
        "content": (
            "You are a mental health companion AI specialized in providing personalized wellness suggestions. "
            "Generate 3 specific, actionable wellness activities tailored to the user's situation. "
            "Each suggestion should be practical, safe, and take 3-15 minutes. "
            "Return ONLY a valid JSON array with this exact structure, no other text:\n"
            "[\n"
            '  {"title": "Activity Name", "description": "Clear description", "category": "breathing|mindfulness|exercise|break|planning", "duration_minutes": 5},\n'
            '  {"title": "...", "description": "...", "category": "...", "duration_minutes": ...},\n'
            '  {"title": "...", "description": "...", "category": "...", "duration_minutes": ...}\n'
            "]"
        )
    }

    user_prompt = {
        "role": "user",
        "content": (
            f"Generate 3 personalized wellness suggestions for {user_context}. "
            f"{mood_context}"
            f"Make them specific to their situation, practical, and immediately actionable. "
            f"Ensure activities are appropriate and safe for their circumstances."
        )
    }

    try:
        # Call AI
        ai_response = await llm_chat([system_prompt, user_prompt], temperature=0.7)

        # Parse AI response
        try:
            # Extract JSON from response (in case AI adds extra text)
            json_start = ai_response.find('[')
            json_end = ai_response.rfind(']') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = ai_response[json_start:json_end]
                ai_suggestions_raw = json.loads(json_str)
            else:
                raise ValueError("No JSON array found in AI response")

            # Convert to SuggestionCard format
            suggestions = []
            for idx, sugg in enumerate(ai_suggestions_raw[:3]):  # Limit to 3
                suggestions.append(SuggestionCard(
                    id=f"ai_{current_user.id}_{datetime.utcnow().timestamp()}_{idx}",
                    title=sugg.get("title", "Wellness Activity"),
                    description=sugg.get("description", "Take a moment for self-care"),
                    category=sugg.get("category", "mindfulness"),
                    duration_minutes=sugg.get("duration_minutes", 5),
                    user_type_specific=True
                ))

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"[AI Suggestions] Failed to parse AI response: {e}")
            print(f"[AI Suggestions] Raw response: {ai_response}")
            # Fallback to template-based suggestions
            return get_personalized_suggestions(current_user, db)

        message = f"AI generated {len(suggestions)} personalized suggestions based on your profile and recent mood!"

        return SuggestionsResponse(
            suggestions=suggestions,
            user_mood_summary=mood_summary,
            message=message
        )

    except Exception as e:
        print(f"[AI Suggestions] Error generating AI suggestions: {e}")
        # Fallback to template-based suggestions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate AI suggestions. Please try the regular suggestions instead."
        )
