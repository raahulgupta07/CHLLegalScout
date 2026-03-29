-- ============================================================================
-- Migration 004: Email Logs — track all sent emails
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT,
    body TEXT,
    attachment_name VARCHAR(255),
    attachment_path TEXT,
    sent_by_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_by ON email_logs(sent_by_email);
