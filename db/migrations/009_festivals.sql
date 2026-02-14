-- Migration 009: Thai Festivals Feature
-- Creates thai_festivals table with 45+ festivals including hidden gems

-- =============================================
-- TABLE: thai_festivals
-- =============================================
CREATE TABLE IF NOT EXISTS thai_festivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_thai VARCHAR(200),
  description TEXT,

  -- Date/Timing Information
  month_typical INTEGER,                      -- 1-12, typical month
  date_type VARCHAR(20) NOT NULL DEFAULT 'variable',  -- fixed, lunar, variable
  date_fixed VARCHAR(10),                     -- MM-DD for fixed date festivals
  duration_days INTEGER DEFAULT 1,
  date_2025 DATE,
  date_2026 DATE,

  -- Location Information
  provinces TEXT[],
  is_nationwide BOOLEAN DEFAULT false,
  best_locations TEXT[],
  region VARCHAR(50),                         -- North, Isan, Central, South, Bangkok, East, West

  -- Content
  image_url TEXT,
  activities TEXT[],
  tips TEXT[],
  dress_code TEXT,

  -- Classification
  festival_type VARCHAR(50),                  -- religious, cultural, royal, modern, harvest, water
  religion VARCHAR(50),                       -- buddhist, hindu, taoist, animist, secular
  is_hidden_gem BOOLEAN DEFAULT false,
  crowd_level VARCHAR(20),                    -- low, medium, high, extreme
  foreigner_friendly INTEGER,                 -- 1-5 rating

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_festivals_slug ON thai_festivals(slug);
CREATE INDEX IF NOT EXISTS idx_festivals_month ON thai_festivals(month_typical);
CREATE INDEX IF NOT EXISTS idx_festivals_type ON thai_festivals(festival_type);
CREATE INDEX IF NOT EXISTS idx_festivals_religion ON thai_festivals(religion);
CREATE INDEX IF NOT EXISTS idx_festivals_region ON thai_festivals(region);
CREATE INDEX IF NOT EXISTS idx_festivals_hidden_gem ON thai_festivals(is_hidden_gem) WHERE is_hidden_gem = true;
CREATE INDEX IF NOT EXISTS idx_festivals_nationwide ON thai_festivals(is_nationwide) WHERE is_nationwide = true;
CREATE INDEX IF NOT EXISTS idx_festivals_date_2025 ON thai_festivals(date_2025);
CREATE INDEX IF NOT EXISTS idx_festivals_date_2026 ON thai_festivals(date_2026);
CREATE INDEX IF NOT EXISTS idx_festivals_provinces ON thai_festivals USING GIN(provinces);

-- =============================================
-- SEED DATA: Major Nationwide Festivals
-- =============================================

-- Songkran (Thai New Year Water Festival)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, date_fixed, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'songkran',
  'Songkran Water Festival',
  'สงกรานต์',
  'Thailand''s famous New Year water festival. The entire country celebrates with water fights, temple visits, and paying respect to elders. It marks the traditional Thai New Year and is the biggest holiday in Thailand.',
  4, 'fixed', '04-13', 3,
  '2025-04-13', '2026-04-13',
  NULL, true,
  ARRAY['Chiang Mai', 'Bangkok (Khao San Road)', 'Pattaya', 'Phuket', 'Ayutthaya'],
  NULL,
  ARRAY['Water fights in the streets', 'Temple visits and merit-making', 'Pouring water on elders'' hands', 'Building sand pagodas', 'Releasing birds and fish', 'Traditional Thai dancing'],
  ARRAY['Wear clothes you don''t mind getting soaked', 'Protect electronics in waterproof bags', 'Book accommodation months in advance', 'Avoid driving - roads are dangerous', 'Respect people who don''t want to get wet'],
  'Quick-dry clothes, waterproof bag for valuables',
  'cultural', 'buddhist', false, 'extreme', 5
);

-- Loy Krathong
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'loy-krathong',
  'Loy Krathong',
  'ลอยกระทง',
  'The Festival of Lights where Thais float decorated baskets (krathong) on rivers to honor the water goddess and release negativity. One of Thailand''s most romantic and beautiful festivals.',
  11, 'lunar', 1,
  '2025-11-05', '2026-11-25',
  NULL, true,
  ARRAY['Sukhothai Historical Park', 'Chiang Mai', 'Bangkok (Chao Phraya River)', 'Ayutthaya', 'Tak'],
  NULL,
  ARRAY['Floating krathongs on water', 'Watching fireworks', 'Beauty pageants', 'Traditional performances', 'Making your own krathong', 'Light and sound shows'],
  ARRAY['Buy biodegradable krathongs made from bread or banana leaves', 'Arrive early for best riverside spots', 'Sukhothai has the most elaborate celebrations', 'Make a wish as you release your krathong'],
  'Traditional Thai dress optional',
  'cultural', 'buddhist', false, 'high', 5
);

-- Yi Peng (Lantern Festival)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'yi-peng',
  'Yi Peng Lantern Festival',
  'ยี่เป็ง',
  'Northern Thailand''s spectacular sky lantern festival. Thousands of paper lanterns are released into the night sky, creating a magical scene. Coincides with Loy Krathong in the north.',
  11, 'lunar', 2,
  '2025-11-05', '2026-11-24',
  ARRAY['Chiang Mai', 'Lamphun', 'Lampang'],
  false,
  ARRAY['Mae Jo University', 'Chiang Mai Old City', 'Tha Phae Gate'],
  'North',
  ARRAY['Releasing sky lanterns', 'Watching mass lantern releases', 'Temple ceremonies', 'Traditional Lanna performances', 'Floating krathongs'],
  ARRAY['Book Mae Jo event tickets months ahead', 'Lanterns are restricted in some areas - check regulations', 'Best photos from elevated positions', 'Wear white for temple ceremonies'],
  'White clothing for temple visits',
  'cultural', 'buddhist', false, 'extreme', 5
);

