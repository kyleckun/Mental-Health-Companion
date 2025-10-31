from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime # Import datetime for created_at and updated_at
import re
from models.user import UserType

class UserRegister(BaseModel):
    """Pydantic model for user registration request."""
    username: str = Field(..., min_length=3, max_length=50, description="Unique username for the user.")
    email: Optional[str] = Field(None, description="Optional email address for the user.")
    password: str = Field(..., min_length=6, max_length=50, description="Password for the user (min 6 characters).")
    user_type: Optional[UserType] = Field(UserType.GENERAL, description="Type of user: student, young_professional, pregnant_woman, or general.")

    @validator('username')
    def validate_username(cls, v):
        """Validate username format: only alphanumeric and underscore."""
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores.')
        return v

    @validator('email')
    def validate_email_format(cls, v):
        """Validate email format."""
        if v is not None:
            if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', v):
                raise ValueError('Invalid email format.')
        return v

    @validator('password')
    def validate_password_strength(cls, v):
        """Enforce password strength: must contain letters and numbers."""
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long.')
        if len(v) > 50:
            raise ValueError('Password must not exceed 50 characters.')
        if not re.search(r'[a-zA-Z]', v):
            raise ValueError('Password must contain at least one letter.')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number.')
        return v

class UserLogin(BaseModel):
    """Pydantic model for user login request."""
    username: str = Field(..., description="Username of the user.")
    password: str = Field(..., description="Password of the user.")

class Token(BaseModel):
    """Pydantic model for JWT token response."""
    access_token: str = Field(..., description="The JWT access token.")
    token_type: str = Field("bearer", description="Type of the token, usually 'bearer'.")

class TokenResponse(BaseModel):
    """Pydantic model for complete login response (token + user info)."""
    access_token: str = Field(..., description="The JWT access token.")
    token_type: str = Field("bearer", description="Type of the token, usually 'bearer'.")
    user: 'UserResponse' = Field(..., description="User information.")

    class Config:
        from_attributes = True  # Pydantic v2

class UserResponse(BaseModel):
    """Pydantic model for user data response (excluding sensitive info like password hash)."""
    id: str = Field(..., description="Unique ID of the user.")
    username: str = Field(..., description="Username of the user.")
    email: Optional[str] = Field(None, description="Email address of the user.")
    user_type: str = Field(..., description="Type of user.")
    created_at: datetime # Assuming created_at will be part of the UserDB model
    updated_at: datetime # Assuming updated_at will be part of the UserDB model

    class Config:
        from_attributes = True  # Pydantic v2 - Enable ORM mode to read from SQLAlchemy models