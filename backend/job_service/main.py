from fastapi import FastAPI, Depends, HTTPException, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import attributes
from datetime import datetime, timedelta
from typing import Optional, List
import httpx
import logging
import time

from shared.config import get_settings
from shared.database import get_database
from shared.schemas import (
    JobCreate,
    JobResponse,
    ChecklistItem,
    JobStatus,
    PaymentStatus,
    ChecklistUpdateRequest,
    JobUpdate,
    PaginatedJobsResponse,
)
from shared.auth_guard import get_current_user, require_employer, require_worker, get_current_user_optional
from models import Job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PayChain Job Service", version="1.0.0")

settings = get_settings()
db = get_database(settings.DATABASE_URL)

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
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' ws: wss:; "
        "frame-ancestors 'none';"
    )
    return response


@app.on_event("startup")
async def startup():
    # Validate JWT secret key
    if not settings.JWT_SECRET_KEY:
        logger.error("❌ JWT_SECRET_KEY is not set!")
        raise ValueError("JWT_SECRET_KEY must be set in environment variables")
    
    if len(settings.JWT_SECRET_KEY) < 32:
        logger.warning("⚠️  JWT_SECRET_KEY is too short (minimum 32 characters recommended)")
    
    logger.info("✅ Job Service started with security enhancements")


@app.on_event("shutdown")
async def shutdown():
    await db.close()
    logger.info("👋 Job Service stopped")


async def get_db_session():
    async for session in db.get_session():
        yield session


# Helper function for WebSocket calls with API key
async def ws_broadcast(message_type: str, data: dict, channel: str = None):
    """Send broadcast message to WebSocket server with API key"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.WS_SERVICE_URL}/broadcast",
                json={"type": message_type, "data": data, "channel": channel},
                headers={"X-Service-API-Key": settings.WS_SERVICE_API_KEY},
                timeout=5.0
            )
    except Exception as e:
        logger.warning(f"WebSocket broadcast failed: {e}")


async def ws_notify(user_id: int, message_type: str, data: dict):
    """Send notification to specific user via WebSocket with API key"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.WS_SERVICE_URL}/notify",
                json={"user_id": user_id, "type": message_type, "data": data},
                headers={"X-Service-API-Key": settings.WS_SERVICE_API_KEY},
                timeout=5.0
            )
    except Exception as e:
        logger.warning(f"WebSocket notify failed: {e}")


# Note: get_current_user, require_employer, require_worker now imported from shared.auth_guard


async def enrich_job_with_usernames(job: Job) -> JobResponse:
    """Fetch employer and worker usernames from user service"""
    job_dict = {
        "id": job.id,
        "employer_id": job.employer_id,
        "worker_id": job.worker_id,
        "title": job.title,
        "description": job.description,
        "job_type": job.job_type,
        "pay_amount_usd": job.pay_amount_usd,
        "pay_amount_eth": job.pay_amount_eth,
        "platform_fee_usd": job.platform_fee_usd,
        "platform_fee_eth": job.platform_fee_eth,
        "time_limit_hours": job.time_limit_hours,
        "accepted_at": job.accepted_at,
        "deadline": job.deadline,
        "completed_at": job.completed_at,
        "checklist": job.checklist,
        "contract_address": job.contract_address,
        "status": job.status,
        "payment_status": job.payment_status,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "employer_username": None,
        "worker_username": None
    }
    
    # Fetch employer username
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.USER_SERVICE_URL}/users/{job.employer_id}",
                timeout=5.0
            )
            if response.status_code == 200:
                user_data = response.json()
                job_dict["employer_username"] = user_data.get("username")
    except Exception as e:
        logger.warning(f"Failed to fetch employer username: {e}")
    
    # Fetch worker username if assigned
    if job.worker_id:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.USER_SERVICE_URL}/users/{job.worker_id}",
                    timeout=5.0
                )
                if response.status_code == 200:
                    user_data = response.json()
                    job_dict["worker_username"] = user_data.get("username")
        except Exception as e:
            logger.warning(f"Failed to fetch worker username: {e}")
    
    return JobResponse(**job_dict)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "job-service"}


