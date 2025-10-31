from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class UserType(str, Enum):
    EMPLOYER = "employer"
    WORKER = "worker"


class JobStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    LOCKED = "locked"
    RELEASED = "released"
    REFUNDED = "refunded"
    FAILED = "failed"


class TransactionType(str, Enum):
    ESCROW_LOCK = "escrow_lock"
    PAYMENT_RELEASE = "payment_release"
    REFUND = "refund"
    PLATFORM_FEE = "platform_fee"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"


# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    wallet_address: str = Field(..., min_length=42, max_length=42)
    user_type: UserType


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Auth Schemas
class ChallengeRequest(BaseModel):
    wallet_address: str = Field(..., min_length=42, max_length=42)


class ChallengeResponse(BaseModel):
    challenge: str
    expires_in: int


class VerifyRequest(BaseModel):
    wallet_address: str = Field(..., min_length=42, max_length=42)
    signature: str
    message: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Optional[UserResponse] = None
    needs_signup: Optional[bool] = False


class RefreshRequest(BaseModel):
    refresh_token: str


# Job Schemas
class ChecklistItem(BaseModel):
    id: int
    text: str
    completed: bool = False


class JobCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20, max_length=5000)
    job_type: str = Field(..., pattern="^(development|design|writing|marketing|other)$")
    pay_amount_usd: float = Field(..., ge=10, le=50000)
    time_limit_hours: int = Field(..., ge=1, le=720)
    checklist: List[str] = Field(..., min_items=1, max_items=20)


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    job_type: Optional[str] = Field(
        default=None,
        pattern="^(development|design|writing|marketing|other)$"
    )
    pay_amount_usd: Optional[float] = Field(default=None, ge=10, le=50000)
    time_limit_hours: Optional[int] = Field(default=None, ge=1, le=720)
    checklist: Optional[List[str]] = None
    status: Optional[JobStatus] = None


class ChecklistUpdateRequest(BaseModel):
    item_id: int
    completed: bool


class JobResponse(BaseModel):
    id: int
    employer_id: int
    employer_username: Optional[str] = None
    worker_id: Optional[int] = None
    worker_username: Optional[str] = None
    title: str
    description: str
    job_type: str
    pay_amount_usd: float
    pay_amount_eth: float
    platform_fee_usd: float
    platform_fee_eth: float
    time_limit_hours: int
    accepted_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    checklist: List[ChecklistItem]
    contract_address: Optional[str] = None
    status: JobStatus
    payment_status: PaymentStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Transaction Schemas
class TransactionCreate(BaseModel):
    job_id: int
    from_wallet: str
    to_wallet: str
    amount_eth: float
    amount_usd: float
    transaction_type: TransactionType


class TransactionResponse(BaseModel):
    id: int
    job_id: int
    from_wallet: str
    to_wallet: str
    amount_eth: float
    amount_usd: float
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    transaction_type: TransactionType
    status: TransactionStatus
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# WebSocket Schemas
class WebSocketMessage(BaseModel):
    type: str
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Error Response
class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None


# Pagination Response
class PaginatedJobsResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    skip: int
    limit: int
    pages: int
