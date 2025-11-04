-- ============================================
-- PAYCHAIN SEED DATA
-- ============================================

-- ============================================
-- SEED DATA: Demo Users
-- ============================================

-- Employers
INSERT INTO users (username, email, wallet_address, wallet_address_hash, user_type) VALUES
('TechStartupCo', 'ceo@techstartup.com', '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 
 encode(digest('0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 'sha256'), 'hex'), 'employer'),
('DesignAgency', 'hire@designagency.com', '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 
 encode(digest('0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 'sha256'), 'hex'), 'employer');

-- Workers
INSERT INTO users (username, email, wallet_address, wallet_address_hash, user_type) VALUES
('AliceDev', 'alice@developers.io', '0x90f79bf6eb2c4f870365e785982e1f101e93b906', 
 encode(digest('0x90f79bf6eb2c4f870365e785982e1f101e93b906', 'sha256'), 'hex'), 'worker'),
('BobDesigner', 'bob@creative.com', '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65', 
 encode(digest('0x15d34aaf54267db7d7c367839aaf71a00a2c6a65', 'sha256'), 'hex'), 'worker'),
('CarolWriter', 'carol@wordsmith.io', '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc', 
 encode(digest('0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc', 'sha256'), 'hex'), 'worker');

-- ============================================
-- SEED DATA: Jobs
-- ============================================
-- NOTE: Jobs are NOT seeded via SQL anymore!
-- They will be created by blockchain/scripts/seed-jobs.js
-- This ensures:
--   1. Real blockchain escrow locks are created
--   2. Employer wallet balances reflect actual deductions
--   3. All jobs have valid contract_job_id
--   4. Refund/release features work correctly with seed data
--
-- To seed jobs with blockchain, run:
--   cd blockchain && npm run seed:jobs
-- ============================================

-- Refresh materialized view (even if no jobs yet)
REFRESH MATERIALIZED VIEW job_analytics;