@app.get("/jobs/expired", response_model=List[JobResponse])
async def get_expired_jobs(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Get expired jobs that need refunds (admin/platform use)"""
    try:
        current_time = datetime.utcnow()
        
        # Find jobs that are in_progress and past their deadline
        query = select(Job).where(
            and_(
                Job.status == JobStatus.IN_PROGRESS.value,
                Job.deadline < current_time,
                Job.payment_status == PaymentStatus.LOCKED.value
            )
        )
        
        result = await session.execute(query)
        expired_jobs = result.scalars().all()
        
        enriched_jobs = []
        for job in expired_jobs:
            enriched = await enrich_job_with_usernames(job)
            enriched_jobs.append(enriched)
        
        return enriched_jobs
        
    except Exception as e:
        logger.error(f"Get expired jobs failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve expired jobs"
        )


@app.post("/jobs/{job_id}/refund", response_model=JobResponse)
async def refund_expired_job(
    job_id: int,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Refund an expired job (employer can request, or automatic)"""
    try:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        
        # Allow employer or platform admin to refund
        if job.employer_id != int(user.get("sub")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to refund this job"
            )
        
        # Check if job is expired and in progress
        if job.status != JobStatus.IN_PROGRESS.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only in-progress jobs can be refunded"
            )
        
        if not job.deadline or job.deadline > datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job has not expired yet"
            )
        
        if job.payment_status != PaymentStatus.LOCKED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job payment is not locked in escrow"
            )
        
        # Call Payment Service to refund
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.PAYMENT_SERVICE_URL}/escrow/refund",
                    json={"job_id": job.id},
                    headers={"X-Service-API-Key": settings.PAYMENT_SERVICE_API_KEY},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    job.status = JobStatus.CANCELLED.value
                    job.payment_status = PaymentStatus.REFUNDED.value
                    await session.commit()
                    
                    logger.info(f"Job {job_id} refunded due to expiration")
                    
                    # Broadcast
                    await ws_broadcast("job_refunded", {"job_id": job.id, "reason": "expired"})
                    
                    await session.refresh(job)
                else:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Failed to process refund"
                    )
        except httpx.RequestError as e:
            logger.error(f"Payment service error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service unavailable"
            )
        
        return await enrich_job_with_usernames(job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refund job failed: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refund job"
        )


@app.post("/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Create new job (employer only)"""
    try:
        if user.get("user_type") != "employer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only employers can create jobs"
            )
        
        # Calculate ETH amount (mock conversion: $1 = 0.000244 ETH)
        eth_rate = 0.000244
        pay_amount_eth = float(job_data.pay_amount_usd) * eth_rate
        platform_fee_usd = float(job_data.pay_amount_usd) * 0.02
        platform_fee_eth = pay_amount_eth * 0.02
        
        # Convert checklist strings to ChecklistItem format
        checklist_items = [
            {"id": i+1, "text": item, "completed": False}
            for i, item in enumerate(job_data.checklist)
        ]
        
        # Create job
        new_job = Job(
            employer_id=int(user.get("sub")),
            title=job_data.title,
            description=job_data.description,
            job_type=job_data.job_type,
            pay_amount_usd=job_data.pay_amount_usd,
            pay_amount_eth=pay_amount_eth,
            platform_fee_usd=platform_fee_usd,
            platform_fee_eth=platform_fee_eth,
            time_limit_hours=job_data.time_limit_hours,
            checklist=checklist_items,
            status=JobStatus.OPEN.value,
            payment_status=PaymentStatus.PENDING.value
        )
        
        session.add(new_job)
        await session.commit()
        await session.refresh(new_job)
        
        # Call Payment Service to lock funds
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.PAYMENT_SERVICE_URL}/escrow/lock",
                    json={
                        "job_id": new_job.id,
                        "employer_wallet": user.get("wallet"),
                        "amount_eth": str(pay_amount_eth + platform_fee_eth),
                        "time_limit_hours": job_data.time_limit_hours
                    },
                    headers={"X-Service-API-Key": settings.PAYMENT_SERVICE_API_KEY},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    new_job.contract_address = result.get("contract_address")
                    new_job.contract_job_id = new_job.id  # Blockchain uses same ID as database
                    new_job.payment_status = PaymentStatus.LOCKED.value
                    await session.commit()
                    logger.info(f"Funds locked for job {new_job.id}: {result.get('transaction_hash')}")
        except Exception as e:
            logger.error(f"Failed to lock funds: {e}")
            new_job.payment_status = PaymentStatus.FAILED.value
            await session.commit()
        
        # Broadcast to WebSocket
        await ws_broadcast("job_created", {
            "job_id": new_job.id,
            "title": new_job.title,
            "pay_amount_usd": float(new_job.pay_amount_usd),
            "job_type": new_job.job_type
        })
        
        # Refresh the job object to reattach it to the session
        await session.refresh(new_job)
        
        # Enrich with usernames
        return await enrich_job_with_usernames(new_job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job creation failed: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job"
        )


