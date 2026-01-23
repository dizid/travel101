-- AI Usage Tracking for Free/Pro tier limits
-- Tracks daily AI feature usage per user

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  feature_type VARCHAR(50) NOT NULL,  -- 'general_chat', 'attraction_intro', 'attraction_tips', 'attraction_chat', 'packing'
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_type, usage_date)
);

-- Index for fast lookups by user and date
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage(user_id, feature_type, usage_date);

-- Comment on table
COMMENT ON TABLE ai_usage IS 'Tracks daily AI feature usage for free tier limits';
COMMENT ON COLUMN ai_usage.feature_type IS 'Type of AI feature: general_chat, attraction_intro, attraction_tips, attraction_chat, packing';
COMMENT ON COLUMN ai_usage.usage_count IS 'Number of times feature used on this date';
