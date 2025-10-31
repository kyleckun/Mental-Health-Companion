"""
Authentication Service with Refresh Token Support
Handles JWT token generation, validation, and refresh mechanism
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
import secrets
import hashlib

from jose import JWTError, jwt
from sqlalchemy.orm import Session

# Import unified configuration and logger
from config import settings
from logger import get_logger, log_security_event
from models.refresh_token import RefreshTokenDB

# Setup logger
logger = get_logger(__name__)

# Note: Removed bcrypt due to initialization issues, using hashlib instead

# JWT settings from unified config
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS


# ==================== Password Hashing ====================

def hash_password(password: str) -> str:
    """
    Hash a plain password using PBKDF2-HMAC-SHA256

    This is secure and avoids bcrypt installation/initialization issues.
    PBKDF2 is recommended by NIST and used by Django, Werkzeug, etc.

    Args:
        password: Plain text password

    Returns:
        str: Hashed password in format "salt$hash"
    """
    # Generate random salt (32 characters)
    salt = secrets.token_hex(16)

    # Hash password using PBKDF2-HMAC with SHA256
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000  # 100,000 iterations (NIST recommendation)
    )

    # Return salt + hash
    return f"{salt}${pwd_hash.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against

    Returns:
        bool: True if password matches, False otherwise
    """
    try:
        # Split salt and hash
        salt, pwd_hash = hashed_password.split('$')

        # Hash the provided password with the same salt
        new_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )

        # Constant-time comparison to prevent timing attacks
        return secrets.compare_digest(new_hash.hex(), pwd_hash)
    except Exception:
        return False


# ==================== Access Token (JWT) ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token

    Args:
        data: Payload data to encode in token
        expires_delta: Optional custom expiration time

    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),  # Issued at
        "type": "access"  # Token type
    })

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    logger.debug(
        f"Access token created for user: {data.get('sub')}",
        extra={"user": data.get("sub"), "expires_at": expire.isoformat()}
    )

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT access token

    Args:
        token: JWT token string

    Returns:
        dict: Token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Validate token type
        if payload.get("type") != "access":
            logger.warning("Invalid token type", extra={"type": payload.get("type")})
            return None

        return payload

    except jwt.ExpiredSignatureError:
        logger.info("Access token expired")
        return None
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None


# ==================== Refresh Token ====================

def hash_refresh_token(token: str) -> str:
    """
    Hash a refresh token before storing in database
    Uses SHA-256 for fast hashing (not bcrypt, as we don't need slow hashing for tokens)

    Args:
        token: Plain refresh token

    Returns:
        str: Hashed token
    """
    return hashlib.sha256(token.encode()).hexdigest()


def generate_refresh_token() -> str:
    """
    Generate a cryptographically secure random refresh token

    Returns:
        str: Random token string (URL-safe)
    """
    return secrets.token_urlsafe(64)