@app.put("/jobs/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_update: JobUpdate,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Update an open job (employer only)"""
    try:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        if user.get("user_type") != "employer" or job.employer_id != int(user.get("sub")):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this job")

        if job.status != JobStatus.OPEN.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only open jobs can be edited")

        if job_update.title is not None:
            job.title = job_update.title

        if job_update.description is not None:
            job.description = job_update.description

        if job_update.job_type is not None:
            job.job_type = job_update.job_type

        if job_update.pay_amount_usd is not None:
            pay_amount_usd = float(job_update.pay_amount_usd)
            eth_rate = 0.000244
            job.pay_amount_usd = pay_amount_usd
            job.pay_amount_eth = pay_amount_usd * eth_rate
            job.platform_fee_usd = pay_amount_usd * 0.02
            job.platform_fee_eth = job.pay_amount_eth * 0.02

        if job_update.time_limit_hours is not None:
            job.time_limit_hours = int(job_update.time_limit_hours)

        if job_update.checklist is not None:
            job.checklist = [
                {"id": i + 1, "text": item, "completed": False}
                for i, item in enumerate(job_update.checklist)
            ]

        if job_update.status is not None:
            job.status = job_update.status.value

        await session.commit()
        await session.refresh(job)

        return await enrich_job_with_usernames(job)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update job failed: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update job"
        )


@app.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Cancel an open job and refund locked funds (employer only)"""
    try:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        if user.get("user_type") != "employer" or job.employer_id != int(user.get("sub")):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this job")

        if job.status != JobStatus.OPEN.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only open jobs can be deleted")

        # Refund locked funds before cancelling
        if job.payment_status == PaymentStatus.LOCKED.value and job.contract_job_id:
            try:
                async with httpx.AsyncClient() as client:
                    # Use cancel endpoint for employer cancellation (before deadline)
                    response = await client.post(
                        f"{settings.PAYMENT_SERVICE_URL}/escrow/cancel",
                        json={"job_id": job.contract_job_id},
                        params={"employer_wallet": user.get("wallet")},
                        headers={"X-Service-Api-Key": settings.JOB_SERVICE_API_KEY},
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get('status') == 'confirmed':
                            job.payment_status = PaymentStatus.REFUNDED.value
                            logger.info(f"Job {job_id} refunded on cancellation: {result}")
                            
                            # Broadcast WebSocket notification
                            try:
                                await ws_broadcast("job_cancelled_refunded", {
                                    "job_id": job.id,
                                    "employer_id": job.employer_id,
                                    "title": job.title,
                                    "refund_amount_eth": str(job.pay_amount_eth + job.platform_fee_eth),
                                    "reason": "cancelled_by_employer"
                                })
                            except Exception as ws_error:
                                logger.error(f"WebSocket broadcast failed: {ws_error}")
                        else:
                            logger.error(f"Cancel job blockchain transaction failed for job {job_id}")
                    else:
                        logger.error(f"Cancel job failed for job {job_id}: {response.status_code} - {response.text}")
                        
            except Exception as refund_error:
                logger.error(f"Cancel job error for job {job_id}: {refund_error}")
                # Continue with cancellation even if refund fails

        job.status = JobStatus.CANCELLED.value
        await session.commit()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete job failed: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete job"
        )


@app.get("/jobs", response_model=PaginatedJobsResponse)
async def list_jobs(
    status_filter: Optional[str] = None,
    job_type: Optional[str] = None,
    min_pay: Optional[float] = None,
    max_pay: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: Optional[dict] = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db_session)
):
    """List jobs with filters, sorting, and pagination metadata (optional auth)"""
    try:
        # Build base query for filtering
        query = select(Job)
        count_query = select(func.count(Job.id))
        
        conditions = []
        if status_filter:
            conditions.append(Job.status == status_filter)
        if job_type:
            conditions.append(Job.job_type == job_type)
        if min_pay:
            conditions.append(Job.pay_amount_usd >= min_pay)
        if max_pay:
            conditions.append(Job.pay_amount_usd <= max_pay)
        if search:
            conditions.append(
                or_(
                    Job.title.ilike(f"%{search}%"),
                    Job.description.ilike(f"%{search}%")
                )
            )
        
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # Get total count
        total_result = await session.execute(count_query)
        total = total_result.scalar()
        
        # Apply sorting
        if sort_by == "pay_high":
            query = query.order_by(Job.pay_amount_usd.desc())
        elif sort_by == "pay_low":
            query = query.order_by(Job.pay_amount_usd.asc())
        elif sort_by == "oldest":
            query = query.order_by(Job.created_at.asc())
        elif sort_by == "title":
            query = query.order_by(Job.title.asc())
        else:  # Default to newest
            query = query.order_by(Job.created_at.desc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await session.execute(query)
        jobs = result.scalars().all()
        
        # Enrich with usernames
        enriched_jobs = []
        for job in jobs:
            enriched = await enrich_job_with_usernames(job)
            enriched_jobs.append(enriched)
        
        # Calculate total pages
        pages = (total + limit - 1) // limit if limit > 0 else 0
        
        return PaginatedJobsResponse(
            jobs=enriched_jobs,
            total=total,
            skip=skip,
            limit=limit,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"List jobs failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve jobs"
        )


@app.get("/jobs/my-jobs", response_model=List[JobResponse])
async def get_my_jobs(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Get current user's jobs"""
    try:
        user_id = int(user.get("sub"))
        user_type = user.get("user_type")
        
        if user_type == "employer":
            query = select(Job).where(Job.employer_id == user_id)
        else:
            query = select(Job).where(Job.worker_id == user_id)
        
        query = query.order_by(Job.created_at.desc())
        result = await session.execute(query)
        jobs = result.scalars().all()
        
        # Enrich with usernames
        enriched_jobs = []
        for job in jobs:
            enriched = await enrich_job_with_usernames(job)
            enriched_jobs.append(enriched)
        
        return enriched_jobs
        
    except Exception as e:
        logger.error(f"Get my jobs failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve jobs"
        )


