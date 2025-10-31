-- ============================================
-- PAYCHAIN DATABASE INITIALIZATION
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    wallet_address_hash VARCHAR(64) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employer', 'worker')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX idx_users_wallet_hash ON users(wallet_address_hash);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================
-- JOBS TABLE
-- ============================================
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Job Details
    title VARCHAR(200) NOT NULL CHECK (LENGTH(title) >= 5),
    description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('development', 'design', 'writing', 'marketing', 'other')),
    
    -- Payment
    pay_amount_usd DECIMAL(10, 2) NOT NULL CHECK (pay_amount_usd >= 10 AND pay_amount_usd <= 50000),
    pay_amount_eth DECIMAL(20, 18) NOT NULL CHECK (pay_amount_eth > 0),
    platform_fee_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
    platform_fee_eth DECIMAL(20, 18) NOT NULL DEFAULT 0,
    
    -- Timing
    time_limit_hours INTEGER NOT NULL CHECK (time_limit_hours >= 1 AND time_limit_hours <= 720),
    accepted_at TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Checklist (JSON)
    checklist JSONB NOT NULL DEFAULT '[]',
    
    -- Blockchain
    contract_address VARCHAR(42),
    contract_job_id INTEGER,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'expired', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'locked', 'released', 'refunded', 'failed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for jobs
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status = 'open';
CREATE INDEX idx_jobs_employer ON jobs(employer_id, status);
CREATE INDEX idx_jobs_worker ON jobs(worker_id, status);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_pay ON jobs(pay_amount_usd DESC);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_jobs_deadline ON jobs(deadline) WHERE status = 'in_progress';
CREATE INDEX idx_jobs_status_type_pay ON jobs(status, job_type, pay_amount_usd DESC);
CREATE UNIQUE INDEX idx_jobs_worker_unique ON jobs(id, worker_id) WHERE status = 'in_progress';

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Transaction Details
    from_wallet VARCHAR(42) NOT NULL,
    to_wallet VARCHAR(42) NOT NULL,
    amount_eth DECIMAL(20, 18) NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    
    -- Blockchain
    tx_hash VARCHAR(66) UNIQUE,
    block_number INTEGER,
    gas_used INTEGER,
    gas_price_gwei DECIMAL(10, 2),
    
    -- Type
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('escrow_lock', 'payment_release', 'refund', 'platform_fee')),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for transactions
CREATE INDEX idx_transactions_job ON transactions(job_id);
CREATE INDEX idx_transactions_from ON transactions(from_wallet);
CREATE INDEX idx_transactions_to ON transactions(to_wallet);
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ============================================
-- SESSIONS TABLE (For JWT Token Revocation)
-- ============================================
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_jti VARCHAR(64) UNIQUE NOT NULL,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('access', 'refresh')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_jti ON sessions(token_jti);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_cleanup ON sessions(expires_at, revoked) WHERE revoked = FALSE;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('job_posted', 'job_accepted', 'job_completed', 'payment_received', 'job_expired')),
    related_job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- MATERIALIZED VIEW: Analytics
-- ============================================
CREATE MATERIALIZED VIEW job_analytics AS
SELECT 
    job_type,
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    AVG(pay_amount_usd) as avg_pay,
    SUM(pay_amount_usd) FILTER (WHERE status = 'completed') as total_value,
    AVG(EXTRACT(EPOCH FROM (completed_at - accepted_at))/3600) as avg_completion_hours
FROM jobs
GROUP BY job_type;

CREATE UNIQUE INDEX idx_job_analytics_type ON job_analytics(job_type);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate deadline on job acceptance
CREATE OR REPLACE FUNCTION calculate_job_deadline()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'in_progress' AND OLD.status = 'open' THEN
        NEW.deadline = NEW.accepted_at + (NEW.time_limit_hours || ' hours')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_deadline
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_job_deadline();
