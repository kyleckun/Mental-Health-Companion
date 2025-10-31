import os # Import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from database import get_db
from models.user import UserDB, UserType
from schemas.auth import UserRegister, UserLogin, Token, TokenResponse, UserResponse
from services.auth_service import hash_password, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from dependencies import get_current_user
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()


class UserUpdateRequest(BaseModel):
    """Request model for updating user profile"""
    email: Optional[str] = Field(None, description="Updated email address")
    user_type: Optional[UserType] = Field(None, description="Updated user type")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.username == user_data.username).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")

    hashed_password = hash_password(user_data.password)
    db_user = UserDB(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        user_type=user_data.user_type.value if user_data.user_type else "general"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserResponse.from_orm(db_user)

@router.post("/login", response_model=TokenResponse)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Fetch user from database
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()

    # SECURITY FIX: Always perform password verification to prevent timing attacks
    # Even if user doesn't exist, we hash a dummy password to consume similar time
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user:
        # Hash a dummy password to prevent timing attack (consumes ~100-300ms like real verification)
        verify_password(form_data.password, "$2b$12$dummy_hash_to_prevent_timing_attack_1234567890abcdefgh")
        raise credentials_exception

    # Verify the actual password
    if not verify_password(form_data.password, user.hashed_password):
        raise credentials_exception

    # Generate access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Return token with user information
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserDB = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    update_data: UserUpdateRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile information"""
    # Update email if provided
    if update_data.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(UserDB).filter(
            UserDB.email == update_data.email,
            UserDB.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use by another account"
            )
        current_user.email = update_data.email

    # Update user_type if provided
    if update_data.user_type is not None:
        current_user.user_type = update_data.user_type.value

    db.commit()
    db.refresh(current_user)

    return UserResponse.from_orm(current_user)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout_user(current_user: UserDB = Depends(get_current_user)):
    # For JWT, logout is typically handled client-side by discarding the token.
    # Here, we just ensure the token is valid.
    return {"message": "Successfully logged out (token discarded client-side)."}
