-- ============================================================================
-- Migration 005: Add financial_year_end_date to companies
-- ============================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='financial_year_end_date') THEN
        ALTER TABLE companies ADD COLUMN financial_year_end_date DATE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='next_financial_year_end_date') THEN
        ALTER TABLE companies ADD COLUMN next_financial_year_end_date DATE;
    END IF;
END $$;
