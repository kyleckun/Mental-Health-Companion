# backend/routers/emergency_contacts.py (New File)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from dependencies import get_current_user
from models.user import UserDB
from models.emergency_contact import (
    EmergencyContactDB,
    EmergencyContactCreate,
    EmergencyContactResponse
)

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=EmergencyContactResponse)
def create_contact(
        contact_data: EmergencyContactCreate,
        current_user: UserDB = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Create a new emergency contact for the authenticated user.
    """

    # Create ORM instance from validated Pydantic data
    db_contact = EmergencyContactDB(
        user_id=current_user.id,
        name=contact_data.name,
        phone_number=contact_data.phone_number,
        relationship_type=contact_data.relationship_type
    )

    try:
        db.add(db_contact)
        db.commit()
        db.refresh(db_contact)
    except Exception:
        db.rollback()
        # Handle UNIQUE constraint violation (user_id + phone_number)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact with this phone number already exists for this user."
        )

    # Return Pydantic response model
    return EmergencyContactResponse.model_validate(db_contact)


@router.get("", response_model=List[EmergencyContactResponse])
def get_contacts(
        current_user: UserDB = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get all emergency contacts for the authenticated user.
    """
    contacts = db.query(EmergencyContactDB).filter(
        EmergencyContactDB.user_id == current_user.id
    ).all()

    # Map ORM objects to Pydantic response models
    return [EmergencyContactResponse.model_validate(c) for c in contacts]


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
        contact_id: str,
        current_user: UserDB = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Delete an emergency contact by ID.
    """
    db_contact = db.query(EmergencyContactDB).filter(
        EmergencyContactDB.id == contact_id,
        EmergencyContactDB.user_id == current_user.id  # Security check: ensure user owns the contact
    ).first()

    if not db_contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found.")

    db.delete(db_contact)
    db.commit()
    # Return 204 No Content response