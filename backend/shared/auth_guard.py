"""
Centralized JWT Authentication Guard for Microservices
Provides consistent authentication and authorization across all services
"""

from fastapi import HTTPException, status, Header, Depends
from typing import Optional, List
from .auth import decode_token
from .config import get_settings
import logging

logger = logging.getLogger(__name__)


class JWTAuthGuard:
    """Centralized JWT authentication guard"""
    
    def __init__(self):
        self.settings = get_settings()
    
    async def verify_token(self, authorization: str = Header(...)) -> dict:
        """
        Verify JWT token and return payload.
        Raises HTTPException if invalid.
        """
        try:
            if not authorization:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authorization header missing",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            if not authorization.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authorization header format. Expected 'Bearer <token>'",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            token = authorization.replace("Bearer ", "")
            payload = decode_token(token, self.settings.JWT_SECRET_KEY)
            
            if not payload:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Check token type
            if payload.get("type") != "access":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type. Access token required",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return payload
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def require_auth(self):
        """
        Dependency to require authentication.
        Returns user payload from JWT.
        """
        async def _verify(authorization: str = Header(...)) -> dict:
            return await self.verify_token(authorization)
        return _verify
    
    def require_user_type(self, allowed_types: List[str]):
        """
        Dependency to require specific user type(s).
        Example: require_user_type(["employer"])
        """
        async def _verify(authorization: str = Header(...)) -> dict:
            payload = await self.verify_token(authorization)
            
            user_type = payload.get("user_type")
            if user_type not in allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required user type: {', '.join(allowed_types)}"
                )
            
            return payload
        return _verify
    
    def require_employer(self):
        """Dependency to require employer user type"""
        return self.require_user_type(["employer"])
    
    def require_worker(self):
        """Dependency to require worker user type"""
        return self.require_user_type(["worker"])
    
    def optional_auth(self):
        """
        Dependency for optional authentication.
        Returns user payload if authenticated, None otherwise.
        """
        async def _verify(authorization: Optional[str] = Header(None)) -> Optional[dict]:
            if not authorization:
                return None
            
            try:
                return await self.verify_token(authorization)
            except HTTPException:
                return None
        return _verify
    
    def require_resource_owner(self, resource_user_id_field: str = "user_id"):
        """
        Dependency to verify user owns the resource.
        resource_user_id_field: field name in the resource that contains the owner's user_id
        """
        async def _verify(
            authorization: str = Header(...),
            resource_owner_id: int = None
        ) -> dict:
            payload = await self.verify_token(authorization)
            user_id = int(payload.get("sub"))
            
            if resource_owner_id and user_id != resource_owner_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You don't own this resource"
                )
            
            return payload
        return _verify


# Global instance
auth_guard = JWTAuthGuard()


# Convenience dependencies for common use cases
async def get_current_user(authorization: str = Header(...)) -> dict:
    """Get current authenticated user from JWT token"""
    return await auth_guard.verify_token(authorization)


async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Get current user if authenticated, None otherwise"""
    return await auth_guard.optional_auth()(authorization)


async def require_employer(authorization: str = Header(...)) -> dict:
    """Require employer user type"""
    return await auth_guard.require_employer()(authorization)


async def require_worker(authorization: str = Header(...)) -> dict:
    """Require worker user type"""
    return await auth_guard.require_worker()(authorization)
