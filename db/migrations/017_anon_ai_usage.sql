-- Anonymous AI Usage Tracking
-- Closes a cost-abuse gap: previously, requests with no userId (no x-user-id
-- header and no valid JWT) skipped the AI usage quota entirely, giving
-- unlimited free Claude API calls to anyone who omitted the user header.
--
-- This table tracks usage by an anonymous identifier (client IP) instead of
-- user_id, so it has NO foreign key to user_profiles -- anonymous callers are
-- never guaranteed to map to a real user row, and we don't want inserts
-- failing on a missing FK target.

CREATE TABLE IF NOT EXISTS ai_anon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id VARCHAR(255) NOT NULL,  -- client IP (or other anonymous identifier)
  feature_type VARCHAR(50) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(anon_id, feature_type, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_anon_usage_anon_date ON ai_anon_usage(anon_id, usage_date);

COMMENT ON TABLE ai_anon_usage IS 'Tracks daily AI feature usage for anonymous (unauthenticated) callers, keyed by client IP. Lower limit than free authenticated users -- see lib/usage.mts ANON_LIMITS.';
COMMENT ON COLUMN ai_anon_usage.anon_id IS 'Best-effort client IP from Netlify request context. Not a strong identity -- shared by users behind the same NAT/proxy.';
