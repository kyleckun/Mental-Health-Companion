from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base # Import Base from database.py

# SQLAlchemy model for database interaction
class MoodEntryDB(Base):
    __tablename__ = "mood_entries"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True) # Foreign key to users table
    mood_score = Column(Integer)
    note = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)  # Add index for timestamp
    # Tags would typically be a separate many-to-many relationship,
    # but for simplicity, we'll store them as a comma-separated string for now.
    tags = Column(String, nullable=True)

    owner = relationship("UserDB", back_populates="mood_entries") # Relationship to UserDB

    # Composite index for common queries (user_id + timestamp)
    __table_args__ = (
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
    )

# Pydantic models for API request/response
class MoodEntryBase(BaseModel):
    mood_score: int = Field(..., ge=1, le=10, alias='moodScore')
    note: Optional[str] = None
    tags: Optional[List[str]] = None

    class Config:
        populate_by_name = True  # Allow both mood_score and moodScore

class MoodEntryCreate(MoodEntryBase):
    pass

class MoodEntry(MoodEntryBase):
    id: str
    user_id: str
    timestamp: datetime

    class Config:
        from_attributes = True  # Pydantic v2 - Enable ORM mode
        populate_by_name = True  # Allow both naming styles
