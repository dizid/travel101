-- Safety Features Migration
-- Scam reports, safety scores, and verified temple data

-- Scam reports table
CREATE TABLE IF NOT EXISTS scam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  scam_type VARCHAR(50) NOT NULL, -- gem_shop, tuk_tuk, fake_monk, jet_ski, taxi, overcharge, other
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location_name VARCHAR(200),
  province VARCHAR(100),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  severity INTEGER DEFAULT 2 CHECK (severity BETWEEN 1 AND 3), -- 1=low, 2=medium, 3=high
  verified BOOLEAN DEFAULT false,
  report_count INTEGER DEFAULT 1,
  last_reported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_scam_reports_province ON scam_reports(province);
CREATE INDEX IF NOT EXISTS idx_scam_reports_type ON scam_reports(scam_type);
CREATE INDEX IF NOT EXISTS idx_scam_reports_location ON scam_reports(lat, lng);
CREATE INDEX IF NOT EXISTS idx_scam_reports_verified ON scam_reports(verified);

-- Temple verification data (extends attractions)
CREATE TABLE IF NOT EXISTS temple_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  opening_hours JSONB, -- {"mon": "08:00-17:00", "tue": "08:00-17:00", ...}
  entry_fee_thb INTEGER DEFAULT 0,
  entry_fee_foreign_thb INTEGER, -- Some temples charge foreigners more
  dress_code TEXT NOT NULL DEFAULT 'Cover shoulders and knees',
  photography_allowed BOOLEAN DEFAULT true,
  photography_notes TEXT,
  donation_expected BOOLEAN DEFAULT false,
  donation_notes TEXT,
  best_visit_time TEXT, -- "Early morning (6-8am) to avoid crowds"
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attraction_id)
);

-- Safety scores by province
CREATE TABLE IF NOT EXISTS province_safety (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province VARCHAR(100) NOT NULL UNIQUE,
  overall_score INTEGER DEFAULT 5 CHECK (overall_score BETWEEN 1 AND 5), -- 1=caution, 5=very safe
  tourist_police_phone VARCHAR(20) DEFAULT '1155',
  local_emergency VARCHAR(20),
  hospital_name VARCHAR(200),
  hospital_address TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common scam patterns as reference data
INSERT INTO scam_reports (scam_type, title, description, location_name, province, severity, verified) VALUES
  ('gem_shop', 'Temple Closed Gem Shop Scam', 'Tuk-tuk drivers claim temple is closed for "ceremony" and offer to take you to a "special" gem shop with "one day only" government sale. Gems are overpriced and often fake.', 'Grand Palace Area', 'Bangkok', 3, true),
  ('tuk_tuk', 'Tuk-Tuk Fixed Price Tours', 'Drivers offer suspiciously cheap city tours (10-20 THB) but take you to commission shops. You waste hours at tailors, gem shops, and travel agencies.', 'Khao San Road', 'Bangkok', 2, true),
  ('jet_ski', 'Jet Ski Damage Scam', 'Rental operators claim you damaged the jet ski and demand huge payments (10,000-50,000 THB). Damage often pre-existing. Always photograph equipment before renting.', 'Patong Beach', 'Phuket', 3, true),
  ('taxi', 'Taxi Meter Refusal', 'Airport and tourist area taxis refuse to use meter, quoting inflated fixed prices. Always insist on meter or use Grab/Bolt apps.', 'Suvarnabhumi Airport', 'Bangkok', 2, true),
  ('fake_monk', 'Fake Monk Donations', 'People dressed as monks approach tourists asking for donations. Real monks do not solicit money directly. They collect alms silently in the morning.', 'Various Tourist Areas', 'Bangkok', 2, true),
  ('overcharge', 'Menu Price Switching', 'Some restaurants show one menu, then bill from a higher-priced "foreigner menu". Always confirm prices before ordering.', 'Patpong', 'Bangkok', 2, true),
  ('tuk_tuk', 'Ping Pong Show Bait', 'Touts promise cheap entry to shows, then venues demand expensive drinks or intimidate customers into paying inflated bills.', 'Patpong Night Market', 'Bangkok', 3, true)
ON CONFLICT DO NOTHING;

-- Insert province safety data
INSERT INTO province_safety (province, overall_score, tourist_police_phone, notes) VALUES
  ('Bangkok', 4, '1155', 'Generally safe. Use licensed taxis and be aware of common scams near tourist areas.'),
  ('Chiang Mai', 5, '1155', 'Very safe for tourists. Mountain roads require caution during rainy season.'),
  ('Phuket', 4, '1155', 'Safe but be cautious with water sports rentals and nightlife areas.'),
  ('Krabi', 5, '1155', 'Very safe. Watch for strong currents during monsoon season.'),
  ('Koh Samui', 4, '1155', 'Generally safe. Road accidents are common - wear helmets on motorbikes.'),
  ('Pattaya', 3, '1155', 'Exercise caution in nightlife areas. Petty theft more common.'),
  ('Chiang Rai', 5, '1155', 'Very safe and peaceful. Border areas require valid documentation.')
ON CONFLICT (province) DO NOTHING;
