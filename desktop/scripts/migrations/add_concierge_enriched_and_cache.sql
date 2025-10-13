-- Add enriched_json and data_sources to concierge_reports
ALTER TABLE IF EXISTS concierge_reports
  ADD COLUMN IF NOT EXISTS enriched_json JSONB,
  ADD COLUMN IF NOT EXISTS data_sources JSONB,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_concierge_reports_enriched ON concierge_reports USING GIN (enriched_json);

-- Create cache table for external sources
CREATE TABLE IF NOT EXISTS concierge_sources_cache (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_concierge_sources_expires ON concierge_sources_cache (expires_at);

-- Optional: RLS disabled for cache table (server-side use only)
ALTER TABLE concierge_sources_cache DISABLE ROW LEVEL SECURITY;

