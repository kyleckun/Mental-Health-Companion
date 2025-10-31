"""
Structured Logging System for Mental Health Companion
Supports both JSON (production) and text (development) formats
"""

import logging
import sys
from pathlib import Path
from typing import Optional
from pythonjsonlogger import jsonlogger
from datetime import datetime

from config import settings


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional fields"""

    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)

        # Add timestamp
        if not log_record.get('timestamp'):
            log_record['timestamp'] = datetime.utcnow().isoformat()

        # Add log level
        if log_record.get('level'):
            log_record['level'] = log_record['level'].upper()
        else:
            log_record['level'] = record.levelname

        # Add application info
        log_record['app'] = settings.APP_NAME
        log_record['env'] = settings.APP_ENV
        log_record['version'] = settings.APP_VERSION

        # Add module and function info
        log_record['module'] = record.module
        log_record['function'] = record.funcName
        log_record['line'] = record.lineno


class ColoredTextFormatter(logging.Formatter):
    """Colored text formatter for development"""

    # Color codes
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'
    BOLD = '\033[1m'

    def format(self, record):
        # Add color to level name
        level_color = self.COLORS.get(record.levelname, '')
        record.levelname = f"{level_color}{self.BOLD}{record.levelname}{self.RESET}"

        # Add color to logger name
        record.name = f"{self.BOLD}{record.name}{self.RESET}"

        return super().format(record)


def setup_logging(
    name: Optional[str] = None,
    level: Optional[str] = None,
    log_format: Optional[str] = None,
    log_file: Optional[str] = None
) -> logging.Logger:
    """
    Set up structured logging with JSON or text format

    Args:
        name: Logger name (default: root logger)
        level: Log level (default: from settings)
        log_format: Format type 'json' or 'text' (default: from settings)
        log_file: Log file path (default: from settings)

    Returns:
        Logger: Configured logger instance
    """

    # Use settings defaults if not specified
    level = level or settings.LOG_LEVEL
    log_format = log_format or settings.LOG_FORMAT
    log_file = log_file or settings.LOG_FILE

    # Get or create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()

    # Console handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper()))

    if log_format == "json":
        # JSON format for production
        json_formatter = CustomJsonFormatter(
            fmt='%(timestamp)s %(level)s %(name)s %(message)s',
        )
        console_handler.setFormatter(json_formatter)
    else:
        # Text format for development
        text_formatter = ColoredTextFormatter(
            fmt='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(text_formatter)

    logger.addHandler(console_handler)

    # File handler (if log file specified)
    if log_file:
        try:
            # Create log directory if it doesn't exist
            log_path = Path(log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)

            file_handler = logging.FileHandler(log_file, encoding='utf-8')
            file_handler.setLevel(getattr(logging, level.upper()))

            # Always use JSON format for file logs
            json_formatter = CustomJsonFormatter(
                fmt='%(timestamp)s %(level)s %(name)s %(message)s',
            )
            file_handler.setFormatter(json_formatter)

            logger.addHandler(file_handler)

            logger.info(f"Logging to file: {log_file}")

        except Exception as e:
            logger.error(f"Failed to setup file logging: {e}")

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module

    Usage:
        from logger import get_logger
        logger = get_logger(__name__)
        logger.info("Application started")

    Args:
        name: Logger name (typically __name__)

    Returns:
        Logger: Logger instance
    """
    return logging.getLogger(name)


# Setup root logger on module import
root_logger = setup_logging()


# Context manager for request logging
class RequestLogger:
    """
    Context manager for logging request details

    Usage:
        with RequestLogger("chat_endpoint", user_id="123"):
            # Your code here
            pass
    """

    def __init__(self, endpoint: str, **kwargs):
        self.endpoint = endpoint
        self.context = kwargs
        self.logger = get_logger(__name__)
        self.start_time = None

    def __enter__(self):
        self.start_time = datetime.utcnow()
        self.logger.info(
            f"Request started: {self.endpoint}",
            extra={
                "endpoint": self.endpoint,
                "context": self.context,
                "event": "request_start"
            }
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.utcnow() - self.start_time).total_seconds()

        if exc_type is None:
            self.logger.info(
                f"Request completed: {self.endpoint}",
                extra={
                    "endpoint": self.endpoint,
                    "context": self.context,
                    "duration_seconds": duration,
                    "event": "request_success"
                }
            )
        else:
            self.logger.error(
                f"Request failed: {self.endpoint}",
                extra={
                    "endpoint": self.endpoint,
                    "context": self.context,
                    "duration_seconds": duration,
                    "error": str(exc_val),
                    "error_type": exc_type.__name__,
                    "event": "request_error"
                },
                exc_info=True
            )

        return False  # Don't suppress exceptions


# Utility functions for common logging patterns
def log_user_action(logger: logging.Logger, user_id: str, action: str, **kwargs):
    """Log user action with structured data"""
    logger.info(
        f"User action: {action}",
        extra={
            "user_id": user_id,
            "action": action,
            "event": "user_action",
            **kwargs
        }
    )


def log_api_call(logger: logging.Logger, service: str, endpoint: str, duration: float, success: bool, **kwargs):
    """Log external API call"""
    level = logging.INFO if success else logging.ERROR
    logger.log(
        level,
        f"API call: {service}/{endpoint}",
        extra={
            "service": service,
            "endpoint": endpoint,
            "duration_seconds": duration,
            "success": success,
            "event": "api_call",
            **kwargs
        }
    )


def log_database_query(logger: logging.Logger, query_type: str, duration: float, rows_affected: int = None):
    """Log database query performance"""
    logger.debug(
        f"Database query: {query_type}",
        extra={
            "query_type": query_type,
            "duration_seconds": duration,
            "rows_affected": rows_affected,
            "event": "database_query"
        }
    )


def log_security_event(logger: logging.Logger, event_type: str, user_id: str = None, **kwargs):
    """Log security-related events"""
    logger.warning(
        f"Security event: {event_type}",
        extra={
            "event_type": event_type,
            "user_id": user_id,
            "event": "security",
            **kwargs
        }
    )


if __name__ == "__main__":
    # Test logging
    print("=== Logging System Test ===\n")

    # Test different log levels
    logger = get_logger("test")

    logger.debug("This is a DEBUG message")
    logger.info("This is an INFO message")
    logger.warning("This is a WARNING message")
    logger.error("This is an ERROR message")
    logger.critical("This is a CRITICAL message")

    # Test structured logging
    print("\n=== Structured Logging Test ===\n")

    log_user_action(logger, user_id="user123", action="login", ip_address="192.168.1.1")
    log_api_call(logger, service="openai", endpoint="/chat", duration=1.5, success=True, tokens=150)
    log_database_query(logger, query_type="SELECT", duration=0.05, rows_affected=10)
    log_security_event(logger, event_type="failed_login", user_id="user456", attempts=3)

    # Test request logging context
    print("\n=== Request Logging Test ===\n")

    with RequestLogger("test_endpoint", user_id="user789", method="POST"):
        logger.info("Processing request...")

    print("\n[OK] Logging system test completed!")
