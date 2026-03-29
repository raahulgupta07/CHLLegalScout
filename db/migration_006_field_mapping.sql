-- ============================================================================
-- Migration 006: Add field_mapping to templates for learned placeholder mapping
-- ============================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='field_mapping') THEN
        ALTER TABLE templates ADD COLUMN field_mapping JSONB;
    END IF;
END $$;
