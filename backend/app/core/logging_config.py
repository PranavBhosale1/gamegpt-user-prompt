"""
Logging configuration for GameGPT Backend
"""

import logging
import sys
from typing import Dict, Any
from app.core.config import get_settings


def setup_logging() -> None:
    """Setup application logging configuration"""
    settings = get_settings()
    
    # Create formatter
    formatter = logging.Formatter(settings.LOG_FORMAT)
    
    # Setup console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(settings.LOG_LEVEL)
    console_handler.setFormatter(formatter)
    
    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(settings.LOG_LEVEL)
    root_logger.addHandler(console_handler)
    
    # Setup specific loggers
    loggers = [
        "app",
        "app.services",
        "app.models", 
        "app.api",
        "uvicorn",
        "fastapi"
    ]
    
    for logger_name in loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(settings.LOG_LEVEL)
        logger.propagate = True


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance"""
    return logging.getLogger(name)
