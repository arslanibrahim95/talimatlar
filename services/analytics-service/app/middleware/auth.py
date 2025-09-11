from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
# import jwt  # Commented out - not installed
from ..utils.logger import get_logger

logger = get_logger(__name__)

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Get current user from JWT token"""
    try:
        # For now, just return a mock user
        # In production, validate JWT token here
        return {
            "id": "mock-user-id",
            "email": "user@example.com",
            "tenant_id": "default-tenant"
        }
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
