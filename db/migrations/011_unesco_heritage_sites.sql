-- Migration: Add 5 missing UNESCO World Heritage Sites
-- Thailand has 8 total UNESCO sites; we had only 3 (Ayutthaya, Sukhothai, Ban Chiang)

-- =============================================
-- 1. Thungyai-Huai Kha Khaeng Wildlife Sanctuaries (UNESCO 1991, Natural)
-- =============================================

INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'thungyai-huai-kha-khaeng',
  'Thungyai-Huai Kha Khaeng Wildlife Sanctuaries',
  'Thailand''s largest protected wildlife area and one of Southeast Asia''s most important forest complexes.',
  'Spanning over 6,200 square kilometers across Uthai Thani, Kanchanaburi, and Tak provinces, Thungyai-Huai Kha Khaeng is one of the largest and most ecologically significant protected areas in mainland Southeast Asia. The sanctuaries contain almost all the forest types of continental Southeast Asia and are home to an extraordinary diversity of wildlife, including tigers, elephants, gaur, tapirs, and over 400 bird species. It was one of the first natural sites in Thailand to receive UNESCO recognition.',
  'Nature',
  'Western Forest Complex',
  'Uthai Thani',
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
  false, false,
  '{"nature": 10, "wildlife": 10, "hiking": 9, "photography": 9, "adventure": 8, "birdwatching": 9}',
  'heritage',
  '{
    "constructionEra": "Prehistoric",
    "unescoStatus": "world_heritage_site",
    "unescoInscriptionYear": 1991,
    "unescoCriteria": ["vii", "viii", "ix", "x"],
    "openingHours": "Restricted access - permit required",
    "bestTimeToVisit": "November to February (cool season)",
    "heritageType": "wildlife_sanctuary",
    "historicalSignificance": "Largest protected wildlife area in mainland Southeast Asia, home to endangered tigers and elephants"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 2. Dong Phayayen-Khao Yai Forest Complex (UNESCO 2005, Natural)
-- =============================================

INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'dong-phayayen-khao-yai',
  'Dong Phayayen-Khao Yai Forest Complex',
  'Thailand''s most accessible UNESCO natural site, featuring Khao Yai National Park with lush jungles and waterfalls.',
  'The Dong Phayayen-Khao Yai Forest Complex stretches over 230 kilometers between Nakhon Ratchasima and the Cambodian border. At its heart is Khao Yai National Park, Thailand''s oldest and most popular national park. The complex is home to over 800 species of fauna including 112 mammal species, 392 bird species, and critical populations of tigers, elephants, and gibbons. Haew Narok and Haew Suwat waterfalls are major highlights, with the latter featuring in the film "The Beach."',
  'Nature',
  'Khao Yai National Park',
  'Nakhon Ratchasima',
  'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800',
  false, false,
  '{"nature": 10, "wildlife": 10, "hiking": 10, "photography": 10, "waterfalls": 10, "birdwatching": 9, "adventure": 9}',
  'heritage',
  '{
    "constructionEra": "Modern",
    "unescoStatus": "world_heritage_site",
    "unescoInscriptionYear": 2005,
    "unescoCriteria": ["x"],
    "entryFeeTHB": 40,
    "entryFeeForeignerTHB": 400,
    "openingHours": "06:00-18:00",
    "bestTimeToVisit": "November to February for cool weather and wildlife viewing",
    "heritageType": "national_park",
    "historicalSignificance": "Thailand''s first national park (1962), critical wildlife corridor connecting to Cambodia"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 3. Kaeng Krachan Forest Complex (UNESCO 2021, Natural)
-- =============================================

INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'kaeng-krachan-forest-complex',
  'Kaeng Krachan Forest Complex',
  'Thailand''s largest national park, known for sea of mist views, diverse birdlife, and pristine rainforest.',
  'Kaeng Krachan Forest Complex encompasses Thailand''s largest national park along the Tenasserim mountain range bordering Myanmar. Covering over 4,800 square kilometers across Phetchaburi and Prachuap Khiri Khan provinces, it protects one of the largest remaining areas of tropical rainforest in mainland Southeast Asia. The park is renowned for its spectacular early-morning sea of mist views from Panoen Thung camp, world-class birdwatching (over 400 species), and populations of wild elephants, leopards, and the critically endangered Siamese crocodile.',
  'Nature',
  'Kaeng Krachan National Park',
  'Phetchaburi',
  'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800',
  false, false,
  '{"nature": 10, "wildlife": 10, "hiking": 9, "photography": 10, "birdwatching": 10, "camping": 8, "adventure": 8}',
  'heritage',
  '{
    "constructionEra": "Modern",
    "unescoStatus": "world_heritage_site",
    "unescoInscriptionYear": 2021,
    "unescoCriteria": ["x"],
    "entryFeeTHB": 20,
    "entryFeeForeignerTHB": 300,
    "openingHours": "06:00-18:00 (some areas seasonally closed)",
    "bestTimeToVisit": "November to April, early morning for sea of mist",
    "heritageType": "national_park",
    "historicalSignificance": "Largest national park in Thailand, most recently inscribed natural UNESCO site"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 4. The Ancient Town of Si Thep (UNESCO 2023, Cultural)
