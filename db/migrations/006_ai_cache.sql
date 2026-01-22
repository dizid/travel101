-- AI response cache for weather, currency, advisories
-- These functions cache external API responses for 6 hours to reduce API calls
-- Note: Drops existing table with wrong schema if it exists

DROP TABLE IF EXISTS ai_cache CASCADE;

CREATE TABLE ai_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient cleanup of expired entries
CREATE INDEX idx_ai_cache_created_at ON ai_cache(created_at);

COMMENT ON TABLE ai_cache IS 'Cache for external API responses (weather, currency, advisories). 6-hour TTL enforced by application.';
