from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import os
import logging

from shared.config import get_settings
from shared.database import get_database
from shared.auth_guard import get_current_user
from blockchain_client import BlockchainClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PayChain Payment Service", version="1.0.0")

settings = get_settings()
db = get_database(settings.DATABASE_URL)

# Initialize blockchain client
GANACHE_URL = os.getenv("GANACHE_URL", "http://ganache:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
PLATFORM_PRIVATE_KEY = os.getenv("PLATFORM_PRIVATE_KEY", "")

blockchain = BlockchainClient(GANACHE_URL, CONTRACT_ADDRESS, PLATFORM_PRIVATE_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class LockFundsRequest(BaseModel):
    job_id: int
    employer_wallet: str
    amount_eth: str
    time_limit_hours: int


class ReleasePaymentRequest(BaseModel):
    job_id: int
    worker_wallet: str


class RefundRequest(BaseModel):
    job_id: int


@app.on_event("startup")
async def startup():
    if blockchain.is_connected():
        logger.info("✅ Payment Service started - Blockchain connected")
    else:
        logger.warning("⚠️  Payment Service started - Blockchain NOT connected")


@app.on_event("shutdown")
async def shutdown():
    await db.close()
    logger.info("👋 Payment Service stopped")


async def verify_service_key(x_service_api_key: str = Header(...)):
    """Verify service-to-service API key"""
    if x_service_api_key != settings.PAYMENT_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service API key"
        )


@app.get("/health")
async def health_check():
    blockchain_status = "connected" if blockchain.is_connected() else "disconnected"
    return {
        "status": "healthy",
        "service": "payment-service",
        "blockchain": blockchain_status
    }


@app.post("/escrow/lock")
async def lock_funds(
    request: LockFundsRequest,
    api_key: str = Depends(verify_service_key)
):
    """Lock funds in smart contract escrow"""
    try:
        if not blockchain.is_connected():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Blockchain service unavailable"
            )
        
        # Create job in smart contract
        result = blockchain.create_job(
            job_id=request.job_id,
            time_limit_hours=request.time_limit_hours,
            amount_eth=float(request.amount_eth),
            employer_address=request.employer_wallet
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to lock funds"
            )
        
        logger.info(f"Funds locked for job {request.job_id}: {result['transaction_hash']}")
        
        return {
            "transaction_hash": result['transaction_hash'],
            "contract_address": result['contract_address'],
            "gas_used": result['gas_used'],
            "status": result['status']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lock funds failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post("/escrow/release")
async def release_payment(
    request: ReleasePaymentRequest,
    api_key: str = Depends(verify_service_key)
):
    """Release payment to worker"""
    try:
        if not blockchain.is_connected():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Blockchain service unavailable"
            )
        
        # Release payment from smart contract
        result = blockchain.release_payment(
            job_id=request.job_id,
            worker_address=request.worker_wallet
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to release payment"
            )
        
        logger.info(f"Payment released for job {request.job_id}: {result['transaction_hash']}")
        
        return {
            "transaction_hash": result['transaction_hash'],
            "amount_sent": str(result['amount_sent']),
            "platform_fee": str(result['platform_fee']),
            "gas_used": result['gas_used'],
            "status": result['status']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Release payment failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post("/escrow/refund")
async def refund_job(
    request: RefundRequest,
    api_key: str = Depends(verify_service_key)
):
    """Refund employer for expired job"""
    try:
        if not blockchain.is_connected():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Blockchain service unavailable"
            )
        
        # Refund from smart contract
        result = blockchain.refund_expired_job(request.job_id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to refund"
            )
        
        logger.info(f"Job {request.job_id} refunded: {result['transaction_hash']}")
        
        return {
            "transaction_hash": result['transaction_hash'],
            "gas_used": result['gas_used'],
            "status": result['status']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refund failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/balance/{wallet_address}")
async def get_balance(
    wallet_address: str,
    user: dict = Depends(get_current_user)
):
    """Get wallet balance (authenticated - user must own the wallet)"""
    try:
        # Verify user owns this wallet
        user_wallet = user.get("wallet", "").lower()
        requested_wallet = wallet_address.lower()
        
        if user_wallet != requested_wallet:
            logger.warning(f"User {user.get('sub')} attempted to access wallet {wallet_address}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own wallet balance"
            )
        
        balance_eth = blockchain.get_balance(wallet_address)
        # Mock USD conversion (1 ETH = ~$4100)
        balance_usd = balance_eth * 4100
        
        return {
            "wallet_address": wallet_address,
            "balance_eth": str(balance_eth),
            "balance_usd": str(round(balance_usd, 2))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get balance failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get balance"
        )


@app.get("/escrow/stats")
async def get_contract_stats():
    """Get contract statistics"""
    try:
        stats = blockchain.get_contract_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Get stats failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get stats"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
