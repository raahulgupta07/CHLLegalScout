-- Database initialization script for Scout Legal
-- Creates all required tables for the application

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    path TEXT,
    fields JSONB,
    total_fields INTEGER DEFAULT 0,
    document_type VARCHAR(100),
    
    -- Existing enhanced fields
    category VARCHAR(255),
    keywords TEXT,
    description TEXT,
    usage_instructions TEXT,
    sections JSONB,
    signatures JSONB,
    deadlines JSONB,
    legal_references JSONB,
    related_documents JSONB,
    use_cases JSONB,
    tips JSONB,
    ai_trained BOOLEAN DEFAULT FALSE,
    
    -- NEW ENHANCED FIELDS (Phase 1)
    purpose TEXT,                    -- "What is this document for?"
    when_to_use TEXT,                -- "When to use this document"
    how_to_use JSONB,                -- ["Step 1", "Step 2", "Step 3"]
    prerequisites JSONB,              -- ["NRIC Copy", "Address Proof"]
    filing_deadline TEXT,            -- "Within 30 days"
    fees TEXT,                        -- "RM 30"
    validity_period TEXT,             -- "Valid for 12 months"
    approval_chain JSONB,             -- ["Director", "Secretary"]
    required_attachments JSONB,       -- ["Photo", "NRIC Copy"]
    common_mistakes JSONB,           -- ["Missing signature"]
    jurisdiction TEXT,                -- "Myanmar"
    industry_tags JSONB,              -- ["Banking"]
    complexity TEXT,                 -- "Easy/Medium/Complex"
    estimated_time TEXT,              -- "15 minutes"
    ai_analyzed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table for tracking generated documents
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    file_name VARCHAR(255),
    file_path TEXT,
    download_url TEXT,
    preview_url TEXT,
    validation_result JSONB,
    custom_data JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge sources table
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    file_type VARCHAR(50),
    record_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge raw data table
CREATE TABLE IF NOT EXISTS knowledge_raw (
    id SERIAL PRIMARY KEY,
    source_file VARCHAR(255),
    file_type VARCHAR(50),
    sheet_name VARCHAR(100),
    row_number INTEGER,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge lookup table for key-value search
CREATE TABLE IF NOT EXISTS knowledge_lookup (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(255),
    key_value TEXT,
    source_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge vector table for semantic search
CREATE TABLE IF NOT EXISTS knowledge_vec (
    id SERIAL PRIMARY KEY,
    content TEXT,
    source_file VARCHAR(255),
    metadata JSONB,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table (DICA Company Extract format)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    company_name_english VARCHAR(500),
    company_name_myanmar TEXT,
    company_registration_number VARCHAR(100) UNIQUE,
    registration_date DATE,
    status VARCHAR(100),
    company_type VARCHAR(255),
    foreign_company VARCHAR(10),
    small_company VARCHAR(10),
    principal_activity TEXT,
    date_of_last_annual_return DATE,
    previous_registration_number VARCHAR(100),
    registered_office_address TEXT,
    principal_place_of_business TEXT,
    directors JSONB DEFAULT '[]',
    ultimate_holding_company_name VARCHAR(500),
    ultimate_holding_company_jurisdiction VARCHAR(100),
    ultimate_holding_company_registration_number VARCHAR(100),
    total_shares_issued VARCHAR(100),
    currency_of_share_capital VARCHAR(20),
    members JSONB DEFAULT '[]',
    filing_history JSONB DEFAULT '[]',
    under_corpsec_management VARCHAR(10),
    group_company VARCHAR(10),
    total_capital VARCHAR(100),
    consideration_amount_paid VARCHAR(100),
    source VARCHAR(50) DEFAULT 'manual',
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name_english);
CREATE INDEX IF NOT EXISTS idx_companies_reg ON companies(company_registration_number);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) DEFAULT '',
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document versions table for version tracking
CREATE TABLE IF NOT EXISTS document_versions (
    id SERIAL PRIMARY KEY,
    document_name VARCHAR(255),
    company_name VARCHAR(255),
    template_name VARCHAR(255),
    version INTEGER DEFAULT 1,
    file_name VARCHAR(255),
    file_path TEXT,
    generated_by INTEGER,
    generated_by_email VARCHAR(255),
    custom_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_doc_versions_name ON document_versions(document_name, version DESC);

-- Template versions table for version tracking
CREATE TABLE IF NOT EXISTS template_versions (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255),
    version INTEGER DEFAULT 1,
    uploaded_by VARCHAR(255),
    fields JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training status with persisted logs
CREATE TABLE IF NOT EXISTS training_status (
    id SERIAL PRIMARY KEY,
    training_type VARCHAR(50) UNIQUE,
    last_trained TIMESTAMP,
    record_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'complete',
    logs JSONB DEFAULT '[]'
);

-- App settings (SMTP, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_name);
CREATE INDEX IF NOT EXISTS idx_documents_template ON documents(template_name);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_filename ON knowledge_sources(filename);
CREATE INDEX IF NOT EXISTS idx_knowledge_raw_source ON knowledge_raw(source_file);
CREATE INDEX IF NOT EXISTS idx_knowledge_lookup_key ON knowledge_lookup(key_name, key_value);
CREATE INDEX IF NOT EXISTS idx_knowledge_vec_source ON knowledge_vec(source_file);

-- Create index for vector similarity search (if using pgvector)
-- This will be created when embeddings are added
-- CREATE INDEX IF NOT EXISTS idx_knowledge_vec_cosine ON knowledge_vec USING ivfflat (embedding vector_cosine_ops);

-- Create index for full-text search on content
CREATE INDEX IF NOT EXISTS idx_knowledge_vec_content ON knowledge_vec USING gin(to_tsvector('english', content));

-- ============================================================================
-- Database Hardening: Foreign Keys, Constraints, Triggers
-- ============================================================================

-- Foreign Keys
ALTER TABLE activity_logs
    ADD CONSTRAINT fk_activity_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE document_versions
    ADD CONSTRAINT fk_doc_versions_user
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Note: knowledge_raw.source_file is NOT foreign-keyed to knowledge_sources
-- because templates and companies use source_file values like "template:AGM.docx"
-- that don't exist in knowledge_sources (which tracks uploaded files only)

-- Check Constraints
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('admin', 'editor', 'user'));
ALTER TABLE documents ADD CONSTRAINT chk_documents_version CHECK (version > 0);
ALTER TABLE knowledge_sources ADD CONSTRAINT chk_knowledge_sources_status
    CHECK (status IN ('pending', 'processing', 'complete', 'error'));
ALTER TABLE training_status ADD CONSTRAINT chk_training_status
    CHECK (status IN ('pending', 'in_progress', 'complete', 'error'));

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_documents_validation_gin ON documents USING GIN (validation_result);
CREATE INDEX IF NOT EXISTS idx_documents_custom_data_gin ON documents USING GIN (custom_data);
CREATE INDEX IF NOT EXISTS idx_knowledge_raw_data_gin ON knowledge_raw USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_templates_fields_gin ON templates USING GIN (fields);
CREATE INDEX IF NOT EXISTS idx_companies_directors_gin ON companies USING GIN (directors);
CREATE INDEX IF NOT EXISTS idx_companies_members_gin ON companies USING GIN (members);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_versions_company ON document_versions(company_name);
CREATE INDEX IF NOT EXISTS idx_template_versions_name ON template_versions(template_name, version DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_lookup_keyname ON knowledge_lookup(key_name);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_knowledge_sources_updated_at BEFORE UPDATE ON knowledge_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
