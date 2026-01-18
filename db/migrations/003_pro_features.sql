-- Migration: Pro features - Itineraries and Alerts
-- Run after 002_places_expansion.sql

-- =============================================
-- ITINERARIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL DEFAULT 'My Thailand Trip',
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, completed, archived
  cover_image_url TEXT,
  notes TEXT,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ITINERARY DAYS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE,
  location VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(itinerary_id, day_number)
);

-- =============================================
-- ITINERARY ACTIVITIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS itinerary_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  time_slot VARCHAR(10), -- e.g., "09:00", "14:30"
  title VARCHAR(300) NOT NULL,
  description TEXT,
  activity_type VARCHAR(50), -- transport, accommodation, attraction, food, shopping, nightlife, beach, nature, wellness
  attraction_slug VARCHAR(100), -- Link to attractions table
  duration_minutes INTEGER,
  estimated_cost_thb INTEGER,
  google_maps_url TEXT,
  booking_url TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER ALERTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- visa_expiry, visa_extension, 90day_report, departure_reminder, travel_tip, weather_alert, event_reminder
  title VARCHAR(300) NOT NULL,
  message TEXT NOT NULL,
  trigger_date DATE NOT NULL, -- When to show/send the alert
  reference_data JSONB DEFAULT '{}', -- Additional context (visa type, location, etc.)
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false, -- For email notifications
  priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=urgent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI CONVERSATIONS TABLE (persist Pro chats)
-- =============================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  conversation_type VARCHAR(50) NOT NULL, -- general, attraction, itinerary, visa
  context_slug VARCHAR(100), -- attraction slug or other context
  title VARCHAR(200),
  messages JSONB DEFAULT '[]', -- Array of {role, content, timestamp}
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SAVED MATCHES TABLE (persist Smart Match results)
-- =============================================
CREATE TABLE IF NOT EXISTS saved_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  attraction_slug VARCHAR(100) NOT NULL,
  match_score INTEGER NOT NULL, -- 0-100
  match_reasons TEXT[], -- Array of reasons
  is_favorited BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, attraction_slug)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_itineraries_user ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_status ON itineraries(status);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary ON itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_day ON itinerary_activities(day_id);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_trigger ON user_alerts(trigger_date);
CREATE INDEX IF NOT EXISTS idx_user_alerts_unread ON user_alerts(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context ON ai_conversations(conversation_type, context_slug);

CREATE INDEX IF NOT EXISTS idx_saved_matches_user ON saved_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_matches_favorited ON saved_matches(user_id, is_favorited) WHERE is_favorited = true;

-- =============================================
-- UPDATE user_profiles if needed
-- =============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS visa_expiry_date DATE,
ADD COLUMN IF NOT EXISTS entry_date DATE,
ADD COLUMN IF NOT EXISTS current_visa_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": false}';
