"""
Database Configuration with Connection Pooling
Uses unified configuration from config.py
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, NullPool
import logging

# Import unified configuration
from config import settings

# Setup logger
logger = logging.getLogger(__name__)

# Database URL from unified config
DATABASE_URL = settings.DATABASE_URL

# Configure engine based on database type with connection pooling
if DATABASE_URL.startswith("sqlite"):
    # SQLite-specific configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Needed for SQLite
        poolclass=NullPool,  # SQLite doesn't benefit from pooling
        echo=settings.DB_ECHO,  # Log SQL queries if enabled
    )

    # Enable foreign key constraints for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    logger.info("Database: SQLite (development mode)")

else:
    # PostgreSQL/MySQL configuration with connection pooling
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=settings.DB_POOL_SIZE,            # Default: 20
        max_overflow=settings.DB_MAX_OVERFLOW,      # Default: 40
        pool_timeout=settings.DB_POOL_TIMEOUT,      # Default: 30s
        pool_recycle=settings.DB_POOL_RECYCLE,      # Default: 1 hour
        pool_pre_ping=True,                         # Test connections before use
        echo=settings.DB_ECHO,                      # Log SQL queries if enabled
    )

    logger.info(
        f"Database: PostgreSQL/MySQL with connection pooling "
        f"(pool_size={settings.DB_POOL_SIZE}, "
        f"max_overflow={settings.DB_MAX_OVERFLOW})"
    )

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Prevent expired objects after commit
)

# Base class for all models
Base = declarative_base()


# Dependency to get the DB session (FastAPI Depends)
def get_db() -> Session:
    """
    Database session dependency for FastAPI routes

    Usage:
        @router.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(UserDB).all()

    Yields:
        Session: Database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# Function to create all tables (deprecated - use Alembic migrations instead!)
def create_all_tables():
    """
    DEPRECATED: Use Alembic migrations instead!

    This function directly creates tables from models.
    Only use for quick prototyping. For production, always use:
        alembic upgrade head
    """
    import warnings
    warnings.warn(
        "create_all_tables() is deprecated! Use Alembic migrations instead:\n"
        "  alembic upgrade head",
        DeprecationWarning,
        stacklevel=2
    )
    Base.metadata.create_all(bind=engine)
    logger.warning("Tables created using create_all_tables() - use Alembic in production!")


def check_database_connection() -> bool:
    """
    Check if database connection is working

    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info("[OK] Database connection successful")
        return True
    except Exception as e:
        logger.error(f"[ERROR] Database connection failed: {e}")
        return False


def get_db_stats() -> dict:
    """
    Get database connection pool statistics

    Returns:
        dict: Connection pool statistics
    """
    if isinstance(engine.pool, QueuePool):
        return {
            "pool_size": engine.pool.size(),
            "checked_in": engine.pool.checkedin(),
            "checked_out": engine.pool.checkedout(),
            "overflow": engine.pool.overflow(),
            "total_connections": engine.pool.size() + engine.pool.overflow()
        }
    return {"message": "Connection pooling not enabled (SQLite mode)"}


if __name__ == "__main__":
    # Test database connection
    print("=== Database Configuration Test ===")
    print(f"Database URL: {DATABASE_URL}")
    print(f"Pool Size: {settings.DB_POOL_SIZE if not DATABASE_URL.startswith('sqlite') else 'N/A (SQLite)'}")
    print(f"Echo SQL: {settings.DB_ECHO}")
    print("\nTesting connection...")

    if check_database_connection():
        print("\n[OK] Database configuration is correct!")
        if not DATABASE_URL.startswith("sqlite"):
            print("\nConnection Pool Stats:")
            for key, value in get_db_stats().items():
                print(f"  {key}: {value}")
    else:
        print("\n[ERROR] Database connection failed! Check your DATABASE_URL in .env")
