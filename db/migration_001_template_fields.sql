-- Migration: Add enhanced fields to templates table
-- Run this to add new columns to existing database

ALTER TABLE templates ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS when_to_use TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS how_to_use JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS prerequisites JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS filing_deadline TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS fees TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS validity_period TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS approval_chain JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS required_attachments JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS common_mistakes JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS jurisdiction TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS industry_tags JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS complexity TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS estimated_time TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS ai_analyzed BOOLEAN DEFAULT FALSE;

-- If ai_trained doesn't exist, add it
ALTER TABLE templates ADD COLUMN IF NOT EXISTS ai_trained BOOLEAN DEFAULT FALSE;

-- If enhanced columns don't exist from earlier, add them
ALTER TABLE templates ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS usage_instructions TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS sections JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS signatures JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS deadlines JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS legal_references JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS related_documents JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS use_cases JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS tips JSONB;

-- Set ai_analyzed = ai_trained where applicable
UPDATE templates SET ai_analyzed = COALESCE(ai_trained, FALSE) WHERE ai_analyzed IS NULL OR ai_analyzed = FALSE;

-- Set default jurisdiction to Malaysia
UPDATE templates SET jurisdiction = 'Myanmar' WHERE jurisdiction IS NULL;

-- Set default complexity based on field count
UPDATE templates SET complexity = 
    CASE 
        WHEN total_fields <= 5 THEN 'Easy'
        WHEN total_fields <= 15 THEN 'Medium'
        ELSE 'Complex'
    END
WHERE complexity IS NULL;

-- Set estimated_time based on field count
UPDATE templates SET estimated_time = 
    CASE 
        WHEN total_fields <= 5 THEN '10 minutes'
        WHEN total_fields <= 10 THEN '20 minutes'
        WHEN total_fields <= 20 THEN '30 minutes'
        ELSE '1 hour'
    END
WHERE estimated_time IS NULL;

SELECT 'Migration complete!' as status;