-- Chinese New Year
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'chinese-new-year',
  'Chinese New Year',
  'ตรุษจีน',
  'Celebrated by Thailand''s large Chinese-Thai community with dragon dances, firecrackers, and red decorations. Yaowarat (Bangkok''s Chinatown) has the biggest celebrations.',
  2, 'lunar', 3,
  '2025-01-29', '2026-02-17',
  ARRAY['Bangkok', 'Phuket', 'Nakhon Sawan', 'Chiang Mai'],
  false,
  ARRAY['Yaowarat (Bangkok Chinatown)', 'Phuket Old Town', 'Nakhon Sawan'],
  'Central',
  ARRAY['Dragon and lion dances', 'Fireworks and firecrackers', 'Red envelope giving', 'Special Chinese dishes', 'Temple visits', 'Street parades'],
  ARRAY['Wear red for good luck', 'Yaowarat gets extremely crowded', 'Try traditional Chinese New Year foods', 'Many businesses close for 2-3 days'],
  'Red clothing for good luck',
  'cultural', 'taoist', false, 'high', 5
);

-- =============================================
-- SEED DATA: Buddhist Holidays
-- =============================================

-- Makha Bucha
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'makha-bucha',
  'Makha Bucha Day',
  'มาฆบูชา',
  'One of Buddhism''s most important days, commemorating when 1,250 disciples spontaneously gathered to hear Buddha preach. Candlelit processions circle temples nationwide.',
  2, 'lunar', 1,
  '2025-02-12', '2026-03-03',
  NULL, true,
  ARRAY['Wat Phra Dhammakaya', 'Wat Benchamabophit', 'Wat Pho', 'Any major temple'],
  NULL,
  ARRAY['Candlelit wien thien procession', 'Temple visits and merit-making', 'Listening to sermons', 'Meditation sessions', 'Offering alms'],
  ARRAY['Alcohol sales banned - plan accordingly', 'Dress respectfully for temples', 'Evening ceremonies are most beautiful', 'Join the three-time circumambulation'],
  'White clothing, modest temple attire',
  'religious', 'buddhist', false, 'medium', 4
);

-- Visakha Bucha
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'visakha-bucha',
  'Visakha Bucha Day',
  'วิสาขบูชา',
  'The most sacred Buddhist holiday, marking Buddha''s birth, enlightenment, and death - all occurring on the same lunar day. UNESCO-recognized as a day of global significance.',
  5, 'lunar', 1,
  '2025-05-11', '2026-05-31',
  NULL, true,
  ARRAY['Wat Saket (Golden Mount)', 'Wat Phra Kaew', 'Nakhon Pathom (Phra Pathom Chedi)'],
  NULL,
  ARRAY['Candlelit processions', 'All-night meditation', 'Temple ceremonies', 'Merit-making', 'Dhamma talks'],
  ARRAY['This is a dry day - no alcohol sales', 'Most businesses and attractions remain open', 'Evening candlelit ceremonies are magical', 'Great day to experience Thai Buddhism'],
  'White or modest clothing',
  'religious', 'buddhist', false, 'medium', 4
);

-- Asanha Bucha
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'asanha-bucha',
  'Asanha Bucha Day',
  'อาสาฬหบูชา',
  'Commemorates Buddha''s first sermon after enlightenment. Falls the day before Khao Phansa (Buddhist Lent), making it a significant religious period.',
  7, 'lunar', 1,
  '2025-07-10', '2026-07-29',
  NULL, true,
  ARRAY['Any major temple', 'Wat Phra Dhammakaya'],
  NULL,
  ARRAY['Temple visits', 'Candlelit processions', 'Sermon listening', 'Merit-making', 'Ordination ceremonies'],
  ARRAY['Dry day - no alcohol', 'Combined with Khao Phansa the next day', 'Many Thai men ordain as monks for Lent', 'Evening ceremonies recommended'],
  'White or modest clothing',
  'religious', 'buddhist', false, 'medium', 3
);

-- Khao Phansa (Buddhist Lent)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'khao-phansa',
  'Khao Phansa (Buddhist Lent)',
  'เข้าพรรษา',
  'Start of the 3-month Buddhist Lent when monks stay at temples. Many Thai men temporarily ordain during this period. Ubon Ratchathani holds a famous candle festival.',
  7, 'lunar', 1,
  '2025-07-11', '2026-07-30',
  NULL, true,
  ARRAY['Ubon Ratchathani', 'Any major temple'],
  NULL,
  ARRAY['Candle processions', 'Ordination ceremonies', 'Temple stays', 'Merit-making', 'Offering candles to temples'],
  ARRAY['Great time to do a temple stay', 'Ubon Candle Festival is spectacular', 'Many Thais give up alcohol during Lent', 'Monks cannot travel during this period'],
  'Modest white clothing',
  'religious', 'buddhist', false, 'medium', 3
);

-- Ok Phansa
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'ok-phansa',
  'Ok Phansa (End of Buddhist Lent)',
  'ออกพรรษา',
  'Marks the end of Buddhist Lent. Celebrated with boat races, illuminated boat processions, and the mysterious Naga fireballs in Nong Khai.',
  10, 'lunar', 1,
  '2025-10-07', '2026-10-26',
  NULL, true,
  ARRAY['Nong Khai', 'Nan', 'Surat Thani'],
  NULL,
  ARRAY['Illuminated boat processions', 'Long boat races', 'Naga fireball watching', 'Temple ceremonies', 'Offering robes to monks'],
  ARRAY['Nong Khai gets very crowded for Naga fireballs', 'Nan has beautiful boat races', 'Book Nong Khai accommodation early', 'Great photography opportunities'],
  'Casual',
  'religious', 'buddhist', false, 'high', 4
);

