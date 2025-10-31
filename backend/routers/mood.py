from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timedelta
from collections import defaultdict
from pydantic import BaseModel # Import BaseModel for MoodTrendData

from database import get_db
from models.mood import MoodEntry, MoodEntryCreate, MoodEntryDB
from dependencies import get_current_user # Import get_current_user
from models.user import UserDB # Import UserDB

router = APIRouter()

# Helper function to convert List[str] to comma-separated string
def tags_to_str(tags: Optional[List[str]]) -> Optional[str]:
    return ",".join(tags) if tags else None

# Helper function to convert comma-separated string to List[str]
def str_to_tags(tags_str: Optional[str]) -> List[str]:
    return tags_str.split(",") if tags_str else []

# Pydantic model for MoodTrendData (similar to frontend type)
class MoodTrendData(BaseModel):
    date: str
    mood_score: float # Changed to float for average
    entry_count: int = 0  # Number of entries for this data point

@router.post("", status_code=status.HTTP_201_CREATED, response_model=MoodEntry)
def create_mood_entry(entry: MoodEntryCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Create a new mood entry.
    """
    db_entry = MoodEntryDB(
        user_id=current_user.id, # Use authenticated user's ID
        mood_score=entry.mood_score,
        note=entry.note,
        tags=tags_to_str(entry.tags)
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return MoodEntry(
        id=db_entry.id,
        user_id=db_entry.user_id,
        mood_score=db_entry.mood_score,
        note=db_entry.note,
        timestamp=db_entry.timestamp,
        tags=str_to_tags(db_entry.tags)
    )

@router.get("", response_model=List[MoodEntry])
def get_all_mood_entries(
    skip: int = 0,
    limit: int = 100,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get mood entries for the authenticated user with pagination.

    - skip: Number of entries to skip (for pagination). Default: 0
    - limit: Maximum number of entries to return. Default: 100, Max: 500
    """
    # Enforce maximum limit to prevent abuse
    if limit > 500:
        limit = 500

    db_entries = db.query(MoodEntryDB).filter(
        MoodEntryDB.user_id == current_user.id
    ).order_by(
        MoodEntryDB.timestamp.desc()  # Most recent first
    ).offset(skip).limit(limit).all()

    return [
        MoodEntry(
            id=entry.id,
            user_id=entry.user_id,
            mood_score=entry.mood_score,
            note=entry.note,
            timestamp=entry.timestamp,
            tags=str_to_tags(entry.tags)
        ) for entry in db_entries
    ]

# IMPORTANT: Static routes must come before dynamic routes to avoid conflicts
@router.get("/trend", response_model=List[MoodTrendData])
def get_mood_trend_data(
    range: str = "week",  # Note: shadows built-in range(), use builtin_range below
    start_date_param: Optional[str] = None,  # For custom range: YYYY-MM-DD
    end_date_param: Optional[str] = None,    # For custom range: YYYY-MM-DD
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated mood trend data for the authenticated user.
    Range can be 'today', 'week', 'month', or 'custom'.
    For custom range, provide start_date_param and end_date_param.
    """
    # Save reference to built-in range function
    builtin_range = __builtins__['range'] if isinstance(__builtins__, dict) else __builtins__.range

    if range not in ["today", "week", "month", "custom"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid range. Must be 'today', 'week', 'month', or 'custom'."
        )

    # Handle custom date range
    if range == "custom":
        if not start_date_param or not end_date_param:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom range requires start_date_param and end_date_param"
            )
        try:
            start_date = datetime.strptime(start_date_param, "%Y-%m-%d")
            end_date = datetime.strptime(end_date_param, "%Y-%m-%d")
            end_date = end_date.replace(hour=23, minute=59, second=59)
            days = (end_date - start_date).days + 1
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    elif range == "today":
        # Show entries from the last 2 days to handle timezone differences
        # This ensures we capture "today" in user's local time
        days = 2
        start_date = datetime.utcnow() - timedelta(days=1)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = datetime.utcnow()
    else:
        days = 7 if range == "week" else 30
        start_date = datetime.utcnow() - timedelta(days=days - 1)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = datetime.utcnow()

    db_entries = db.query(MoodEntryDB).filter(
        MoodEntryDB.user_id == current_user.id,
        MoodEntryDB.timestamp >= start_date,
        MoodEntryDB.timestamp <= end_date
    ).order_by(MoodEntryDB.timestamp).all()

    # For "today", return individual entries instead of daily averages
    if range == "today":
        trend_data = []
        for entry in db_entries:
            trend_data.append(MoodTrendData(
                date=entry.timestamp.strftime("%I:%M %p"),  # Format as time: "02:38 PM"
                mood_score=float(entry.mood_score),
                entry_count=1
            ))
        return trend_data

    # For other ranges, group by date and calculate averages
    grouped_by_date = defaultdict(lambda: {"total_score": 0, "count": 0})

    for entry in db_entries:
        date_key = entry.timestamp.strftime("%Y-%m-%d")
        grouped_by_date[date_key]["total_score"] += entry.mood_score
        grouped_by_date[date_key]["count"] += 1

    trend_data = []
    for i in builtin_range(days):
        current_date = start_date + timedelta(days=i)
        date_key = current_date.strftime("%Y-%m-%d")

        avg_score = 0
        count = grouped_by_date[date_key]["count"]
        if count > 0:
            avg_score = grouped_by_date[date_key]["total_score"] / count

        trend_data.append(MoodTrendData(
            date=current_date.strftime("%b %d"), # Format for frontend display
            mood_score=round(avg_score, 1),
            entry_count=count
        ))

    return trend_data

@router.get("/{entry_id}", response_model=MoodEntry)
def get_mood_entry(entry_id: str, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get a single mood entry by its ID.
    """
    db_entry = db.query(MoodEntryDB).filter(MoodEntryDB.id == entry_id, MoodEntryDB.user_id == current_user.id).first() # Filter by authenticated user's ID
    if not db_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mood entry not found")
    return MoodEntry(
        id=db_entry.id,
        user_id=db_entry.user_id,
        mood_score=db_entry.mood_score,
        note=db_entry.note,
        timestamp=db_entry.timestamp,
        tags=str_to_tags(db_entry.tags)
    )

@router.put("/{entry_id}", response_model=MoodEntry)
def update_mood_entry(entry_id: str, updated_entry: MoodEntryCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Update an existing mood entry.
    """
    db_entry = db.query(MoodEntryDB).filter(MoodEntryDB.id == entry_id, MoodEntryDB.user_id == current_user.id).first() # Filter by authenticated user's ID

    if not db_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mood entry not found")

    db_entry.mood_score = updated_entry.mood_score
    db_entry.note = updated_entry.note
    db_entry.tags = tags_to_str(updated_entry.tags)

    db.commit()
    db.refresh(db_entry)
    return MoodEntry(
        id=db_entry.id,
        user_id=db_entry.user_id,
        mood_score=db_entry.mood_score,
        note=db_entry.note,
        timestamp=db_entry.timestamp,
        tags=str_to_tags(db_entry.tags)
    )

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mood_entry(entry_id: str, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Delete a mood entry.
    """
    db_entry = db.query(MoodEntryDB).filter(MoodEntryDB.id == entry_id, MoodEntryDB.user_id == current_user.id).first() # Filter by authenticated user's ID

    if not db_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mood entry not found")

    db.delete(db_entry)
    db.commit()
    return