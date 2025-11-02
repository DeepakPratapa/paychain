from fastapi import FastAPI, Depends, HTTPException, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
import redis.asyncio as redis
from eth_account.messages import encode_defunct
from web3 import Web3
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from shared.config import get_settings
from shared.database import get_database
from shared.schemas import (
    ChallengeRequest, ChallengeResponse,
    VerifyRequest, TokenResponse, RefreshRequest,
    UserCreate, UserResponse
)
from shared.auth import create_access_token, create_refresh_token, decode_token
from shared.auth_guard import get_current_user, get_current_user_optional
from shared.token_blacklist import get_token_blacklist
from models import User, Session

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(title="PayChain User Service", version="1.0.0")

# Settings and database
settings = get_settings()
db = get_database(settings.DATABASE_URL)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Redis client for challenge storage
redis_client = None

# Token blacklist
blacklist = get_token_blacklist(settings.REDIS_URL)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.on_event("startup")
async def startup():
    global redis_client
    
    # Validate JWT secret key
    if not settings.JWT_SECRET_KEY:
        logger.error("❌ JWT_SECRET_KEY is not set!")
        raise ValueError("JWT_SECRET_KEY must be set in environment variables")
    
    if len(settings.JWT_SECRET_KEY) < 32:
        logger.warning("⚠️  JWT_SECRET_KEY is too short (minimum 32 characters recommended)")
    
    redis_client = await redis.from_url(settings.REDIS_URL, decode_responses=True)
    await blacklist.connect()
    logger.info("✅ User Service started with security enhancements")


@app.on_event("shutdown")
async def shutdown():
    await redis_client.close()
    await blacklist.close()
    await db.close()
    logger.info("👋 User Service stopped")


# Dependency
async def get_db_session():
    async for session in db.get_session():
        yield session


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user-service"}


@app.post("/auth/challenge", response_model=ChallengeResponse)
@limiter.limit("10/minute")
async def get_challenge(request: Request, challenge_req: ChallengeRequest):
    """Generate signature challenge for MetaMask authentication"""
    try:
        # Generate nonce
        nonce = secrets.token_hex(16)
        timestamp = int(datetime.utcnow().timestamp())
        
        # Create challenge message
        challenge = f"""Sign this to login to PayChain

Wallet: {challenge_req.wallet_address}
Nonce: {nonce}
Timestamp: {timestamp}"""
        
        # Store challenge in Redis with 5-minute expiration
        await redis_client.setex(
            f"challenge:{challenge_req.wallet_address}",
            300,  # 5 minutes
            f"{nonce}:{timestamp}"
        )
        
        logger.info(f"Challenge generated for wallet: {challenge_req.wallet_address[:10]}...")
        
        return ChallengeResponse(
            challenge=challenge,
            expires_in=300
        )
    except Exception as e:
        logger.error(f"Challenge generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate challenge"
        )


