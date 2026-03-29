-- ============================================================================
-- Migration 003: Activity Tracking — who created what
-- ============================================================================

-- Add created_by to documents
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='created_by_email') THEN
        ALTER TABLE documents ADD COLUMN created_by_email VARCHAR(255);
    END IF;
END $$;

-- Add uploaded_by to templates
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='uploaded_by_email') THEN
        ALTER TABLE templates ADD COLUMN uploaded_by_email VARCHAR(255);
    END IF;
END $$;

-- Add created_by to companies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='created_by_email') THEN
        ALTER TABLE companies ADD COLUMN created_by_email VARCHAR(255);
    END IF;
END $$;

-- Index for activity log queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created ON activity_logs(action, created_at DESC);