-- =============================================
-- SEED DATA: Hidden Gem Regional Festivals
-- =============================================

-- Bun Bang Fai (Rocket Festival)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'bun-bang-fai',
  'Bun Bang Fai Rocket Festival',
  'บุญบั้งไฟ',
  'Isan''s wild rocket festival! Giant homemade rockets are launched to encourage rain for rice planting. Features parades, dancing, and cross-dressing performances. Ancient tradition with serious party vibes.',
  5, 'lunar', 2,
  '2025-05-10', '2026-05-30',
  ARRAY['Yasothon', 'Roi Et', 'Ubon Ratchathani', 'Kalasin'],
  false,
  ARRAY['Yasothon', 'Phaya Thaen Park'],
  'Isan',
  ARRAY['Watching rocket launches', 'Traditional Isan dancing', 'Parade floats', 'Cross-dressing comedy shows', 'Mor lam music', 'Local Isan food'],
  ARRAY['Yasothon is the most famous location', 'Extremely loud - bring ear protection', 'Very local event - few tourists', 'Try the local lao khao rice whiskey', 'Rockets can be dangerous - keep distance'],
  'Casual, prepare to get dusty',
  'cultural', 'animist', true, 'high', 3
);

-- Phi Ta Khon (Ghost Festival)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'phi-ta-khon',
  'Phi Ta Khon Ghost Festival',
  'ผีตาโขน',
  'Thailand''s most colorful festival! Locals wear elaborate ghost masks and costumes, dancing through streets in a Buddhist-animist celebration. The masks are made from sticky rice steamers and coconut leaves.',
  6, 'lunar', 3,
  '2025-06-27', '2026-06-15',
  ARRAY['Loei'],
  false,
  ARRAY['Dan Sai District, Loei'],
  'Isan',
  ARRAY['Ghost mask parade', 'Traditional dancing', 'Mask-making workshops', 'Rocket launching', 'Buddhist ceremonies', 'Local crafts market'],
  ARRAY['Dan Sai is remote - arrange transport', 'Buy a ghost mask as souvenir', 'Very photogenic - bring good camera', 'Extremely popular with Thai tourists', 'Book accommodation in Loei town'],
  'Casual, colorful welcome',
  'cultural', 'animist', true, 'high', 4
);

-- Ubon Candle Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'ubon-candle-festival',
  'Ubon Ratchathani Candle Festival',
  'งานประเพณีแห่เทียนพรรษา',
  'Spectacular parade of massive intricately carved wax sculptures. Local temples spend months creating towering candle floats depicting Buddhist stories. One of Isan''s most impressive festivals.',
  7, 'lunar', 2,
  '2025-07-11', '2026-07-30',
  ARRAY['Ubon Ratchathani'],
  false,
  ARRAY['Thung Si Mueang Field', 'Ubon Ratchathani City Center'],
  'Isan',
  ARRAY['Candle parade', 'Wax carving exhibitions', 'Traditional performances', 'Miss Candle pageant', 'Temple ceremonies', 'Local food fair'],
  ARRAY['Parade route gets very crowded', 'Evening illumination is magical', 'Visit temples to see candle preparation', 'Combine with Khao Phansa ceremonies'],
  'Casual',
  'religious', 'buddhist', true, 'high', 4
);

-- Bo Sang Umbrella Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'bo-sang-umbrella',
  'Bo Sang Umbrella Festival',
  'เทศกาลร่มบ่อสร้าง',
  'Celebration of traditional Lanna paper umbrella craftsmanship. The village streets are decorated with colorful handpainted umbrellas, and visitors can paint their own.',
  1, 'variable', 3,
  '2025-01-17', '2026-01-16',
  ARRAY['Chiang Mai'],
  false,
  ARRAY['Bo Sang Village, San Kamphaeng'],
  'North',
  ARRAY['Umbrella painting workshops', 'Craft demonstrations', 'Beauty pageants', 'Traditional performances', 'Buying handmade umbrellas', 'Bicycle parade'],
  ARRAY['Great for photography', 'Learn to paint your own umbrella', 'Support local artisans', 'Easily accessible from Chiang Mai', 'Morning is less crowded'],
  'Casual',
  'cultural', 'secular', true, 'medium', 5
);

-- Chiang Mai Flower Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'chiang-mai-flower-festival',
  'Chiang Mai Flower Festival',
  'งานมหกรรมไม้ดอกไม้ประดับ',
  'Celebrating the blooming season with elaborate flower floats, garden displays, and a grand parade. The city is decorated with millions of flowers including Chiang Mai''s famous orchids.',
  2, 'variable', 3,
  '2025-02-07', '2026-02-13',
  ARRAY['Chiang Mai'],
  false,
  ARRAY['Suan Buak Haad Park', 'Tha Phae Gate', 'Chiang Mai City Center'],
  'North',
  ARRAY['Flower parade', 'Garden competitions', 'Flower queen pageant', 'Orchid displays', 'Traditional dancing', 'Flower arrangement workshops'],
  ARRAY['February has perfect weather', 'Arrive early for parade spots', 'Buy flowers to support local growers', 'Beautiful photo opportunities'],
  'Casual, floral patterns welcome',
  'cultural', 'secular', false, 'high', 5
);

