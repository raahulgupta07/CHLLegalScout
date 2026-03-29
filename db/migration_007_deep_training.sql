-- Migration 007: Deep Training columns for enhanced template analysis
-- Adds columns for field-level analysis, sample documents, workflow, relationships, and confidence scoring

ALTER TABLE templates ADD COLUMN IF NOT EXISTS field_deep_analysis JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS sample_filled_document JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS document_workflow JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS cross_template_relationships JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS training_confidence INTEGER DEFAULT 0;

-- Index for field deep analysis queries
CREATE INDEX IF NOT EXISTS idx_templates_field_deep_gin ON templates USING GIN (field_deep_analysis);
CREATE INDEX IF NOT EXISTS idx_templates_confidence ON templates (training_confidence);
