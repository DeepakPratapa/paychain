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
-- SEED DATA: Sample Jobs
-- ============================================

INSERT INTO jobs (
    employer_id,
    title,
    description,
    job_type,
    pay_amount_usd,
    pay_amount_eth,
    platform_fee_usd,
    platform_fee_eth,
    time_limit_hours,
    checklist,
    status
) VALUES
(1, 'Build React E-commerce Dashboard', 
 'Create a full-featured admin dashboard with product management, order tracking, and real-time analytics. Must be responsive and use modern React patterns.',
 'development',
 5000.00,
 1.219512,
 100.00,
 0.024390,
 120,
 '[
   {"id": 1, "text": "Setup project structure with Vite", "completed": false},
   {"id": 2, "text": "Implement authentication system", "completed": false},
   {"id": 3, "text": "Build product CRUD interface", "completed": false},
   {"id": 4, "text": "Create analytics dashboard with charts", "completed": false},
   {"id": 5, "text": "Deploy to production", "completed": false}
 ]'::jsonb,
 'open'),

(1, 'WordPress Security Audit',
 'Comprehensive security review and hardening of WordPress site. Must include vulnerability scan, plugin review, and implementation of security best practices.',
 'development',
 800.00,
 0.195122,
 16.00,
 0.003902,
 24,
 '[
   {"id": 1, "text": "Run security scan and generate report", "completed": false},
   {"id": 2, "text": "Fix identified vulnerabilities", "completed": false},
   {"id": 3, "text": "Install and configure security plugins", "completed": false},
   {"id": 4, "text": "Document all changes made", "completed": false}
 ]'::jsonb,
 'open'),

(2, 'Mobile Banking App UI Design',
 'Modern, clean UI/UX design for iOS and Android banking application. Must include wireframes, high-fidelity mockups, and interactive prototype.',
 'design',
 2500.00,
 0.609756,
 50.00,
 0.012195,
 72,
 '[
   {"id": 1, "text": "Create wireframes for key screens", "completed": false},
   {"id": 2, "text": "Design high-fidelity mockups", "completed": false},
   {"id": 3, "text": "Build design system documentation", "completed": false},
   {"id": 4, "text": "Create interactive prototype in Figma", "completed": false}
 ]'::jsonb,
 'open'),

(2, 'Corporate Branding Package',
 'Complete branding package including logo design, color palette, typography guidelines, and brand style guide. Must provide multiple logo variations.',
 'design',
 2000.00,
 0.487805,
 40.00,
 0.009756,
 96,
 '[
   {"id": 1, "text": "Initial concepts (3 options)", "completed": false},
   {"id": 2, "text": "Revisions on selected concept", "completed": false},
   {"id": 3, "text": "Final logo in all formats", "completed": false},
   {"id": 4, "text": "Complete brand guidelines document", "completed": false}
 ]'::jsonb,
 'open'),

(1, 'Technical Blog Post Series',
 'Write 5 detailed technical articles about microservices architecture. Each article should be 2000+ words with code examples and diagrams.',
 'writing',
 1500.00,
 0.365854,
 30.00,
 0.007317,
 168,
 '[
   {"id": 1, "text": "Research topics and create outlines", "completed": false},
   {"id": 2, "text": "Write first drafts of all 5 articles", "completed": false},
   {"id": 3, "text": "Revisions based on feedback", "completed": false},
   {"id": 4, "text": "Final submission with images and code", "completed": false}
 ]'::jsonb,
 'open');

-- Refresh materialized view
REFRESH MATERIALIZED VIEW job_analytics;