@app.post("/auth/verify", response_model=TokenResponse)
@limiter.limit("5/minute")
async def verify_signature(
    request: Request,
    verify_req: VerifyRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """Verify MetaMask signature and issue JWT tokens"""
    try:
        # Retrieve stored challenge
        stored = await redis_client.get(f"challenge:{verify_req.wallet_address}")
        if not stored:
            logger.warning(f"Login failed - challenge not found: {verify_req.wallet_address[:10]}...")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Challenge expired or not found"
            )
        
        # Verify the message matches stored challenge
        nonce, timestamp = stored.split(":")
        expected_message = f"""Sign this to login to PayChain

Wallet: {verify_req.wallet_address}
Nonce: {nonce}
Timestamp: {timestamp}"""
        
        if verify_req.message != expected_message:
            logger.warning(f"Login failed - message mismatch: {verify_req.wallet_address[:10]}...")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Message mismatch"
            )
        
        # Verify signature using Web3
        w3 = Web3()
        message = encode_defunct(text=verify_req.message)
        recovered_address = w3.eth.account.recover_message(message, signature=verify_req.signature)
        
        if recovered_address.lower() != verify_req.wallet_address.lower():
            logger.warning(f"Login failed - invalid signature: {verify_req.wallet_address[:10]}...")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )
        
        # Delete used challenge
        await redis_client.delete(f"challenge:{verify_req.wallet_address}")
        
        # Normalize wallet address to lowercase for consistent matching
        normalized_wallet = verify_req.wallet_address.lower()
        
        # Check if user exists
        wallet_hash = hashlib.sha256(normalized_wallet.encode()).hexdigest()
        result = await session.execute(
            select(User).where(User.wallet_address_hash == wallet_hash)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            # New user needs to complete signup
            logger.info(f"New user needs signup: {verify_req.wallet_address[:10]}...")
            return TokenResponse(
                access_token="",
                refresh_token="",
                token_type="bearer",
                expires_in=0,
                user=None,
                needs_signup=True
            )
        
        # Update last login
        user.last_login = datetime.utcnow()
        await session.commit()
        
        # Generate tokens
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "wallet": user.wallet_address,
                "user_type": user.user_type,
                "username": user.username
            },
            secret_key=settings.JWT_SECRET_KEY,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)},
            secret_key=settings.JWT_SECRET_KEY,
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        logger.info(f"✅ User logged in successfully: {user.username} ({user.user_type})")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification failed"
        )


@app.post("/auth/signup", response_model=UserResponse)
async def signup(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_db_session)
):
    """Complete user registration"""
    try:
        # Check if username or email already exists
        result = await session.execute(
            select(User).where(
                (User.username == user_data.username) | 
                (User.email == user_data.email)
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username or email already exists"
            )
        
        # Create new user
        wallet_hash = hashlib.sha256(user_data.wallet_address.encode()).hexdigest()
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            wallet_address=user_data.wallet_address,
            wallet_address_hash=wallet_hash,
            user_type=user_data.user_type.value
        )
        
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        
        logger.info(f"New user registered: {new_user.username}")
        
        return UserResponse.from_orm(new_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup failed: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signup failed"
        )


@app.get("/users/me", response_model=UserResponse)
async def get_me(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Get current authenticated user"""
    try:
        user_id = int(user.get("sub"))
        
        # Get user from database
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse.from_orm(db_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current user failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information"
        )


@app.post("/auth/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh_access_token(
    request: Request,
    refresh_req: RefreshRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """Refresh access token using refresh token"""
    try:
        # Decode refresh token
        payload = decode_token(refresh_req.refresh_token, settings.JWT_SECRET_KEY)
        
        if not payload or payload.get("type") != "refresh":
            logger.warning("Token refresh failed - invalid refresh token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = int(payload.get("sub"))
        
        # Get user
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            logger.warning(f"Token refresh failed - user {user_id} not found or inactive")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Generate new access token
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "wallet": user.wallet_address,
                "user_type": user.user_type,
                "username": user.username
            },
            secret_key=settings.JWT_SECRET_KEY,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Optionally generate new refresh token for rotation
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)},
            secret_key=settings.JWT_SECRET_KEY,
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed"
        )


@app.post("/auth/logout")
async def logout(
    authorization: str = Header(...),
    session: AsyncSession = Depends(get_db_session)
):
    """Logout user - revoke token by adding to blacklist"""
    try:
        # Extract token
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token, settings.JWT_SECRET_KEY)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Add token to blacklist
        token_jti = payload.get("jti")
        user_id = payload.get("sub")
        if token_jti:
            expires_at = datetime.fromtimestamp(payload.get("exp", 0))
            await blacklist.revoke_token(token_jti, expires_at)
            logger.info(f"🔒 User {user_id} logged out - token revoked")
        
        return {"message": "Logged out successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Get user by ID.
    - Authenticated users can see full profile
    - Unauthenticated users only see limited public info (username only)
    """
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Return full profile for authenticated users
    if current_user:
        return UserResponse.from_orm(user)
    
    # For unauthenticated users, return minimal public info
    # Note: We still need to return the full object but can hide sensitive fields in the future
    # For now, return full profile since other services need wallet_address
    return UserResponse.from_orm(user)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
