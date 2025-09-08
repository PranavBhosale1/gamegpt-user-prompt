"""
Custom Exception Classes and Error Handling for GameGPT Backend
Provides structured error handling with proper HTTP status codes
"""

from typing import Dict, Any, Optional
from enum import Enum
import logging
from fastapi import HTTPException
from pydantic import BaseModel

from app.core.logging_config import get_logger

logger = get_logger(__name__)


class ErrorCode(Enum):
    """Standardized error codes for the API"""
    
    # Service Errors
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    LLM_SERVICE_ERROR = "LLM_SERVICE_ERROR"
    PROMPT_BUILDER_ERROR = "PROMPT_BUILDER_ERROR"
    RESPONSE_PROCESSOR_ERROR = "RESPONSE_PROCESSOR_ERROR"
    
    # Validation Errors
    INVALID_REQUEST = "INVALID_REQUEST"
    INVALID_GAME_SCHEMA = "INVALID_GAME_SCHEMA"
    INVALID_PROMPT = "INVALID_PROMPT"
    
    # External Service Errors
    GEMINI_API_ERROR = "GEMINI_API_ERROR"
    GEMINI_RATE_LIMIT = "GEMINI_RATE_LIMIT"
    GEMINI_QUOTA_EXCEEDED = "GEMINI_QUOTA_EXCEEDED"
    
    # System Errors
    INTERNAL_ERROR = "INTERNAL_ERROR"
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR"
    TIMEOUT_ERROR = "TIMEOUT_ERROR"


class ErrorDetail(BaseModel):
    """Structured error detail for API responses"""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None


class GameGPTException(Exception):
    """Base exception for GameGPT application"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.status_code = status_code
        super().__init__(self.message)


class ServiceException(GameGPTException):
    """Exception for service-related errors"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode,
        service_name: str,
        details: Optional[Dict[str, Any]] = None
    ):
        service_details = {"service": service_name}
        if details:
            service_details.update(details)
        
        super().__init__(
            message=message,
            error_code=error_code,
            details=service_details,
            status_code=503
        )


class ValidationException(GameGPTException):
    """Exception for validation errors"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        validation_details = {}
        if field:
            validation_details["field"] = field
        if details:
            validation_details.update(details)
        
        super().__init__(
            message=message,
            error_code=error_code,
            details=validation_details,
            status_code=400
        )


class ExternalServiceException(GameGPTException):
    """Exception for external service errors"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode,
        service_name: str,
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        service_details = {
            "external_service": service_name,
            "external_status_code": status_code
        }
        if details:
            service_details.update(details)
        
        # Map external service errors to appropriate HTTP status codes
        http_status = 502  # Bad Gateway by default
        if status_code:
            if status_code == 429:  # Rate limit
                http_status = 429
            elif status_code == 401:  # Unauthorized
                http_status = 503
            elif status_code >= 500:  # Server error
                http_status = 502
        
        super().__init__(
            message=message,
            error_code=error_code,
            details=service_details,
            status_code=http_status
        )


def create_error_response(
    error_code: ErrorCode,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    status_code: int = 500
) -> HTTPException:
    """Create a structured HTTPException with error details"""
    
    error_detail = ErrorDetail(
        code=error_code.value,
        message=message,
        details=details
    )
    
    logger.error(f"API Error: {error_code.value} - {message}", extra={
        "error_code": error_code.value,
        "details": details,
        "status_code": status_code
    })
    
    return HTTPException(
        status_code=status_code,
        detail=error_detail.dict()
    )


def handle_service_error(
    error: Exception,
    service_name: str,
    operation: str
) -> HTTPException:
    """Handle service-related errors with proper logging and error codes"""
    
    logger.error(f"Service error in {service_name} during {operation}: {str(error)}", extra={
        "service": service_name,
        "operation": operation,
        "error_type": type(error).__name__
    })
    
    if isinstance(error, GameGPTException):
        return create_error_response(
            error_code=error.error_code,
            message=error.message,
            details=error.details,
            status_code=error.status_code
        )
    
    # Handle specific error types
    if "timeout" in str(error).lower():
        return create_error_response(
            error_code=ErrorCode.TIMEOUT_ERROR,
            message=f"Service timeout in {service_name}",
            details={"service": service_name, "operation": operation},
            status_code=504
        )
    
    if "connection" in str(error).lower():
        return create_error_response(
            error_code=ErrorCode.SERVICE_UNAVAILABLE,
            message=f"Service unavailable: {service_name}",
            details={"service": service_name, "operation": operation},
            status_code=503
        )
    
    # Generic service error
    return create_error_response(
        error_code=ErrorCode.SERVICE_UNAVAILABLE,
        message=f"Internal service error in {service_name}",
        details={"service": service_name, "operation": operation},
        status_code=503
    )


def handle_validation_error(
    error: Exception,
    field: Optional[str] = None
) -> HTTPException:
    """Handle validation errors with proper error codes"""
    
    logger.error(f"Validation error: {str(error)}", extra={
        "field": field,
        "error_type": type(error).__name__
    })
    
    if isinstance(error, ValidationException):
        return create_error_response(
            error_code=error.error_code,
            message=error.message,
            details=error.details,
            status_code=error.status_code
        )
    
    # Generic validation error
    return create_error_response(
        error_code=ErrorCode.INVALID_REQUEST,
        message=f"Validation failed: {str(error)}",
        details={"field": field} if field else None,
        status_code=400
    )


def handle_external_service_error(
    error: Exception,
    service_name: str,
    status_code: Optional[int] = None
) -> HTTPException:
    """Handle external service errors (like Gemini API)"""
    
    logger.error(f"External service error from {service_name}: {str(error)}", extra={
        "external_service": service_name,
        "status_code": status_code,
        "error_type": type(error).__name__
    })
    
    if isinstance(error, ExternalServiceException):
        return create_error_response(
            error_code=error.error_code,
            message=error.message,
            details=error.details,
            status_code=error.status_code
        )
    
    # Map common external service errors
    if status_code == 429:
        return create_error_response(
            error_code=ErrorCode.GEMINI_RATE_LIMIT,
            message="Rate limit exceeded for AI service",
            details={"service": service_name, "retry_after": "60s"},
            status_code=429
        )
    
    if status_code == 403:
        return create_error_response(
            error_code=ErrorCode.GEMINI_QUOTA_EXCEEDED,
            message="API quota exceeded for AI service",
            details={"service": service_name},
            status_code=503
        )
    
    # Generic external service error
    return create_error_response(
        error_code=ErrorCode.GEMINI_API_ERROR,
        message=f"External service error: {service_name}",
        details={"service": service_name, "status_code": status_code},
        status_code=502
    )