-- Poy Sang Long
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'poy-sang-long',
  'Poy Sang Long Festival',
  'ปอยส่างลอง',
  'Shan-style ordination ceremony where young boys are dressed as princes and carried on shoulders before becoming novice monks. The elaborate costumes and processions are uniquely beautiful.',
  3, 'lunar', 3,
  '2025-03-25', '2026-04-13',
  ARRAY['Mae Hong Son', 'Chiang Mai', 'Chiang Rai'],
  false,
  ARRAY['Mae Hong Son', 'Wat Jong Kham'],
  'North',
  ARRAY['Watching processions', 'Traditional Shan dancing', 'Temple ceremonies', 'Traditional dress displays', 'Local Shan food'],
  ARRAY['Mae Hong Son is very remote', 'Incredibly photogenic', 'Experience authentic Shan culture', 'Book accommodation well ahead', 'Fly into Mae Hong Son if possible'],
  'Modest, respectful attire',
  'religious', 'buddhist', true, 'medium', 3
);

-- Surin Elephant Round-up
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'surin-elephant-roundup',
  'Surin Elephant Round-up',
  'งานช้างสุรินทร์',
  'Thailand''s largest elephant festival featuring over 300 elephants. Includes historical battle reenactments, elephant shows, and the famous elephant breakfast. Celebrates Surin''s elephant-raising heritage.',
  11, 'fixed', '11-21', 2,
  '2025-11-21', '2026-11-21',
  ARRAY['Surin'],
  false,
  ARRAY['Surin Elephant Study Center', 'Si Narong Stadium'],
  'Isan',
  ARRAY['Elephant shows', 'Historical reenactments', 'Elephant breakfast buffet', 'Silk exhibitions', 'Traditional performances', 'Elephant village visits'],
  ARRAY['Book stadium tickets in advance', 'Debate about elephant welfare - research first', 'Visit Ban Ta Klang elephant village', 'Try local Surin silk'],
  'Casual',
  'cultural', 'secular', true, 'high', 4
);

-- Phuket Vegetarian Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'vegetarian-festival',
  'Phuket Vegetarian Festival',
  'เทศกาลกินเจ',
  'Intense Taoist festival featuring spirit mediums performing extreme acts of self-mortification. Devotees pierce their cheeks with swords and walk on hot coals. Not for the faint-hearted!',
  10, 'lunar', 9,
  '2025-10-21', '2026-09-27',
  ARRAY['Phuket', 'Bangkok', 'Trang'],
  false,
  ARRAY['Phuket Old Town', 'Jui Tui Shrine', 'Bang Neow Shrine'],
  'South',
  ARRAY['Procession watching', 'Vegetarian food stalls', 'Temple ceremonies', 'Firewalking', 'Spirit medium rituals'],
  ARRAY['Extremely graphic - prepare yourself', 'Wear white for the festival', 'Amazing vegetarian food everywhere', 'Very loud firecrackers', 'Photography may be restricted'],
  'White clothing required at temples',
  'religious', 'taoist', true, 'extreme', 3
);

-- Naga Fireballs
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'naga-fireballs',
  'Naga Fireballs Festival',
  'บั้งไฟพญานาค',
  'Mysterious glowing orbs rise from the Mekong River on the night of Ok Phansa. Locals believe they are fireballs from the Naga serpent. Science has no definitive explanation for this phenomenon.',
  10, 'lunar', 1,
  '2025-10-07', '2026-10-26',
  ARRAY['Nong Khai', 'Bueng Kan'],
  false,
  ARRAY['Phon Phisai District', 'Nong Khai riverfront'],
  'Isan',
  ARRAY['Watching for fireballs', 'Boat trips on Mekong', 'Temple ceremonies', 'Local food festival', 'Illuminated boat procession'],
  ARRAY['Book way in advance - extremely popular', 'Best viewing from 6-9pm', 'Bring binoculars', 'Scientific mystery or supernatural?', 'Also visit Sala Kaew Ku'],
  'Casual',
  'religious', 'animist', true, 'extreme', 4
);

-- Chonburi Buffalo Racing
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'buffalo-racing',
  'Chonburi Buffalo Racing Festival',
  'งานประเพณีวิ่งควาย',
  'Hilarious and chaotic water buffalo races! Farmers race their prized buffaloes before rice planting season. The buffaloes often have their own ideas about the race.',
  10, 'variable', 2,
  '2025-10-18', '2026-10-17',
  ARRAY['Chonburi'],
  false,
  ARRAY['Chonburi City Stadium'],
  'East',
  ARRAY['Buffalo racing', 'Buffalo beauty pageant', 'Traditional games', 'Local food', 'Agricultural exhibitions'],
  ARRAY['Expect chaos and comedy', 'Great for families', 'Close to Pattaya', 'Agricultural heritage event', 'Buffaloes decorated colorfully'],
  'Casual',
  'cultural', 'secular', true, 'medium', 4
);

-- Nan Boat Racing
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'nan-boat-racing',
  'Nan Long Boat Racing Festival',
  'งานแข่งเรือจังหวัดน่าน',
  'Traditional long boat races on the Nan River. Colorful boats with up to 50 rowers compete in this centuries-old tradition marking the end of Buddhist Lent.',
  10, 'lunar', 2,
  '2025-10-07', '2026-10-26',
  ARRAY['Nan'],
  false,
  ARRAY['Nan River', 'Wat Phumin area'],
  'North',
  ARRAY['Boat races', 'Illuminated boat procession', 'Traditional performances', 'Local handicrafts market', 'Temple visits'],
  ARRAY['Combine with Ok Phansa celebrations', 'Nan is a beautiful sleepy town', 'Visit Wat Phumin murals', 'Less touristy than other festivals'],
  'Casual',
  'cultural', 'buddhist', true, 'medium', 3
);

