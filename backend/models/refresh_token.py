"""Refresh Token Database Model"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid

from database import Base


class RefreshTokenDB(Base):
    """
    Refresh Token Model for JWT token refresh mechanism

    Security Features:
    - Tokens are hashed before storage (never store plain tokens!)
    - Automatic expiration after configured days
    - Can be revoked manually
    - Tied to specific user for validation
    """

    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_revoked = Column(Boolean, default=False, index=True)
    revoked_at = Column(DateTime, nullable=True)

    # Device/client information (optional but useful)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 support

    # Relationship
    user = relationship("UserDB", back_populates="refresh_tokens")

    @property
    def is_expired(self) -> bool:
        """Check if token is expired"""
        return datetime.utcnow() > self.expires_at

    @property
    def is_valid(self) -> bool:
        """Check if token is valid (not expired and not revoked)"""
        return not self.is_expired and not self.is_revoked

    def revoke(self):
        """Revoke this token"""
        self.is_revoked = True
        self.revoked_at = datetime.utcnow()

    def __repr__(self):
        return (
            f"<RefreshToken(id={self.id}, user_id={self.user_id}, "
            f"expires_at={self.expires_at}, is_revoked={self.is_revoked})>"
        )
