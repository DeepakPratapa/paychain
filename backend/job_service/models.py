from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, Boolean, JSON, Index
from sqlalchemy.sql import func
from shared.database import Base


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, nullable=False, index=True)
    worker_id = Column(Integer, index=True)
    
    # Job Details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    job_type = Column(String(50), nullable=False, index=True)
    
    # Payment
    pay_amount_usd = Column(Numeric(10, 2), nullable=False)
    pay_amount_eth = Column(Numeric(20, 18), nullable=False)
    platform_fee_usd = Column(Numeric(10, 2), nullable=False, default=0)
    platform_fee_eth = Column(Numeric(20, 18), nullable=False, default=0)
    
    # Timing
    time_limit_hours = Column(Integer, nullable=False)
    accepted_at = Column(DateTime(timezone=True))
    deadline = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Checklist (JSONB)
    checklist = Column(JSON, nullable=False, default=[])
    
    # Blockchain
    contract_address = Column(String(42))
    contract_job_id = Column(Integer)
    
    # Status
    status = Column(String(20), nullable=False, default='open', index=True)
    payment_status = Column(String(20), default='pending')
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, nullable=False, index=True)
    
    # Transaction Details
    from_wallet = Column(String(42), nullable=False, index=True)
    to_wallet = Column(String(42), nullable=False, index=True)
    amount_eth = Column(Numeric(20, 18), nullable=False)
    amount_usd = Column(Numeric(10, 2), nullable=False)
    
    # Blockchain
    tx_hash = Column(String(66), unique=True, index=True)
    block_number = Column(Integer)
    gas_used = Column(Integer)
    gas_price_gwei = Column(Numeric(10, 2))
    
    # Type
    transaction_type = Column(String(50), nullable=False)
    
    # Status
    status = Column(String(20), nullable=False, default='pending', index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    confirmed_at = Column(DateTime(timezone=True))