-- King Narai Reign Fair
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'king-narai-fair',
  'King Narai Reign Fair',
  'งานแผ่นดินสมเด็จพระนารายณ์มหาราช',
  'Historical reenactment festival at the 17th-century ruins of King Narai''s palace in Lopburi. Costumed performances recreate the golden age of Ayutthaya-European relations.',
  2, 'variable', 10,
  '2025-02-14', '2026-02-13',
  ARRAY['Lopburi'],
  false,
  ARRAY['Phra Narai Ratchaniwet Palace'],
  'Central',
  ARRAY['Historical reenactments', 'Light and sound shows', 'Traditional performances', 'Period costumes', 'Local food fair', 'Handicrafts market'],
  ARRAY['Rent a traditional costume', 'Evening shows are spectacular', 'Watch out for the monkeys!', 'Great for history lovers', 'Combine with Lopburi sunflower fields'],
  'Traditional Thai or period costume optional',
  'cultural', 'secular', true, 'medium', 4
);

-- Tak Bat Devo
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'tak-bat-devo',
  'Tak Bat Devo Festival',
  'ตักบาตรเทโว',
  'Unique ceremony where hundreds of monks descend from Wat Sangkat Rattana Khiri, symbolizing Buddha''s descent from heaven. Devotees offer alms along the stairway.',
  10, 'lunar', 1,
  '2025-10-08', '2026-10-27',
  ARRAY['Uthai Thani'],
  false,
  ARRAY['Wat Sangkat Rattana Khiri'],
  'Central',
  ARRAY['Alms offering', 'Monks descending stairs', 'Merit-making', 'Temple ceremonies', 'Traditional performances'],
  ARRAY['Arrive before dawn', 'Very spiritual experience', 'Uthai Thani is off tourist trail', 'Combine with Huai Kha Khaeng visit', 'Respectful white attire recommended'],
  'White or modest clothing',
  'religious', 'buddhist', true, 'medium', 2
);

-- Lopburi Monkey Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'lopburi-monkey-festival',
  'Lopburi Monkey Buffet Festival',
  'เทศกาลเลี้ยงโต๊ะจีนลิง',
  'The famous monkeys of Lopburi are treated to a feast of fruits and vegetables at the ancient Prang Sam Yot temple. Over 2,000 macaques enjoy the elaborate buffet.',
  11, 'fixed', '11-24', 1,
  '2025-11-24', '2026-11-29',
  ARRAY['Lopburi'],
  false,
  ARRAY['Prang Sam Yot'],
  'Central',
  ARRAY['Watching monkey feast', 'Photography', 'Temple visits', 'Interacting with monkeys'],
  ARRAY['Keep belongings secure - monkeys steal!', 'Don''t bring food in your bag', 'Sunglasses may be grabbed', 'Great photo opportunities', 'Slightly chaotic atmosphere'],
  'Nothing dangly or shiny',
  'cultural', 'secular', true, 'high', 5
);

-- Wonderfruit Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'wonderfruit',
  'Wonderfruit Festival',
  'เทศกาลวันเดอร์ฟรุ้ต',
  'Thailand''s premier sustainable arts and music festival. International DJs, art installations, wellness activities, and gourmet food in a beautiful outdoor setting. Think Burning Man meets Bali.',
  12, 'variable', 4,
  '2025-12-11', '2026-12-12',
  ARRAY['Chonburi'],
  false,
  ARRAY['Siam Country Club, Pattaya'],
  'East',
  ARRAY['Live music', 'Art installations', 'Yoga and wellness', 'Sustainable workshops', 'Gourmet food', 'Night parties'],
  ARRAY['Book early - sells out', 'Expensive but worth it', 'Bring sustainable cup', 'Glamping available', 'Dress creatively'],
  'Festival wear, creative costumes',
  'modern', 'secular', false, 'high', 5
);

-- Full Moon Party
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'full-moon-party',
  'Full Moon Party',
  'ฟูลมูนปาร์ตี้',
  'World-famous beach rave on Haad Rin beach. Thousands of backpackers dance until sunrise under the full moon. A rite of passage for travelers in Southeast Asia.',
  NULL, 'lunar', 1,
  NULL, NULL,
  ARRAY['Surat Thani'],
  false,
  ARRAY['Haad Rin Beach, Koh Phangan'],
  'South',
  ARRAY['All-night dancing', 'Fire shows', 'Neon body paint', 'Beach bars', 'Sunrise watching'],
  ARRAY['Wear shoes - broken glass on beach', 'Don''t take valuables', 'Bucket drinks are strong', 'Book ferries in advance', 'Stay on Koh Phangan that night'],
  'Neon colors, swimwear',
  'modern', 'secular', false, 'extreme', 5
);

-- Isan Silk Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'khon-kaen-silk-festival',
  'Khon Kaen Silk Festival',
  'เทศกาลไหมนานาชาติ',
  'Celebration of Isan''s famous mudmee silk weaving tradition. Features fashion shows, weaving demonstrations, and the opportunity to buy directly from artisans.',
  12, 'variable', 10,
  '2025-11-29', '2026-11-28',
  ARRAY['Khon Kaen'],
  false,
  ARRAY['Khon Kaen City Center', 'Chonnabot District'],
  'Isan',
  ARRAY['Silk fashion shows', 'Weaving demonstrations', 'Direct artisan purchases', 'Cultural performances', 'Local food fair'],
  ARRAY['Buy authentic mudmee silk', 'Visit Chonnabot for village weaving', 'Great prices direct from weavers', 'Beautiful traditional patterns'],
  'Casual',
  'cultural', 'secular', true, 'medium', 3
);

-- Phi Khon Nam (Water Spirit Festival)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'phi-khon-nam',
  'Phi Khon Nam Water Spirit Festival',
  'ประเพณีผีขนน้ำ',
  'Rare animist water festival in rural Surin where villagers paddle boats while wearing ghostly white face paint. Ancient tradition honoring water spirits.',
  10, 'lunar', 1,
  '2025-10-07', '2026-10-26',
  ARRAY['Surin'],
  false,
  ARRAY['Ban Non Sung, Surin'],
  'Isan',
  ARRAY['Ghost boat races', 'Traditional rituals', 'Spirit offerings', 'Local village experience'],
  ARRAY['Very remote and local', 'Truly authentic experience', 'Few tourists ever see this', 'Need local guide', 'Photography welcome'],
  'Casual',
  'cultural', 'animist', true, 'low', 2
);