@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    user: Optional[dict] = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db_session)
):
    """Get job details (optional auth - some details only visible to authenticated users)"""
    result = await session.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Enrich with usernames
    return await enrich_job_with_usernames(job)


@app.put("/jobs/{job_id}/accept", response_model=JobResponse)
async def accept_job(
    job_id: int,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Worker accepts job"""
    try:
        if user.get("user_type") != "worker":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workers can accept jobs"
            )
        
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        
        if job.status != JobStatus.OPEN.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job not available")
        
        # Get employer wallet address from user service
        employer_wallet = None
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.USER_SERVICE_URL}/users/{job.employer_id}",
                    timeout=5.0
                )
                if response.status_code == 200:
                    user_data = response.json()
                    employer_wallet = user_data.get("wallet_address")
        except Exception as e:
            logger.error(f"Failed to fetch employer wallet: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve employer information"
            )
        
        if not employer_wallet:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Employer wallet not found"
            )
        
        # Call Payment Service to lock funds in escrow
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.PAYMENT_SERVICE_URL}/escrow/lock",
                    json={
                        "job_id": job.id,
                        "employer_wallet": employer_wallet,
                        "amount_eth": str(job.pay_amount_eth),
                        "time_limit_hours": job.time_limit_hours
                    },
                    headers={"X-Service-API-Key": settings.PAYMENT_SERVICE_API_KEY},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    escrow_data = response.json()
                    job.contract_address = escrow_data.get("contract_address")
                    job.payment_status = PaymentStatus.LOCKED.value
                    logger.info(f"Escrow locked for job {job_id}, contract: {job.contract_address}")
                else:
                    error_detail = response.json().get("detail", "Unknown error")
                    logger.error(f"Escrow lock failed: {error_detail}")
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Failed to lock escrow: {error_detail}"
                    )
        except httpx.RequestError as e:
            logger.error(f"Payment service connection error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service unavailable"
            )
        
        # Update job status
        job.worker_id = int(user.get("sub"))
        job.status = JobStatus.IN_PROGRESS.value
        job.accepted_at = datetime.utcnow()
        job.deadline = datetime.utcnow() + timedelta(hours=job.time_limit_hours)
        
        await session.commit()
        await session.refresh(job)
        
        # Broadcast with worker username
        await ws_broadcast("job_accepted", {
            "job_id": job.id, 
            "worker_id": job.worker_id,
            "worker_username": user.get("username")
        })
        
        logger.info(f"Job {job_id} accepted by user {user.get('sub')}")
        
        # Enrich with usernames
        return await enrich_job_with_usernames(job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Accept job failed: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to accept job"
        )


@app.post("/jobs/{job_id}/withdraw", response_model=JobResponse)
async def withdraw_from_job(
    job_id: int,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Worker withdraws from an accepted job"""
    try:
        if user.get("user_type") != "worker":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workers can withdraw from jobs"
            )
        
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        
        if job.worker_id != int(user.get("sub")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this job"
            )
        
        if job.status != JobStatus.IN_PROGRESS.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only withdraw from jobs in progress"
            )
        
        # Reset job to open status
        job.worker_id = None
        job.status = JobStatus.OPEN.value
        job.accepted_at = None
        job.deadline = None
        
        # Reset checklist to uncompleted state
        if job.checklist:
            job.checklist = [
                {**item, "completed": False} for item in job.checklist
            ]
            attributes.flag_modified(job, "checklist")
        
        await session.commit()
        await session.refresh(job)
        
        # Notify employer via WebSocket
        await ws_notify(job.employer_id, "job_withdrawn", {
            "job_id": job.id,
            "job_title": job.title,
            "worker_username": user.get("username")
        })
        
        # Broadcast to all users that job is available again
        await ws_broadcast("job_reopened", {
            "job_id": job.id,
            "title": job.title,
            "pay_amount_usd": float(job.pay_amount_usd)
        })
        
        logger.info(f"Worker {user.get('sub')} withdrew from job {job_id}")
        
        # Enrich with usernames
        return await enrich_job_with_usernames(job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Withdraw from job failed: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to withdraw from job"
        )


