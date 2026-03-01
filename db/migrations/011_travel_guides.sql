-- Travel guides / blog content system
CREATE TABLE IF NOT EXISTS travel_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(300) NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  excerpt VARCHAR(300),
  category VARCHAR(50) NOT NULL,
  province VARCHAR(100),
  image_url TEXT,
  image_alt TEXT,
  author VARCHAR(100) DEFAULT 'HappyRoam Team',
  reading_time_min INTEGER DEFAULT 7,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_guides_slug ON travel_guides(slug);
CREATE INDEX IF NOT EXISTS idx_guides_category ON travel_guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_published ON travel_guides(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_guides_province ON travel_guides(province) WHERE province IS NOT NULL;
