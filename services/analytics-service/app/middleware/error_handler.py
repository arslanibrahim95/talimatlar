from fastapi import Request, status
from fastapi.responses import JSONResponse
from ..utils.logger import get_logger

logger = get_logger(__name__)

async def error_handler(request: Request, exc: Exception):
    """Global error handler"""
    logger.error(f"Unhandled error: {str(exc)}", error=str(exc))
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "service": "analytics-service"
        }
    )
