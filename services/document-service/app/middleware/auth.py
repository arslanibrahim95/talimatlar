from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
import httpx
import structlog

from app.config import settings

logger = structlog.get_logger()
security = HTTPBearer()

class User:
    def __init__(self, id: str, phone: str, email: Optional[str], role: str, tenant_id: Optional[str]):
        self.id = id
        self.phone = phone
        self.email = email
        self.role = role
        self.tenant_id = tenant_id

async def verify_token(token: str) -> Optional[User]:
    """Verify JWT token and return user information"""
    try:
        # Decode JWT token
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=[settings.jwt_algorithm]
        )
        
        # Extract user information
        user_id = payload.get("sub")
        phone = payload.get("phone")
        email = payload.get("email")
        role = payload.get("role", "employee")
        tenant_id = payload.get("tenantId")
        
        if not user_id or not phone:
            return None
        
        return User(
            id=user_id,
            phone=phone,
            email=email,
            role=role,
            tenant_id=tenant_id
        )
        
    except JWTError as e:
        logger.error("JWT verification failed", error=str(e))
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
) -> User:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        
        # Verify token
        user = await verify_token(token)
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Add user to request state for logging
        if request:
            request.state.user = user
        
        logger.info("User authenticated", 
                   user_id=user.id, 
                   role=user.role, 
                   tenant_id=user.tenant_id)
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Authentication error", error=str(e))
        raise HTTPException(
            status_code=401,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_user(
    request: Request
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    try:
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        return await verify_token(token)
        
    except Exception as e:
        logger.error("Optional authentication error", error=str(e))
        return None

def require_role(required_roles: list):
    """Decorator to require specific user roles"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in required_roles:
            logger.warning("Insufficient permissions", 
                          user_id=current_user.id, 
                          user_role=current_user.role, 
                          required_roles=required_roles)
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required roles: {', '.join(required_roles)}"
            )
        return current_user
    return role_checker

def require_tenant():
    """Decorator to require tenant access"""
    def tenant_checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.tenant_id:
            logger.warning("Tenant access required", user_id=current_user.id)
            raise HTTPException(
                status_code=403,
                detail="Tenant access required"
            )
        return current_user
    return tenant_checker

async def validate_document_access(
    document_id: str,
    current_user: User = Depends(get_current_user),
    access_type: str = "view"
) -> bool:
    """Validate if user has access to a specific document"""
    try:
        # TODO: Implement document access validation
        # For now, allow access if user belongs to the same tenant
        # In production, implement proper access control
        
        logger.info("Document access validated", 
                   document_id=document_id, 
                   user_id=current_user.id, 
                   access_type=access_type)
        
        return True
        
    except Exception as e:
        logger.error("Document access validation failed", 
                    document_id=document_id, 
                    user_id=current_user.id, 
                    error=str(e))
        return False

# Role-based access control functions
def require_admin():
    """Require admin role"""
    return require_role(["admin"])

def require_manager():
    """Require manager or admin role"""
    return require_role(["admin", "manager"])

def require_employee():
    """Require any authenticated user"""
    return get_current_user