def create_refresh_token(
    user_id: str,
    db: Session,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Tuple[str, RefreshTokenDB]:
    """
    Create and store a refresh token in database

    Args:
        user_id: User ID to associate token with
        db: Database session
        user_agent: Optional user agent string
        ip_address: Optional client IP address

    Returns:
        Tuple[str, RefreshTokenDB]: (plain_token, db_record)
    """
    # Generate random token
    plain_token = generate_refresh_token()

    # Hash token for storage
    token_hash = hash_refresh_token(plain_token)

    # Calculate expiration
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    # Create database record
    db_token = RefreshTokenDB(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address
    )

    db.add(db_token)
    db.commit()
    db.refresh(db_token)

    logger.info(
        f"Refresh token created for user: {user_id}",
        extra={
            "user_id": user_id,
            "token_id": db_token.id,
            "expires_at": expires_at.isoformat(),
            "ip_address": ip_address
        }
    )

    return plain_token, db_token


def verify_refresh_token(token: str, db: Session) -> Optional[RefreshTokenDB]:
    """
    Verify a refresh token and return the database record

    Args:
        token: Plain refresh token to verify
        db: Database session

    Returns:
        RefreshTokenDB: Token record if valid, None otherwise
    """
    # Hash the token to compare with database
    token_hash = hash_refresh_token(token)

    # Query database
    db_token = db.query(RefreshTokenDB).filter(
        RefreshTokenDB.token_hash == token_hash
    ).first()

    if not db_token:
        logger.warning("Refresh token not found")
        return None

    # Check if token is valid
    if not db_token.is_valid:
        if db_token.is_expired:
            logger.info(f"Refresh token expired: {db_token.id}")
        if db_token.is_revoked:
            logger.warning(f"Refresh token revoked: {db_token.id}")
            log_security_event(
                logger,
                event_type="revoked_token_used",
                user_id=db_token.user_id,
                token_id=db_token.id
            )
        return None

    logger.info(f"Refresh token validated: {db_token.id}", extra={"user_id": db_token.user_id})
    return db_token


def revoke_refresh_token(token: str, db: Session) -> bool:
    """
    Revoke a refresh token

    Args:
        token: Plain refresh token to revoke
        db: Database session

    Returns:
        bool: True if revoked, False if not found
    """
    token_hash = hash_refresh_token(token)

    db_token = db.query(RefreshTokenDB).filter(
        RefreshTokenDB.token_hash == token_hash
    ).first()

    if db_token:
        db_token.revoke()
        db.commit()

        logger.info(
            f"Refresh token revoked: {db_token.id}",
            extra={"user_id": db_token.user_id, "token_id": db_token.id}
        )
        return True

    logger.warning("Cannot revoke: Refresh token not found")
    return False


def revoke_all_user_tokens(user_id: str, db: Session) -> int:
    """
    Revoke all refresh tokens for a user (e.g., on password change or logout from all devices)

    Args:
        user_id: User ID
        db: Database session

    Returns:
        int: Number of tokens revoked
    """
    tokens = db.query(RefreshTokenDB).filter(
        RefreshTokenDB.user_id == user_id,
        RefreshTokenDB.is_revoked == False
    ).all()

    count = 0
    for token in tokens:
        token.revoke()
        count += 1

    db.commit()

    logger.info(
        f"Revoked all tokens for user: {user_id}",
        extra={"user_id": user_id, "tokens_revoked": count}
    )

    log_security_event(logger, event_type="revoke_all_tokens", user_id=user_id, count=count)

    return count


def cleanup_expired_tokens(db: Session) -> int:
    """
    Clean up expired refresh tokens from database
    Should be run periodically (e.g., daily cron job)

    Args:
        db: Database session

    Returns:
        int: Number of tokens deleted
    """
    expired_tokens = db.query(RefreshTokenDB).filter(
        RefreshTokenDB.expires_at < datetime.utcnow()
    ).all()

    count = len(expired_tokens)

    for token in expired_tokens:
        db.delete(token)

    db.commit()

    logger.info(f"Cleaned up {count} expired tokens")

    return count


def create_token_pair(
    user_id: str,
    username: str,
    db: Session,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None
) -> dict:
    """
    Create both access and refresh tokens

    Args:
        user_id: User ID
        username: Username
        db: Database session
        user_agent: Optional user agent
        ip_address: Optional IP address

    Returns:
        dict: Dictionary with access_token, refresh_token, token_type, expires_in
    """
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username, "user_id": user_id},
        expires_delta=access_token_expires
    )

    # Create refresh token
    refresh_token, _ = create_refresh_token(
        user_id=user_id,
        db=db,
        user_agent=user_agent,
        ip_address=ip_address
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        "refresh_expires_in": REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60  # Convert to seconds
    }


if __name__ == "__main__":
    # Test authentication functions
    print("=== Authentication Service Test ===\n")

    # Test password hashing
    password = "Test123!@#"
    hashed = hash_password(password)
    print(f"Password: {password}")
    print(f"Hashed: {hashed}")
    print(f"Verification: {verify_password(password, hashed)}")
    print(f"Wrong password: {verify_password('wrong', hashed)}\n")

    # Test access token
    print("=== Access Token Test ===")
    token_data = {"sub": "testuser", "user_id": "123"}
    access_token = create_access_token(token_data)
    print(f"Access Token: {access_token[:50]}...")
    decoded = decode_access_token(access_token)
    print(f"Decoded: {decoded}\n")

    # Test refresh token generation
    print("=== Refresh Token Test ===")
    refresh_token = generate_refresh_token()
    print(f"Refresh Token: {refresh_token[:50]}...")
    token_hash = hash_refresh_token(refresh_token)
    print(f"Token Hash: {token_hash}")
    print(f"Hash verification: {token_hash == hash_refresh_token(refresh_token)}\n")

    print("[OK] Authentication service test completed!")