@app.put("/jobs/{job_id}/checklist")
async def update_checklist(
    job_id: int,
    request: ChecklistUpdateRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Update checklist item"""
    try:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        
        if job.worker_id != int(user.get("sub")):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this job")
        
        # Update checklist
        checklist = job.checklist
        item_found = False
        for item in checklist:
            if item["id"] == request.item_id:
                item["completed"] = request.completed
                item_found = True
                break
        
        if not item_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Checklist item {request.item_id} not found"
            )
        
        # Mark the checklist field as modified so SQLAlchemy knows to update it
        attributes.flag_modified(job, "checklist")
        job.checklist = checklist
        await session.commit()
        await session.refresh(job)
        
        # Calculate progress
        total = len(checklist)
        completed_count = sum(1 for item in checklist if item["completed"])
        progress = int((completed_count / total) * 100) if total > 0 else 0
        
        # Broadcast WebSocket update to employer for real-time progress monitoring
        try:
            await ws_broadcast("checklist_updated", {
                "job_id": job.id,
                "employer_id": job.employer_id,
                "worker_id": job.worker_id,
                "item_id": request.item_id,
                "completed": request.completed,
                "progress_percent": progress,
                "checklist": checklist,
                "timestamp": int(time.time())
            })
            logger.info(f"Checklist updated for job {job_id}: item {request.item_id} = {request.completed}, progress: {progress}%")
        except Exception as ws_error:
            logger.error(f"WebSocket broadcast failed for checklist update: {ws_error}")
        
        return {"checklist": checklist, "progress_percent": progress}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update checklist failed: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update checklist"
        )


@app.post("/jobs/{job_id}/complete", response_model=JobResponse)
async def complete_job(
    job_id: int,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """Submit job completion"""
    try:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        
        if job.worker_id != int(user.get("sub")):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this job")
        
        # Check if all checklist items are completed
        if not all(item["completed"] for item in job.checklist):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All checklist items must be completed"
            )
        
        # Verify escrow was locked
        if not job.contract_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Escrow was not locked for this job"
            )
        
        # Call Payment Service to release funds
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.PAYMENT_SERVICE_URL}/escrow/release",
                    json={
                        "job_id": job.id,
                        "worker_wallet": user.get("wallet")
                    },
                    headers={"X-Service-API-Key": settings.PAYMENT_SERVICE_API_KEY},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    job.status = JobStatus.COMPLETED.value
                    job.payment_status = PaymentStatus.RELEASED.value
                    job.completed_at = datetime.utcnow()
                    await session.commit()
                    
                    logger.info(f"Job {job_id} completed, payment released")
                    
                    # Broadcast
                    await ws_broadcast("job_completed", {"job_id": job.id, "payment_released": True})
                    
                    # Refresh the job object to reattach it to the session
                    await session.refresh(job)
                else:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Payment service unavailable"
                    )
        except httpx.RequestError as e:
            logger.error(f"Payment service error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service unavailable"
            )
        
        # Enrich with usernames
        return await enrich_job_with_usernames(job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Complete job failed: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete job"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
