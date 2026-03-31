-- OrganLink Schema - PostgreSQL

-- Enable UUID extension if we decide to use UUIDs (currently using Serial/Integers based on code analysis)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Users & Authentication
-- ==========================================

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospitals (
  hospital_id VARCHAR(50) PRIMARY KEY, -- User provided ID
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  wallet_address VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  organization_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  description TEXT,
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  country VARCHAR(100),
  wallet_address VARCHAR(100),
  blockchain_org_id INTEGER, -- For smart contract mapping
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. Medical Records (Patients & Donors)
-- ==========================================

CREATE TABLE IF NOT EXISTS patients (
  patient_id SERIAL PRIMARY KEY,
  hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
  hospital_display_id INTEGER, -- Sequential ID per hospital
  
  full_name VARCHAR(255) NOT NULL,
  age INTEGER,
  gender VARCHAR(20),
  blood_type VARCHAR(10),
  date_of_birth DATE,
  national_id VARCHAR(100), -- Legacy support
  govt_id_type VARCHAR(50), -- Passport, Aadhaar, Driver License, etc.
  govt_id_number VARCHAR(100), -- The actual ID number
  organlink_id VARCHAR(50) UNIQUE, -- Global Unique Hybrid ID (OGID)
  
  organ_needed VARCHAR(50),
  urgency_level VARCHAR(50), -- 'Low', 'Medium', 'High', 'Critical'
  medical_condition TEXT,
  doctor_notes TEXT,
  
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(50),
  
  -- Verification & Blockchain
  signature_ipfs_hash VARCHAR(255),
  blockchain_hash VARCHAR(255),
  signature_verified BOOLEAN DEFAULT FALSE,
  ocr_confidence FLOAT,
  
  -- Workflow
  status VARCHAR(50) DEFAULT 'Waiting', -- 'Waiting', 'Matched', 'Completed', 'Deceased'
  status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donors (
  donor_id SERIAL PRIMARY KEY,
  hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
  hospital_display_id INTEGER,
  
  full_name VARCHAR(255) NOT NULL,
  age INTEGER,
  gender VARCHAR(20),
  blood_type VARCHAR(10),
  national_id VARCHAR(100), -- Legacy support
  govt_id_type VARCHAR(50), -- Passport, Aadhaar, Driver License, etc.
  govt_id_number VARCHAR(100), -- The actual ID number
  organlink_id VARCHAR(50) UNIQUE, -- Global Unique Hybrid ID (OGID)
  
  organs_to_donate JSONB, -- Array of organs ['Kidney', 'Liver']
  medical_history TEXT,
  
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(50),
  
  -- Verification
  signature_ipfs_hash VARCHAR(255),
  blockchain_hash VARCHAR(255),
  signature_verified BOOLEAN DEFAULT FALSE,
  ocr_confidence FLOAT,
  
  status VARCHAR(50) DEFAULT 'Available',
  is_active BOOLEAN DEFAULT TRUE,
  
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. Governance (Policies & Voting)
-- ==========================================

CREATE TABLE IF NOT EXISTS policies (
  policy_id SERIAL PRIMARY KEY,
  proposer_org_id INTEGER REFERENCES organizations(organization_id),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  policy_content TEXT, -- Rationale/Full Text
  category VARCHAR(50),
  
  status VARCHAR(50) DEFAULT 'voting', -- 'voting', 'approved', 'rejected', 'suspended', 'withdrawn', 'deleted'
  
  -- Vote Tally Cache
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  
  -- Withdrawal/Suspension logic
  is_withdrawn BOOLEAN DEFAULT FALSE,
  withdrawn_at TIMESTAMP,
  withdrawal_reason TEXT,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspended_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policy_votes (
  vote_id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(policy_id),
  organization_id INTEGER REFERENCES organizations(organization_id),
  
  vote BOOLEAN, -- TRUE = For, FALSE = Against (Simplified)
  blockchain_tx_hash VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(policy_id, organization_id)
);

-- Tables for syncing with Smart Contract logic (from createBlockchainTables.mjs)
CREATE TABLE IF NOT EXISTS blockchain_policy_proposals (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER NOT NULL UNIQUE,
    organization_id INTEGER REFERENCES organizations(organization_id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blockchain_policy_votes (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(organization_id),
    policy_id INTEGER NOT NULL,
    vote BOOLEAN NOT NULL,
    blockchain_tx_hash VARCHAR(66),
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, policy_id)
);

-- ==========================================
-- 4. System & Logs
-- ==========================================

CREATE TABLE IF NOT EXISTS notifications (
  notification_id VARCHAR(100) PRIMARY KEY,
  hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id), -- Can be NULL if for Org
  organization_id INTEGER REFERENCES organizations(organization_id), -- Can be NULL if for Hospital
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_id VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communication_logs (
  log_id SERIAL PRIMARY KEY,
  recipient_type VARCHAR(20), -- 'donor' or 'patient'
  recipient_id INTEGER,
  recipient_name VARCHAR(255), -- For display/audit
  contact_method VARCHAR(20), -- 'SMS' or 'Email'
  contact_details VARCHAR(255), -- Masked phone/email
  message_template VARCHAR(100),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'delivered'
);

CREATE TABLE IF NOT EXISTS password_reset_requests (
  request_id SERIAL PRIMARY KEY,
  hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
  organization_id INTEGER REFERENCES organizations(organization_id),
  requester_email VARCHAR(255),
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blockchain_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100),
  transaction_hash VARCHAR(100),
  block_number INTEGER,
  gas_used BIGINT,
  gas_fee NUMERIC,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. Seed Initial Data (Optional)
-- ==========================================

-- Default Admin (password: admin123)
INSERT INTO admins (email, password) 
VALUES ('admin@organlink.com', '$2a$10$X8...hashed_password_placeholder... (update with real hash if needed)');
-- Note: Real hash generation requires bcrypt. The app creates default admin in code, so this might not be needed if code handles it.
-- But for a dump, it's good to have.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patients_hospital ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_donors_hospital ON donors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
