"""
Token Blacklist Service
Handles JWT token revocation using Redis
"""

import redis.asyncio as redis
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class TokenBlacklist:
    """
    Manages revoked JWT tokens using Redis.
    Tokens are stored with TTL matching their expiration time.
    """
    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis_client: Optional[redis.Redis] = None
    
    async def connect(self):
        """Initialize Redis connection"""
        if not self.redis_client:
            self.redis_client = await redis.from_url(
                self.redis_url,
                decode_responses=True
            )
            logger.info("✅ Token blacklist connected to Redis")
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("👋 Token blacklist disconnected")
    
    async def revoke_token(self, token_jti: str, expires_at: datetime):
        """
        Add token to blacklist.
        
        Args:
            token_jti: JWT ID (jti claim) - unique token identifier
            expires_at: Token expiration timestamp
        """
        try:
            if not self.redis_client:
                await self.connect()
            
            # Calculate TTL (time until token expires)
            now = datetime.utcnow()
            ttl_seconds = int((expires_at - now).total_seconds())
            
            if ttl_seconds <= 0:
                # Token already expired, no need to blacklist
                return
            
            # Store in Redis with expiration
            key = f"blacklist:{token_jti}"
            await self.redis_client.setex(key, ttl_seconds, "revoked")
            
            logger.info(f"Token {token_jti[:8]}... blacklisted for {ttl_seconds}s")
            
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            raise
    
    async def is_token_revoked(self, token_jti: str) -> bool:
        """
        Check if token is blacklisted.
        
        Args:
            token_jti: JWT ID to check
            
        Returns:
            True if token is revoked, False otherwise
        """
        try:
            if not self.redis_client:
                await self.connect()
            
            key = f"blacklist:{token_jti}"
            exists = await self.redis_client.exists(key)
            
            return bool(exists)
            
        except Exception as e:
            logger.error(f"Failed to check token blacklist: {e}")
            # Fail open in case of Redis failure
            return False
    
    async def revoke_all_user_tokens(self, user_id: int):
        """
        Revoke all tokens for a specific user.
        Used when user changes password or account is compromised.
        
        Args:
            user_id: User ID whose tokens should be revoked
        """
        try:
            if not self.redis_client:
                await self.connect()
            
            # Store user revocation timestamp
            # All tokens issued before this time are invalid
            key = f"user_revoke:{user_id}"
            revoke_time = datetime.utcnow().isoformat()
            
            # Keep for 7 days (max refresh token lifetime)
            await self.redis_client.setex(key, 7 * 24 * 60 * 60, revoke_time)
            
            logger.warning(f"All tokens revoked for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to revoke user tokens: {e}")
            raise
    
    async def get_user_revocation_time(self, user_id: int) -> Optional[datetime]:
        """
        Get the time when all user tokens were revoked.
        
        Args:
            user_id: User ID to check
            
        Returns:
            Datetime of revocation, or None if not revoked
        """
        try:
            if not self.redis_client:
                await self.connect()
            
            key = f"user_revoke:{user_id}"
            revoke_time = await self.redis_client.get(key)
            
            if revoke_time:
                return datetime.fromisoformat(revoke_time)
            return None
            
        except Exception as e:
            logger.error(f"Failed to get user revocation time: {e}")
            return None


# Global instance
_blacklist: Optional[TokenBlacklist] = None


def get_token_blacklist(redis_url: str) -> TokenBlacklist:
    """Get or create token blacklist instance"""
    global _blacklist
    if not _blacklist:
        _blacklist = TokenBlacklist(redis_url)
    return _blacklist
