from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from typing import Union
import structlog
import traceback

logger = structlog.get_logger()

class AppError(Exception):
    """Base application error"""
    def __init__(self, message: str, status_code: int = 500, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "INTERNAL_ERROR"
        super().__init__(self.message)

class ValidationError(AppError):
    """Validation error"""
    def __init__(self, message: str):
        super().__init__(message, status_code=400, error_code="VALIDATION_ERROR")

class AuthenticationError(AppError):
    """Authentication error"""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status_code=401, error_code="AUTHENTICATION_ERROR")

class AuthorizationError(AppError):
    """Authorization error"""
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, status_code=403, error_code="AUTHORIZATION_ERROR")

class NotFoundError(AppError):
    """Resource not found error"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404, error_code="NOT_FOUND")

class ConflictError(AppError):
    """Resource conflict error"""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, status_code=409, error_code="CONFLICT")

class RateLimitError(AppError):
    """Rate limit error"""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status_code=429, error_code="RATE_LIMIT_EXCEEDED")

async def error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global error handler"""
    
    # Get request details for logging
    path = request.url.path
    method = request.method
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Get user info if available
    user_id = None
    if hasattr(request.state, 'user'):
        user_id = request.state.user.id
    
    # Handle different types of exceptions
    if isinstance(exc, AppError):
        # Application-specific errors
        status_code = exc.status_code
        error_code = exc.error_code
        message = exc.message
        
        logger.warning("Application error", 
                      error_code=error_code,
                      message=message,
                      path=path,
                      method=method,
                      user_id=user_id,
                      client_ip=client_ip)
        
    elif isinstance(exc, HTTPException):
        # FastAPI HTTP exceptions
        status_code = exc.status_code
        error_code = f"HTTP_{status_code}"
        message = exc.detail
        
        logger.warning("HTTP error", 
                      status_code=status_code,
                      message=message,
                      path=path,
                      method=method,
                      user_id=user_id,
                      client_ip=client_ip)
        
    elif isinstance(exc, SQLAlchemyError):
        # Database errors
        status_code = 500
        error_code = "DATABASE_ERROR"
        message = "Database operation failed"
        
        logger.error("Database error", 
                    error=str(exc),
                    path=path,
                    method=method,
                    user_id=user_id,
                    client_ip=client_ip,
                    traceback=traceback.format_exc())
        
    elif isinstance(exc, ValueError):
        # Validation errors
        status_code = 400
        error_code = "VALIDATION_ERROR"
        message = str(exc)
        
        logger.warning("Validation error", 
                      message=message,
                      path=path,
                      method=method,
                      user_id=user_id,
                      client_ip=client_ip)
        
    else:
        # Unexpected errors
        status_code = 500
        error_code = "INTERNAL_SERVER_ERROR"
        message = "An unexpected error occurred"
        
        logger.error("Unexpected error", 
                    error=str(exc),
                    error_type=type(exc).__name__,
                    path=path,
                    method=method,
                    user_id=user_id,
                    client_ip=client_ip,
                    user_agent=user_agent,
                    traceback=traceback.format_exc())
    
    # Create error response
    error_response = {
        "error": {
            "code": error_code,
            "message": message,
            "timestamp": request.state.get("request_start_time", None),
            "path": path,
            "method": method
        }
    }
    
    # Add additional details in development mode
    if hasattr(request.app.state, 'debug') and request.app.state.debug:
        error_response["error"]["details"] = str(exc)
        if not isinstance(exc, AppError) and not isinstance(exc, HTTPException):
            error_response["error"]["traceback"] = traceback.format_exc()
    
    return JSONResponse(
        status_code=status_code,
        content=error_response
    )

def setup_error_handlers(app):
    """Setup error handlers for the FastAPI app"""
    
    # Register global exception handler
    app.add_exception_handler(Exception, error_handler)
    
    # Register specific exception handlers
    app.add_exception_handler(AppError, error_handler)
    app.add_exception_handler(HTTPException, error_handler)
    app.add_exception_handler(SQLAlchemyError, error_handler)
    app.add_exception_handler(ValueError, error_handler)
    
    logger.info("Error handlers configured")

# Request timing middleware
async def request_timing_middleware(request: Request, call_next):
    """Middleware to track request timing"""
    import time
    
    # Record start time
    start_time = time.time()
    request.state.request_start_time = start_time
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Add timing header
    response.headers["X-Request-Time"] = str(duration)
    
    # Log request timing
    logger.info("Request completed",
               path=request.url.path,
               method=request.method,
               status_code=response.status_code,
               duration=duration,
               user_agent=request.headers.get("user-agent", "unknown"))
    
    return response

# Request ID middleware
async def request_id_middleware(request: Request, call_next):
    """Middleware to add request ID"""
    import uuid
    
    # Generate request ID
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Add request ID to response headers
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response
