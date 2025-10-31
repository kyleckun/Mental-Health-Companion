"""
Unified Configuration Management for Mental Health Companion
Uses Pydantic Settings for type-safe environment variable handling
"""

import os
from typing import Optional, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, validator
import secrets


class Settings(BaseSettings):
    """
    Application Settings with validation and type safety
    All settings can be overridden via environment variables
    """

    # === Feature Flags (MUST BE FIRST for validators to work!) ===
    ENABLE_MOCK_MODE: bool = Field(
        default=False,
        description="Enable mock mode for testing without OpenAI"
    )

    # === Application Settings ===
    APP_NAME: str = "Mental Health Companion"
    APP_VERSION: str = "2.0.0"
    APP_ENV: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Application environment"
    )
    DEBUG: bool = Field(
        default=False,
        description="Enable debug mode (never use in production!)"
    )

    # === API Settings ===
    API_HOST: str = Field(default="0.0.0.0", description="API host")
    API_PORT: int = Field(default=8000, description="API port")
    API_PREFIX: str = Field(default="/api", description="API route prefix")

    # === Security Settings ===
    SECRET_KEY: str = Field(
        ...,  # Required field
        min_length=32,
        description="JWT signing secret key (REQUIRED, min 32 chars)"
    )
    ALGORITHM: str = Field(
        default="HS256",
        description="JWT signing algorithm"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        ge=5,
        le=120,
        description="Access token expiration time (5-120 minutes)"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        ge=1,
        le=30,
        description="Refresh token expiration time (1-30 days)"
    )

    # === Database Settings ===
    DATABASE_URL: str = Field(
        default="sqlite:///./test.db",
        description="Database connection URL"
    )
    DB_POOL_SIZE: int = Field(
        default=20,
        ge=5,
        le=100,
        description="Database connection pool size"
    )
    DB_MAX_OVERFLOW: int = Field(
        default=40,
        ge=10,
        le=200,
        description="Maximum overflow connections"
    )
    DB_POOL_TIMEOUT: int = Field(
        default=30,
        ge=10,
        le=120,
        description="Connection pool timeout (seconds)"
    )
    DB_POOL_RECYCLE: int = Field(
        default=3600,
        ge=300,
        le=7200,
        description="Connection recycle time (seconds)"
    )
    DB_ECHO: bool = Field(
        default=False,
        description="Echo SQL queries (development only)"
    )

    # === OpenAI Settings ===
    OPENAI_API_KEY: str = Field(
        default="sk-mock-key-for-testing",  # Default for mock mode
        min_length=20,
        description="OpenAI API key (REQUIRED unless ENABLE_MOCK_MODE=true)"
    )
    OPENAI_MODEL: str = Field(
        default="gpt-4o-mini",
        description="OpenAI model to use"
    )
    OPENAI_TIMEOUT: int = Field(
        default=60,
        ge=10,
        le=300,
        description="OpenAI API timeout (seconds)"
    )
    OPENAI_MAX_RETRIES: int = Field(
        default=3,
        ge=0,
        le=10,
        description="Maximum retry attempts for OpenAI API"
    )

    # === CORS Settings ===
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins"
    )
    CORS_ALLOW_CREDENTIALS: bool = Field(
        default=True,
        description="Allow credentials in CORS"
    )

    # === Logging Settings ===
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO",
        description="Logging level"
    )
    LOG_FORMAT: Literal["json", "text"] = Field(
        default="json",
        description="Log format (json for production, text for development)"
    )
    LOG_FILE: Optional[str] = Field(
        default=None,
        description="Log file path (None for stdout only)"
    )

    # === Rate Limiting ===
    RATE_LIMIT_ENABLED: bool = Field(
        default=True,
        description="Enable rate limiting"
    )
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=60,
        ge=10,
        le=1000,
        description="Maximum requests per minute per user"
    )

    # === Feature Flags ===
    ENABLE_REGISTRATION: bool = Field(
        default=True,
        description="Allow new user registration"
    )

    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra environment variables
    )

    @validator("SECRET_KEY")
    def validate_secret_key(cls, v: str, values: dict) -> str:
        """Validate SECRET_KEY is strong enough (relaxed in mock mode)"""
        # In mock mode, allow simpler keys for testing
        if values.get("ENABLE_MOCK_MODE") and values.get("APP_ENV") == "development":
            if len(v) >= 32:
                return v
            else:
                raise ValueError(
                    f"SECRET_KEY must be at least 32 characters (current: {len(v)})"
                )

        # Strict validation for production
        if v == "your_generated_secret_key_here" or v == "changeme":
            raise ValueError(
                "CRITICAL SECURITY ERROR: SECRET_KEY must be changed from default!\n"
                "Generate a strong key using:\n"
                "  python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        if len(v) < 32:
            raise ValueError(
                f"SECRET_KEY is too short ({len(v)} chars). "
                f"Must be at least 32 characters for security."
            )
        return v

    @validator("OPENAI_API_KEY")
    def validate_openai_key(cls, v: str, values: dict) -> str:
        """Validate OpenAI API key is set (skip in mock mode)"""
        # Skip validation in mock mode
        if values.get("ENABLE_MOCK_MODE"):
            return v

        if v == "your_openai_api_key_here" or v == "sk-proj-..." or v == "sk-mock-key-for-testing":
            raise ValueError(
                "OpenAI API key must be set! "
                "Get your key from https://platform.openai.com/api-keys "
                "OR set ENABLE_MOCK_MODE=true in .env for testing"
            )
        return v

    @validator("DATABASE_URL")
    def validate_database_url(cls, v: str, values: dict) -> str:
        """Validate database URL and warn for production"""
        if values.get("APP_ENV") == "production" and v.startswith("sqlite"):
            import warnings
            warnings.warn(
                "WARNING: Using SQLite in production is not recommended! "
                "Please use PostgreSQL for production deployments.",
                UserWarning
            )
        return v

    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.APP_ENV == "development"

    def generate_secret_key(self) -> str:
        """Generate a secure random secret key"""
        return secrets.token_urlsafe(32)

    def __repr__(self) -> str:
        """Safe repr that doesn't expose sensitive data"""
        return (
            f"Settings(APP_NAME='{self.APP_NAME}', "
            f"APP_ENV='{self.APP_ENV}', "
            f"DATABASE_URL='***', "
            f"SECRET_KEY='***', "
            f"OPENAI_API_KEY='***')"
        )


# Singleton instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """
    Get application settings (singleton pattern)

    Returns:
        Settings: Application settings instance

    Raises:
        ValueError: If required environment variables are missing
    """
    global _settings
    if _settings is None:
        try:
            _settings = Settings()
        except Exception as e:
            raise ValueError(
                f"Failed to load application settings: {e}\n\n"
                f"Please check your .env file and ensure all required "
                f"environment variables are set correctly.\n"
                f"See .env.example for reference."
            ) from e
    return _settings


# Convenience function for FastAPI Depends
def get_settings_dependency() -> Settings:
    """Dependency injection for FastAPI routes"""
    return get_settings()


# Export settings instance
settings = get_settings()


if __name__ == "__main__":
    # Test configuration loading
    print("=== Configuration Test ===")
    print(f"App Name: {settings.APP_NAME}")
    print(f"Environment: {settings.APP_ENV}")
    print(f"Debug Mode: {settings.DEBUG}")
    print(f"Database: {settings.DATABASE_URL}")
    print(f"Secret Key Length: {len(settings.SECRET_KEY)} chars")
    print(f"Access Token Expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
    print(f"Refresh Token Expiry: {settings.REFRESH_TOKEN_EXPIRE_DAYS} days")
    print(f"OpenAI Model: {settings.OPENAI_MODEL}")
    print(f"Log Level: {settings.LOG_LEVEL}")
    print(f"Is Production: {settings.is_production}")
    print("\n[OK] Configuration loaded successfully!")
