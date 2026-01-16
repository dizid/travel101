-- Migration: Expand attractions to places with type support
-- This enables scaling from 15 attractions to 1000s of places

-- Add place_type column to distinguish different types of places
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS place_type VARCHAR(50) NOT NULL DEFAULT 'attraction';
-- Values: attraction, course, tour, activity, coworking, restaurant, event

-- Add metadata JSONB for type-specific fields
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
-- Examples:
--   Courses: { "duration_hours": 4, "price_thb": 1500, "skill_level": "beginner" }
--   Restaurants: { "cuisine": "thai", "price_range": "$$" }
--   Co-working: { "wifi_speed_mbps": 100, "has_meeting_rooms": true }
--   Tours: { "duration_hours": 8, "group_size_max": 12, "booking_url": "..." }

-- Add external_ids for deduplication across data sources
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS external_ids JSONB DEFAULT '{}';
-- Examples: { "google_place_id": "ChIJ...", "viator_id": "12345", "gyg_id": "67890" }

-- Add verification tracking for AI enrichment pipeline
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS data_source VARCHAR(100);
-- Values: manual, google_places, viator, getyourguide, coworker

ALTER TABLE attractions ADD COLUMN IF NOT EXISTS ai_enriched_at TIMESTAMPTZ;
-- When AI last scored this place's categories

ALTER TABLE attractions ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'verified';
-- Values: pending (new/unscored), ai_scored, human_verified, rejected
-- Default 'verified' so existing 15 attractions don't need re-verification

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_attractions_place_type ON attractions(place_type);
CREATE INDEX IF NOT EXISTS idx_attractions_verification ON attractions(verification_status);
CREATE INDEX IF NOT EXISTS idx_attractions_external_ids ON attractions USING GIN(external_ids);
CREATE INDEX IF NOT EXISTS idx_attractions_data_source ON attractions(data_source);

-- Update existing attractions to have proper defaults
UPDATE attractions
SET place_type = 'attraction',
    verification_status = 'human_verified',
    data_source = 'manual'
WHERE place_type = 'attraction' OR place_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN attractions.place_type IS 'Type of place: attraction, course, tour, activity, coworking, restaurant, event';
COMMENT ON COLUMN attractions.metadata IS 'Type-specific fields as JSONB (duration, price, cuisine, etc.)';
COMMENT ON COLUMN attractions.external_ids IS 'External API IDs for deduplication (google_place_id, viator_id, etc.)';
COMMENT ON COLUMN attractions.verification_status IS 'Data quality status: pending, ai_scored, human_verified, rejected';