-- Nakhon Si Thammarat Tamboon Duean Sib
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'tamboon-deuan-sib',
  'Tamboon Deuan Sib (Tenth Lunar Month Festival)',
  'ทำบุญเดือนสิบ',
  'Southern Thai ancestor worship festival. Families prepare elaborate food offerings for deceased relatives whose spirits are believed to return during this time. Similar to Chinese Ghost Festival.',
  9, 'lunar', 15,
  '2025-09-20', '2026-10-09',
  ARRAY['Nakhon Si Thammarat', 'Songkhla', 'Surat Thani'],
  false,
  ARRAY['Wat Phra Mahathat', 'Nakhon Si Thammarat City'],
  'South',
  ARRAY['Ancestor food offerings', 'Temple ceremonies', 'Traditional performances', 'Local southern food'],
  ARRAY['Experience authentic southern Thai culture', 'Off the tourist trail', 'Wat Phra Mahathat is stunning', 'Local desserts are amazing'],
  'Modest white attire',
  'religious', 'buddhist', true, 'medium', 2
);

-- Sart Thai (Ancestors Day)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'sart-thai',
  'Sart Thai (Thai Ancestors Day)',
  'สารทไทย',
  'Traditional Thai Memorial Day when families make merit for deceased ancestors. Special Krathong are offered to monks containing rice, fruit, and household items.',
  9, 'lunar', 1,
  '2025-09-24', '2026-10-13',
  NULL, true,
  ARRAY['Any major temple'],
  NULL,
  ARRAY['Temple merit-making', 'Food offerings', 'Ancestor remembrance', 'Krathong preparation'],
  ARRAY['Low-key but meaningful', 'Good day to visit temples', 'Observe Thai family traditions', 'Respectful attire'],
  'Modest clothing',
  'religious', 'buddhist', false, 'low', 3
);

-- Hua Hin Jazz Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'hua-hin-jazz',
  'Hua Hin Jazz Festival',
  'เทศกาลแจ๊สหัวหิน',
  'Free beach jazz festival bringing international and Thai musicians to Hua Hin beach. Relaxed atmosphere with great music, food, and seaside vibes.',
  6, 'variable', 2,
  '2025-06-13', '2026-06-12',
  ARRAY['Prachuap Khiri Khan'],
  false,
  ARRAY['Hua Hin Beach'],
  'Central',
  ARRAY['Jazz concerts', 'Beach dining', 'Seafood festival', 'Art exhibitions'],
  ARRAY['Free entry', 'Book Hua Hin hotels early', 'Bring beach chair', 'Great seafood during festival'],
  'Smart casual',
  'modern', 'secular', false, 'medium', 5
);

-- Pattaya International Fireworks Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'pattaya-fireworks',
  'Pattaya International Fireworks Festival',
  'เทศกาลพลุนานาชาติพัทยา',
  'International teams compete with spectacular fireworks displays over Pattaya Beach. One of Asia''s premier pyrotechnic events.',
  11, 'variable', 2,
  '2025-11-28', '2026-11-27',
  ARRAY['Chonburi'],
  false,
  ARRAY['Pattaya Beach', 'Walking Street'],
  'East',
  ARRAY['Fireworks competitions', 'Beach parties', 'Live music', 'Food festival'],
  ARRAY['Best views from beach hotels', 'Pattaya gets very crowded', 'Each night different countries', 'Book well in advance'],
  'Casual',
  'modern', 'secular', false, 'high', 5
);

-- Trang Vegetarian Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'trang-vegetarian',
  'Trang Vegetarian Festival',
  'เทศกาลกินเจตรัง',
  'Lesser-known alternative to Phuket''s vegetarian festival. Same Taoist traditions but smaller scale and more local atmosphere. Features unique southern Thai vegetarian cuisine.',
  10, 'lunar', 9,
  '2025-10-21', '2026-09-27',
  ARRAY['Trang'],
  false,
  ARRAY['Trang Old Town', 'Kiuong Ong shrine'],
  'South',
  ARRAY['Spirit medium rituals', 'Vegetarian food stalls', 'Temple ceremonies', 'Processions'],
  ARRAY['Less intense than Phuket', 'Amazing vegetarian dim sum', 'Authentic local experience', 'Combine with Trang islands'],
  'White clothing',
  'religious', 'taoist', true, 'medium', 3
);

-- Lamphun Longan Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'lamphun-longan',
  'Lamphun Longan Festival',
  'เทศกาลลำไยลำพูน',
  'Celebration of Lamphun''s famous longan harvest. Features fruit floats, longan eating contests, and the chance to buy Thailand''s sweetest longans directly from orchards.',
  8, 'variable', 10,
  '2025-08-08', '2026-08-07',
  ARRAY['Lamphun'],
  false,
  ARRAY['Lamphun City Center', 'Lamphun orchards'],
  'North',
  ARRAY['Fruit float parade', 'Longan tasting', 'Beauty pageant', 'Orchard visits', 'Agricultural fair'],
  ARRAY['Peak longan season', 'Buy dried longan', 'Visit Wat Phra That Hariphunchai', 'Easy day trip from Chiang Mai'],
  'Casual',
  'cultural', 'secular', true, 'medium', 4
);