-- =============================================

INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'si-thep-historical-park',
  'The Ancient Town of Si Thep',
  'A 1,500-year-old Dvaravati city with unique blend of Hindu and Buddhist architecture, Thailand''s newest cultural UNESCO site.',
  'The Ancient Town of Si Thep and its Associated Dvaravati Monuments in Phetchabun province represent one of the most important pre-Thai civilizations. Dating from the 6th to 13th centuries, Si Thep was a thriving city of the Dvaravati culture with a unique blend of Hindu and Buddhist influences. The site features two moated towns, Muang Nai (inner city) and Muang Nok (outer city), with remarkable monuments including Khao Klang Nai and Khao Klang Nok. The archaeological finds here demonstrate the easternmost extent of Indian cultural influence in Southeast Asia.',
  'Culture',
  'Si Thep Historical Park',
  'Phetchabun',
  'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  true, false,
  '{"culture": 10, "history": 10, "photography": 9, "archaeology": 10, "architecture": 9, "offbeat": 10}',
  'heritage',
  '{
    "constructionDate": "500",
    "constructionEra": "Dvaravati Period",
    "architecturalStyles": ["Dvaravati", "Khmer influence", "Hindu-Buddhist"],
    "unescoStatus": "world_heritage_site",
    "unescoInscriptionYear": 2023,
    "unescoCriteria": ["ii", "iii"],
    "entryFeeTHB": 20,
    "entryFeeForeignerTHB": 100,
    "openingHours": "08:00-16:30",
    "dressCode": "Casual",
    "bestTimeToVisit": "November to February for cool weather",
    "heritageType": "archaeological",
    "historicalSignificance": "Major Dvaravati city demonstrating Indian cultural influence in Southeast Asia, inscribed 2023"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 5. Phu Phrabat Historical Park (UNESCO 2024, Cultural)
-- =============================================

INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'phu-phrabat-historical-park',
  'Phu Phrabat Historical Park',
  'Dramatic sandstone rock formations with prehistoric cave paintings and ancient Buddhist temples, Thailand''s latest UNESCO site.',
  'Phu Phrabat Historical Park in Udon Thani''s Ban Phue district features extraordinary mushroom-shaped sandstone formations that have been sacred sites for thousands of years. The park contains evidence of human occupation spanning from prehistoric times through the Dvaravati, Khmer, and Lao periods. Ancient cave paintings, stone tools, and Buddhist boundary markers (sema stones) are found throughout. The iconic Hor Nang Usa rock shelter, associated with a local legend of a princess, is the park''s most photographed feature. Inscribed in 2024 as Thailand''s most recent UNESCO World Heritage Site.',
  'Culture',
  'Ban Phue District',
  'Udon Thani',
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
  true, false,
  '{"culture": 10, "history": 10, "photography": 10, "archaeology": 10, "nature": 8, "hiking": 8, "offbeat": 10}',
  'heritage',
  '{
    "constructionDate": "-3000",
    "constructionEra": "Prehistoric",
    "architecturalStyles": ["Natural sandstone", "Dvaravati", "Khmer"],
    "unescoStatus": "world_heritage_site",
    "unescoInscriptionYear": 2024,
    "unescoCriteria": ["iii"],
    "entryFeeTHB": 20,
    "entryFeeForeignerTHB": 100,
    "openingHours": "08:00-16:30",
    "dressCode": "Comfortable hiking shoes recommended",
    "bestTimeToVisit": "November to February, early morning for best light",
    "heritageType": "archaeological",
    "historicalSignificance": "Continuous human occupation for 5,000+ years, Thailand''s newest UNESCO site (2024)"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- HERITAGE IMAGES
-- =============================================

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400', 'Dense tropical forest in Thungyai-Huai Kha Khaeng Wildlife Sanctuary', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'thungyai-huai-kha-khaeng'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200', 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=400', 'Khao Yai waterfall in Dong Phayayen forest complex', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'dong-phayayen-khao-yai'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=1200', 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=400', 'Sea of mist at Kaeng Krachan National Park', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'kaeng-krachan-forest-complex'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1200', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400', 'Ancient Dvaravati ruins at Si Thep Historical Park', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'si-thep-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400', 'Sandstone formations at Phu Phrabat Historical Park', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'phu-phrabat-historical-park'
ON CONFLICT DO NOTHING;

