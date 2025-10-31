from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid
from enum import Enum

from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base # Import Base from database.py

from passlib.context import CryptContext # For password hashing

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User type enumeration
class UserType(str, Enum):
    STUDENT = "student"
    YOUNG_PROFESSIONAL = "young_professional"
    PREGNANT_WOMAN = "pregnant_woman"
    GENERAL = "general"  # Default type

# SQLAlchemy model for database interaction
class UserDB(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    user_type = Column(String, default=UserType.GENERAL.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    mood_entries = relationship("MoodEntryDB", back_populates="owner")
    refresh_tokens = relationship("RefreshTokenDB", back_populates="user", cascade="all, delete-orphan")
    # MODIFICATION: Add relationship to EmergencyContactDB
    emergency_contacts = relationship("EmergencyContactDB", back_populates="user", cascade="all, delete-orphan")

    def verify_password(self, plain_password):
        return pwd_context.verify(plain_password, self.hashed_password)

    def get_password_hash(self, password):
        return pwd_context.hash(password)

# Pydantic models for API request/response
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = None
    user_type: Optional[UserType] = UserType.GENERAL

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserInDB(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True