-- Saraburi Sunflower Blooming
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'saraburi-sunflowers',
  'Saraburi Sunflower Fields',
  'ทุ่งดอกทานตะวัน',
  'Thousands of hectares of sunflowers bloom in Saraburi province. Not technically a festival, but locals and tourists flock to the fields for photos and flower appreciation.',
  11, 'variable', 30,
  '2025-11-15', '2026-11-14',
  ARRAY['Saraburi', 'Lopburi'],
  false,
  ARRAY['Pasak Jolasid Dam area', 'Route 21 fields'],
  'Central',
  ARRAY['Photography', 'Sunflower field walks', 'Local produce', 'Farm visits'],
  ARRAY['Best in November-December', 'Morning light is best', 'Combine with Lopburi', 'Peak blooming varies yearly'],
  'Casual, sun protection',
  'cultural', 'secular', true, 'medium', 4
);

-- Boon Khao Pradap Din
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'boon-khao-pradap-din',
  'Boon Khao Pradap Din',
  'บุญข้าวประดับดิน',
  'Isan rice harvest festival where communities prepare food for wandering spirits. Offerings are placed in rice paddies, orchards, and the village perimeter.',
  9, 'lunar', 1,
  '2025-09-24', '2026-10-13',
  ARRAY['Udon Thani', 'Khon Kaen', 'Ubon Ratchathani'],
  false,
  ARRAY['Rural Isan villages'],
  'Isan',
  ARRAY['Spirit offerings', 'Rice paddy rituals', 'Community gatherings', 'Traditional Isan food'],
  ARRAY['Very local and rural', 'Need local connections', 'Authentic animist tradition', 'Best with Thai guide'],
  'Casual',
  'cultural', 'animist', true, 'low', 1
);

-- Poi Sang Long (second entry - focusing on different aspect)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'poi-luang',
  'Poi Luang Festival',
  'ปอยหลวง',
  'Northern Thai temple fair celebrating the completion of Buddhist building projects. Features elaborate processions, traditional Lanna performances, and community merit-making.',
  4, 'lunar', 3,
  '2025-04-05', '2026-03-25',
  ARRAY['Nan', 'Phrae', 'Lampang'],
  false,
  ARRAY['Nan Province temples', 'Phrae Old Town'],
  'North',
  ARRAY['Temple processions', 'Lanna performances', 'Merit-making', 'Traditional music', 'Community feasts'],
  ARRAY['Dates vary by temple', 'Check locally for schedules', 'Beautiful traditional dress', 'Authentic northern culture'],
  'Modest attire',
  'religious', 'buddhist', true, 'low', 2
);

-- Bangkok Countdown
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'bangkok-countdown',
  'Bangkok New Year Countdown',
  'เคาท์ดาวน์กรุงเทพ',
  'Major New Year''s Eve celebrations across Bangkok with fireworks, concerts, and street parties. CentralWorld has the biggest countdown event in Southeast Asia.',
  12, 'fixed', '12-31', 1,
  '2025-12-31', '2026-12-31',
  ARRAY['Bangkok'],
  false,
  ARRAY['CentralWorld', 'ICONSIAM', 'Asiatique', 'Khao San Road'],
  'Bangkok',
  ARRAY['Fireworks', 'Live concerts', 'Street parties', 'Temple visits'],
  ARRAY['CentralWorld is massive', 'ICONSIAM has river views', 'Traffic is terrible', 'MRT runs late'],
  'Party wear',
  'modern', 'secular', false, 'extreme', 5
);

-- Royal Ploughing Ceremony
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'royal-ploughing',
  'Royal Ploughing Ceremony',
  'พระราชพิธีพืชมงคล',
  'Ancient Brahman ceremony marking the start of rice planting season. Sacred oxen predict the harvest, and people scramble for blessed rice seeds from the ceremonial field.',
  5, 'variable', 1,
  '2025-05-09', '2026-05-09',
  ARRAY['Bangkok'],
  false,
  ARRAY['Sanam Luang'],
  'Bangkok',
  ARRAY['Royal ceremony viewing', 'Blessed seed collection', 'Traditional rituals', 'Agricultural predictions'],
  ARRAY['Arrive very early for good spot', 'Dress modestly', 'Royal family may attend', 'Historic tradition dating to 13th century'],
  'Modest, respectful attire',
  'royal', 'hindu', false, 'high', 4
);

-- Queen Sirikit Birthday
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, date_fixed, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'mothers-day',
  'Mother''s Day (Queen Sirikit Birthday)',
  'วันแม่แห่งชาติ',
  'Thai Mother''s Day celebrates the birthday of Queen Sirikit, the Queen Mother. Thais wear blue and offer jasmine garlands to their mothers.',
  8, 'fixed', '08-12', 1,
  '2025-08-12', '2026-08-12',
  NULL, true,
  ARRAY['Bangkok', 'All major cities'],
  NULL,
  ARRAY['Family gatherings', 'Merit-making', 'Jasmine offerings', 'Blue clothing'],
  ARRAY['Wear blue (Queen''s color)', 'Public holiday', 'Beautiful temple decorations', 'Restaurants may be busy'],
  'Blue clothing',
  'royal', 'secular', false, 'medium', 4
);

-- King Rama X Birthday
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, date_fixed, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'kings-birthday',
  'King''s Birthday (Rama X)',
  'วันเฉลิมพระชนมพรรษา',
  'Celebration of King Vajiralongkorn''s birthday. Government buildings and streets are decorated with yellow, and major ceremonies take place at the Grand Palace.',
  7, 'fixed', '07-28', 1,
  '2025-07-28', '2026-07-28',
  NULL, true,
  ARRAY['Bangkok Grand Palace', 'All major cities'],
  NULL,
  ARRAY['Royal ceremonies', 'Merit-making', 'Fireworks', 'Illuminations'],
  ARRAY['Wear yellow (King''s color)', 'Public holiday', 'Evening illuminations beautiful', 'Grand Palace area crowded'],
  'Yellow clothing',
  'royal', 'secular', false, 'high', 4
);

