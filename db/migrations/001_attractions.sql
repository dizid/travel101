-- Migration: Create attractions system tables
-- Run this first, then run the seed file

-- =============================================
-- ATTRACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  about TEXT,
  category VARCHAR(50) NOT NULL,
  location VARCHAR(200),
  province VARCHAR(100),
  image_url TEXT,
  is_hidden_gem BOOLEAN DEFAULT false,
  is_pro_only BOOLEAN DEFAULT false,
  categories JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATTRACTION TIPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attraction_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id UUID NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  tip_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_pro_only BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATTRACTION SECRETS TABLE (Pro-only content)
-- =============================================
CREATE TABLE IF NOT EXISTS attraction_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id UUID NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  secret_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  location_hint VARCHAR(200),
  is_pro_only BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATTRACTION RECOMMENDATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attraction_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id UUID NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  rec_type VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  why_special TEXT,
  price_range VARCHAR(20),
  google_maps_url TEXT,
  is_pro_only BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_attractions_slug ON attractions(slug);
CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions(category);
CREATE INDEX IF NOT EXISTS idx_attractions_hidden_gem ON attractions(is_hidden_gem);
CREATE INDEX IF NOT EXISTS idx_attractions_province ON attractions(province);

CREATE INDEX IF NOT EXISTS idx_attraction_tips_attraction ON attraction_tips(attraction_id);
CREATE INDEX IF NOT EXISTS idx_attraction_secrets_attraction ON attraction_secrets(attraction_id);
CREATE INDEX IF NOT EXISTS idx_attraction_recommendations_attraction ON attraction_recommendations(attraction_id);