-- =============================================
-- HERITAGE EVENTS (Timeline)
-- =============================================

-- Thungyai-Huai Kha Khaeng timeline
INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1972, 'Modern', 'Huai Kha Khaeng Sanctuary Established', 'Huai Kha Khaeng Wildlife Sanctuary was officially established as a protected area.', 'designation', 1
FROM attractions WHERE slug = 'thungyai-huai-kha-khaeng'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1974, 'Modern', 'Thungyai Naresuan Sanctuary Established', 'Thungyai Naresuan Wildlife Sanctuary was designated, named after the famous Thai warrior king.', 'designation', 2
FROM attractions WHERE slug = 'thungyai-huai-kha-khaeng'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1991, 'Modern', 'UNESCO World Heritage Inscription', 'Inscribed as a UNESCO Natural World Heritage Site for its exceptional biodiversity and intact forest ecosystems.', 'designation', 3
FROM attractions WHERE slug = 'thungyai-huai-kha-khaeng'
ON CONFLICT DO NOTHING;

-- Dong Phayayen-Khao Yai timeline
INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1962, 'Modern', 'Khao Yai National Park Established', 'Thailand''s first national park was officially established, setting the standard for conservation in the country.', 'designation', 1
FROM attractions WHERE slug = 'dong-phayayen-khao-yai'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1993, 'Modern', 'ASEAN Heritage Park', 'Khao Yai was declared an ASEAN Heritage Park, recognizing its regional conservation importance.', 'designation', 2
FROM attractions WHERE slug = 'dong-phayayen-khao-yai'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 2005, 'Modern', 'UNESCO World Heritage Inscription', 'The entire Dong Phayayen-Khao Yai Forest Complex was inscribed as a UNESCO Natural World Heritage Site.', 'designation', 3
FROM attractions WHERE slug = 'dong-phayayen-khao-yai'
ON CONFLICT DO NOTHING;

-- Kaeng Krachan timeline
INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1981, 'Modern', 'National Park Established', 'Kaeng Krachan National Park was officially established as Thailand''s largest national park.', 'designation', 1
FROM attractions WHERE slug = 'kaeng-krachan-forest-complex'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 2021, 'Modern', 'UNESCO World Heritage Inscription', 'Inscribed as a UNESCO Natural World Heritage Site for its outstanding biodiversity and importance as a wildlife habitat.', 'designation', 2
FROM attractions WHERE slug = 'kaeng-krachan-forest-complex'
ON CONFLICT DO NOTHING;

-- Si Thep timeline
INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, is_approximate, sort_order)
SELECT id, 500, 'Dvaravati Period', 'City Founded', 'Si Thep was established as a Dvaravati city, becoming a major center of Hindu-Buddhist culture.', 'construction', true, 1
FROM attractions WHERE slug = 'si-thep-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, is_approximate, sort_order)
SELECT id, 1100, 'Khmer Period', 'Khmer Influence Period', 'The city came under Khmer cultural influence, with new architectural elements added to existing structures.', 'event', true, 2
FROM attractions WHERE slug = 'si-thep-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1984, 'Modern', 'Historical Park Established', 'Si Thep Historical Park was officially opened to preserve and showcase the ancient ruins.', 'designation', 3
FROM attractions WHERE slug = 'si-thep-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 2023, 'Modern', 'UNESCO World Heritage Inscription', 'Inscribed as a UNESCO Cultural World Heritage Site for its exceptional testimony to Dvaravati civilization.', 'designation', 4
FROM attractions WHERE slug = 'si-thep-historical-park'
ON CONFLICT DO NOTHING;

-- Phu Phrabat timeline
INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, is_approximate, sort_order)
SELECT id, -3000, 'Prehistoric', 'Earliest Human Occupation', 'Prehistoric communities began using the rock shelters, leaving behind cave paintings and stone tools.', 'event', true, 1
FROM attractions WHERE slug = 'phu-phrabat-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, is_approximate, sort_order)
SELECT id, 700, 'Dvaravati Period', 'Buddhist Sema Stones Placed', 'Dvaravati-period communities placed Buddhist boundary stones (sema) around sacred rock formations.', 'construction', true, 2
FROM attractions WHERE slug = 'phu-phrabat-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1991, 'Modern', 'Historical Park Established', 'Phu Phrabat was designated as a Historical Park to protect its archaeological and natural heritage.', 'designation', 3
FROM attractions WHERE slug = 'phu-phrabat-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 2024, 'Modern', 'UNESCO World Heritage Inscription', 'Inscribed as Thailand''s most recent UNESCO World Heritage Site, recognized for its 5,000+ years of human cultural evidence.', 'designation', 4
FROM attractions WHERE slug = 'phu-phrabat-historical-park'
ON CONFLICT DO NOTHING;