-- Father's Day (King Rama IX)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, date_fixed, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'fathers-day',
  'Father''s Day (King Bhumibol Birthday)',
  'วันพ่อแห่งชาติ',
  'Thai Father''s Day on the birthday of the late King Bhumibol (Rama IX). Now a memorial day, Thais wear yellow and remember the beloved king.',
  12, 'fixed', '12-05', 1,
  '2025-12-05', '2026-12-05',
  NULL, true,
  ARRAY['Sanam Luang, Bangkok', 'All major cities'],
  NULL,
  ARRAY['Candlelight ceremonies', 'Merit-making', 'Family gatherings', 'Memorial events'],
  ARRAY['Wear yellow (Rama IX color)', 'Emotional day for Thais', 'Public holiday', 'Beautiful evening ceremonies'],
  'Yellow clothing',
  'royal', 'secular', false, 'high', 4
);

-- Chakri Day
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, date_fixed, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'chakri-day',
  'Chakri Memorial Day',
  'วันจักรี',
  'Commemorates the founding of the Chakri Dynasty by King Rama I in 1782. Royal ceremonies at the Grand Palace and the founding of Bangkok.',
  4, 'fixed', '04-06', 1,
  '2025-04-06', '2026-04-06',
  NULL, true,
  ARRAY['Grand Palace', 'Bangkok'],
  'Bangkok',
  ARRAY['Royal wreath laying', 'Palace ceremonies', 'Historical remembrance'],
  ARRAY['Grand Palace may have restricted access', 'Public holiday', 'Learn about Chakri history'],
  'Formal, respectful attire',
  'royal', 'secular', false, 'low', 3
);

-- Constitution Day
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, date_fixed, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'constitution-day',
  'Constitution Day',
  'วันรัฐธรรมนูญ',
  'Marks the granting of Thailand''s first permanent constitution in 1932. Government ceremonies and public holiday.',
  12, 'fixed', '12-10', 1,
  '2025-12-10', '2026-12-10',
  NULL, true,
  ARRAY['Democracy Monument', 'Bangkok'],
  'Bangkok',
  ARRAY['Government ceremonies', 'Historical remembrance'],
  ARRAY['Public holiday', 'Government offices closed', 'Historical significance'],
  'Casual',
  'secular', 'secular', false, 'low', 3
);

-- Coronation Day
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, date_fixed, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'coronation-day',
  'Coronation Day',
  'วันฉัตรมงคล',
  'Commemorates the coronation of King Vajiralongkorn (Rama X) in 2019. Royal ceremonies and public celebrations.',
  5, 'fixed', '05-04', 1,
  '2025-05-04', '2026-05-04',
  NULL, true,
  ARRAY['Grand Palace', 'Bangkok'],
  'Bangkok',
  ARRAY['Royal ceremonies', 'Merit-making', 'Illuminations'],
  ARRAY['Wear yellow', 'Public holiday', 'Royal celebrations'],
  'Yellow clothing',
  'royal', 'secular', false, 'medium', 3
);

-- Elephant Day
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, date_fixed, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'elephant-day',
  'National Elephant Day',
  'วันช้างไทย',
  'Celebrating Thailand''s national animal, the elephant. Elephant sanctuaries and conservation centers host special events and elephant buffets.',
  3, 'fixed', '03-13', 1,
  '2025-03-13', '2026-03-13',
  ARRAY['Chiang Mai', 'Surin', 'Ayutthaya'],
  false,
  ARRAY['Elephant Nature Park', 'Thai Elephant Conservation Center'],
  NULL,
  ARRAY['Elephant feeding', 'Conservation awareness', 'Educational programs', 'Elephant processions'],
  ARRAY['Support ethical elephant tourism', 'Research elephant camps carefully', 'No riding - choose observation'],
  'Casual',
  'cultural', 'secular', true, 'medium', 5
);

-- Bun Pha Wet (Isan Buddhist)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'bun-pha-wet',
  'Bun Pha Wet Festival',
  'บุญผะเหวด',
  'Major Isan Buddhist festival featuring 24-hour marathon chanting of the Vessantara Jataka, the story of Buddha''s penultimate life. Elaborate temple decorations and village processions.',
  3, 'lunar', 2,
  '2025-03-13', '2026-03-02',
  ARRAY['Roi Et', 'Mahasarakham', 'Kalasin'],
  false,
  ARRAY['Roi Et Province', 'Wat Burapha Phiram'],
  'Isan',
  ARRAY['All-night chanting', 'Temple processions', 'Buddha story recitation', 'Merit-making', 'Traditional Isan performances'],
  ARRAY['Roi Et has biggest celebrations', 'Marathon chanting is impressive', 'Very local experience', 'Wear white for temple'],
  'White, modest temple attire',
  'religious', 'buddhist', true, 'medium', 2
);

-- Magha Puja Fair (Nakhon Pathom)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'nakhon-pathom-fair',
  'Phra Pathom Chedi Fair',
  'งานนมัสการพระปฐมเจดีย์',
  'Temple fair at Thailand''s tallest stupa, Phra Pathom Chedi. Features traditional performances, food stalls, and elaborate candlelit processions.',
  11, 'lunar', 9,
  '2025-11-01', '2026-10-20',
  ARRAY['Nakhon Pathom'],
  false,
  ARRAY['Phra Pathom Chedi'],
  'Central',
  ARRAY['Temple fair', 'Wien thien procession', 'Traditional performances', 'Local food stalls', 'Merit-making'],
  ARRAY['Easy day trip from Bangkok', 'Evening candlelit ceremony is beautiful', 'Try local noodles', 'Temple is impressive'],
  'Modest temple attire',
  'religious', 'buddhist', true, 'high', 4
);
