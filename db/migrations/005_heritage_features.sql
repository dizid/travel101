-- Migration: Heritage section features
-- Adds image galleries and historical timeline support for heritage attractions

-- =============================================
-- HERITAGE IMAGES TABLE (Image Gallery)
-- =============================================
CREATE TABLE IF NOT EXISTS heritage_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id UUID NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  alt_text TEXT NOT NULL,
  source VARCHAR(50),           -- 'unsplash', 'wikimedia', 'tat', 'manual'
  source_url TEXT,              -- Attribution link
  photographer VARCHAR(200),
  photographer_url TEXT,        -- Link to photographer profile
  license VARCHAR(50),          -- 'unsplash', 'cc-by', 'cc-by-sa', 'public-domain'
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  blur_hash VARCHAR(50),        -- BlurHash for placeholder
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HERITAGE EVENTS TABLE (Historical Timeline)
-- =============================================
CREATE TABLE IF NOT EXISTS heritage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id UUID NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  event_year INTEGER,
  event_year_end INTEGER,       -- For ranges "1351-1767"
  event_era VARCHAR(100),       -- "Ayutthaya Period", "Sukhothai Period"
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  event_type VARCHAR(50),       -- 'construction', 'destruction', 'restoration', 'designation', 'event'
  is_approximate BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_heritage_images_attraction ON heritage_images(attraction_id);
CREATE INDEX IF NOT EXISTS idx_heritage_images_primary ON heritage_images(attraction_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_heritage_images_order ON heritage_images(attraction_id, display_order);

CREATE INDEX IF NOT EXISTS idx_heritage_events_attraction ON heritage_events(attraction_id);
CREATE INDEX IF NOT EXISTS idx_heritage_events_year ON heritage_events(event_year);
CREATE INDEX IF NOT EXISTS idx_heritage_events_era ON heritage_events(event_era);
CREATE INDEX IF NOT EXISTS idx_heritage_events_order ON heritage_events(attraction_id, sort_order);

-- =============================================
-- UPDATE ATTRACTIONS FOR HERITAGE
-- =============================================
-- Add heritage as a recognized place_type (already exists, but ensure comment updated)
COMMENT ON COLUMN attractions.place_type IS 'Type of place: attraction, course, tour, activity, coworking, restaurant, event, heritage';

-- Add index for heritage filtering
CREATE INDEX IF NOT EXISTS idx_attractions_heritage ON attractions(place_type) WHERE place_type = 'heritage';

-- =============================================
-- HERITAGE METADATA STRUCTURE
-- =============================================
-- Heritage sites should have this structure in the metadata JSONB column:
-- {
--   "construction_date": "1351",           -- Year or approximate date
--   "construction_era": "Ayutthaya Period",
--   "architectural_styles": ["Khmer", "Thai", "Rattanakosin"],
--   "unesco_status": "world_heritage_site", -- null, 'world_heritage_site', 'tentative_list'
--   "unesco_inscription_year": 1991,
--   "unesco_criteria": ["iii"],            -- UNESCO criteria (i-x)
--   "kingdom_dynasty": "Ayutthaya Kingdom",
--   "religious_significance": "Buddhist temple complex",
--   "entry_fee_thb": 50,
--   "entry_fee_foreigner_thb": 200,
--   "opening_hours": "08:00-18:00",
--   "dress_code": "Shoulders and knees covered",
--   "best_time_to_visit": "Early morning or late afternoon",
--   "heritage_type": "temple" | "palace" | "ruins" | "museum" | "monument" | "archaeological"
-- }

-- Create GIN index for heritage metadata queries
CREATE INDEX IF NOT EXISTS idx_attractions_heritage_metadata ON attractions USING GIN(metadata) WHERE place_type = 'heritage';

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE heritage_images IS 'Image gallery for heritage attractions with attribution';
COMMENT ON COLUMN heritage_images.source IS 'Image source: unsplash, wikimedia, tat (Thai tourism), manual';
COMMENT ON COLUMN heritage_images.blur_hash IS 'BlurHash string for progressive loading placeholder';

COMMENT ON TABLE heritage_events IS 'Historical timeline events for heritage attractions';
COMMENT ON COLUMN heritage_events.event_era IS 'Thai historical era: Sukhothai Period, Ayutthaya Period, Rattanakosin Period';
COMMENT ON COLUMN heritage_events.event_type IS 'Type of event: construction, destruction, restoration, designation, event';
