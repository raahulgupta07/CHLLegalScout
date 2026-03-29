-- ============================================================================
-- Migration 002: Database Hardening
-- ============================================================================
-- Adds foreign keys, constraints, missing indexes, and data integrity rules.
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Foreign Key Constraints
-- ---------------------------------------------------------------------------

-- activity_logs.user_id → users.id (SET NULL on delete so logs survive user deletion)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_activity_logs_user' AND table_name = 'activity_logs'
    ) THEN
        ALTER TABLE activity_logs
            ADD CONSTRAINT fk_activity_logs_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- document_versions.generated_by → users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_doc_versions_user' AND table_name = 'document_versions'
    ) THEN
        ALTER TABLE document_versions
            ADD CONSTRAINT fk_doc_versions_user
            FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Note: knowledge_raw.source_file is intentionally NOT foreign-keyed
-- Templates use "template:name.docx" and companies use "company:Name" as source_file
-- These don't exist in knowledge_sources (which tracks uploaded files only)

-- ---------------------------------------------------------------------------
-- 2. Check Constraints
-- ---------------------------------------------------------------------------

-- users.role must be one of 'admin', 'user'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_users_role'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_role
            CHECK (role IN ('admin', 'user'));
    END IF;
END $$;

-- documents.version must be positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_documents_version'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT chk_documents_version
            CHECK (version > 0);
    END IF;
END $$;

-- knowledge_sources.status must be valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_knowledge_sources_status'
    ) THEN
        ALTER TABLE knowledge_sources ADD CONSTRAINT chk_knowledge_sources_status
            CHECK (status IN ('pending', 'processing', 'complete', 'error'));
    END IF;
END $$;

-- training_status.status must be valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_training_status'
    ) THEN
        ALTER TABLE training_status ADD CONSTRAINT chk_training_status
            CHECK (status IN ('pending', 'in_progress', 'complete', 'error'));
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Missing Indexes
-- ---------------------------------------------------------------------------

-- GIN indexes for JSONB columns (enables fast @> containment queries)
CREATE INDEX IF NOT EXISTS idx_documents_validation_gin ON documents USING GIN (validation_result);
CREATE INDEX IF NOT EXISTS idx_documents_custom_data_gin ON documents USING GIN (custom_data);
CREATE INDEX IF NOT EXISTS idx_knowledge_raw_data_gin ON knowledge_raw USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_templates_fields_gin ON templates USING GIN (fields);
CREATE INDEX IF NOT EXISTS idx_companies_directors_gin ON companies USING GIN (directors);
CREATE INDEX IF NOT EXISTS idx_companies_members_gin ON companies USING GIN (members);

-- Composite index for activity log queries (user + time range)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

-- Document versions: fast lookup by company
CREATE INDEX IF NOT EXISTS idx_doc_versions_company ON document_versions(company_name);

-- Template versions: fast lookup by template
CREATE INDEX IF NOT EXISTS idx_template_versions_name ON template_versions(template_name, version DESC);

-- Knowledge lookup: index on key_name alone for pattern queries
CREATE INDEX IF NOT EXISTS idx_knowledge_lookup_keyname ON knowledge_lookup(key_name);

-- App settings: fast key lookup
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- ---------------------------------------------------------------------------
-- 4. NOT NULL constraints on critical columns
-- ---------------------------------------------------------------------------

-- Ensure file_name is always set on documents
DO $$
BEGIN
    -- Only add if column is nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'file_name' AND is_nullable = 'YES'
    ) THEN
        -- Set empty strings for any NULLs first
        UPDATE documents SET file_name = 'unknown' WHERE file_name IS NULL;
        ALTER TABLE documents ALTER COLUMN file_name SET NOT NULL;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Updated_at trigger (auto-update on modification)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['templates', 'companies', 'users', 'knowledge_sources', 'app_settings'])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE trigger_name = 'trg_' || tbl || '_updated_at'
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;
