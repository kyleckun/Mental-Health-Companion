"""Database Model and Pydantic Schemas for Emergency Contact."""

from sqlalchemy import Column, String, ForeignKey, Index
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
import uuid
from typing import Optional

from database import Base # Import SQLAlchemy Base

# SQLAlchemy Model
class EmergencyContactDB(Base):
    __tablename__ = "emergency_contacts"

    # Use UUID as primary key for consistency
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    # Foreign key to users table with cascade delete
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    # Phone number (consider encryption in production)
    phone_number = Column(String(20), nullable=False)
    # Optional relationship type
    relationship_type = Column(String(50), nullable=True)

    # Relationship back to UserDB
    user = relationship("UserDB", back_populates="emergency_contacts")

    # Composite Index: Ensure unique phone number per user
    __table_args__ = (
        Index('ix_unique_user_phone', 'user_id', 'phone_number', unique=True),
    )

# Pydantic Schemas for API

class EmergencyContactBase(BaseModel):
    # Use Field alias for frontend camelCase compatibility
    name: str = Field(..., max_length=100)
    phone_number: str = Field(..., alias='phoneNumber', max_length=20)
    relationship_type: Optional[str] = Field(None, alias='relationshipType', max_length=50)

    class Config:
        # Allows assignment by either alias or field name
        populate_by_name = True

class EmergencyContactCreate(EmergencyContactBase):
    pass

class EmergencyContactResponse(EmergencyContactBase):
    id: str
    user_id: str = Field(..., alias='userId')

    class Config:
        # Enable ORM mode to read from SQLAlchemy model
        from_attributes = True
        populate_by_name = True