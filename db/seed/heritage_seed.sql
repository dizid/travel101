-- Heritage Sites Seed Data
-- Thai UNESCO World Heritage Sites and famous historical attractions

-- =============================================
-- HERITAGE ATTRACTIONS
-- =============================================

-- Ayutthaya Historical Park (UNESCO World Heritage)
INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'ayutthaya-historical-park',
  'Ayutthaya Historical Park',
  'Ancient capital of Siam, featuring temple ruins, Buddha statues, and palaces from the 14th-18th centuries.',
  'Ayutthaya was the second capital of the Siamese Kingdom, founded in 1350. At its peak, it was one of the world''s largest cities with about one million inhabitants. The city was destroyed by the Burmese in 1767, leaving behind magnificent ruins that are now a UNESCO World Heritage Site. The park covers the old city island and surrounding areas, featuring over 400 temples, palaces, and statues.',
  'Culture',
  'Ayutthaya Island',
  'Phra Nakhon Si Ayutthaya',
  'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800',
  false, false,
  '{"culture": 10, "history": 10, "photography": 9, "temples": 10, "architecture": 10, "art": 8}',
  'heritage',
  '{
    "constructionDate": "1350",
    "constructionEra": "Ayutthaya Period",
    "architecturalStyles": ["Khmer", "Thai", "Mon"],
    "unescoStatus": "world_heritage_site",
    "unescoInscriptionYear": 1991,
    "unescoCriteria": ["iii"],
    "kingdomDynasty": "Ayutthaya Kingdom",
    "religiousSignificance": "Buddhist temples and royal palace complex",
    "entryFeeTHB": 50,
    "entryFeeForeignerTHB": 50,
    "openingHours": "08:00-18:00",
    "dressCode": "Shoulders and knees covered for temples",
    "bestTimeToVisit": "Early morning or late afternoon",
    "heritageType": "ruins",
    "historicalSignificance": "Capital of Siam for 417 years"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Sukhothai Historical Park (UNESCO World Heritage)
INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'sukhothai-historical-park',
  'Sukhothai Historical Park',
  'Birthplace of Thai civilization with ancient temples, Buddha statues, and the distinctive Sukhothai art style.',
  'Sukhothai, meaning "Dawn of Happiness," was the first capital of unified Siam, founded in 1238. It represents the golden age of Thai civilization, where Thai alphabet, art, and architecture flourished. The park contains the ruins of the royal palace and 26 temples within the old city walls, plus 70 more in the surrounding area. The distinctive Sukhothai Buddha style, known for its graceful and serene appearance, originated here.',
  'Culture',
  'Sukhothai Old Town',
  'Sukhothai',
  'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
  false, false,
  '{"culture": 10, "history": 10, "photography": 10, "temples": 10, "architecture": 10, "cycling": 8}',
  'heritage',
  '{
    "constructionDate": "1238",
    "constructionEra": "Sukhothai Period",
    "architecturalStyles": ["Sukhothai", "Khmer influence"],
    "unescoStatus": "world_heritage_site",
    "unescoInscriptionYear": 1991,
    "unescoCriteria": ["i", "iii"],
    "kingdomDynasty": "Sukhothai Kingdom",
    "religiousSignificance": "Major Buddhist center, birthplace of Thai Buddhism",
    "entryFeeTHB": 100,
    "entryFeeForeignerTHB": 100,
    "openingHours": "06:00-21:00",
    "dressCode": "Casual, comfortable for cycling",
    "bestTimeToVisit": "Early morning or during Loy Krathong",
    "heritageType": "ruins",
    "historicalSignificance": "First capital of unified Thailand, birthplace of Thai alphabet"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Grand Palace & Wat Phra Kaew
INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'grand-palace-bangkok',
  'Grand Palace & Wat Phra Kaew',
  'Iconic royal palace complex housing the sacred Emerald Buddha, Thailand''s most revered image.',
  'The Grand Palace has been the official residence of the Kings of Siam since 1782. The complex covers 218,400 square meters and contains over 100 buildings. Wat Phra Kaew (Temple of the Emerald Buddha) is Thailand''s most sacred Buddhist temple, housing the Emerald Buddha, a 66cm jade statue that is the palladium of the Thai Kingdom. The Buddha''s robes are changed three times a year by the King himself.',
  'Culture',
  'Rattanakosin Island',
  'Bangkok',
  'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800',
  false, false,
  '{"culture": 10, "history": 10, "photography": 9, "temples": 10, "architecture": 10, "art": 10, "royalty": 10}',
  'heritage',
  '{
    "constructionDate": "1782",
    "constructionEra": "Rattanakosin Period",
    "architecturalStyles": ["Thai", "Rattanakosin", "European influence"],
    "unescoStatus": null,
    "kingdomDynasty": "Chakri Dynasty",
    "religiousSignificance": "Home of Thailand most sacred Buddha image",
    "entryFeeTHB": 500,
    "entryFeeForeignerTHB": 500,
    "openingHours": "08:30-15:30",
    "dressCode": "Strict: Long pants, covered shoulders, no sandals",
    "bestTimeToVisit": "Early morning when gates open",
    "heritageType": "palace",
    "historicalSignificance": "Official residence of Thai monarchy since 1782"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Wat Arun
INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'wat-arun',
  'Wat Arun (Temple of Dawn)',
  'Stunning riverside temple with a 70-meter tall prang covered in colorful porcelain and seashells.',
  'Wat Arun Ratchawararam is one of Thailand''s most recognizable landmarks. The temple''s distinctive spires are decorated with colorful porcelain pieces and seashells, creating a glittering effect at sunrise and sunset. Named after Aruna, the Hindu god of dawn, the temple dates back to the Ayutthaya period but was significantly expanded during the reign of King Rama II. Visitors can climb partway up the central prang for panoramic river views.',
  'Culture',
  'Thonburi',
  'Bangkok',
  'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
  false, false,
  '{"culture": 10, "history": 9, "photography": 10, "temples": 10, "architecture": 10, "sunset": 10, "river": 8}',
  'heritage',
  '{
    "constructionDate": "1656",
    "constructionEra": "Ayutthaya Period",
    "architecturalStyles": ["Khmer", "Thai", "Chinese influence"],
    "unescoStatus": null,
    "kingdomDynasty": "Ayutthaya to Chakri",
    "religiousSignificance": "Royal temple of the first class",
    "entryFeeTHB": 100,
    "entryFeeForeignerTHB": 100,
    "openingHours": "08:00-18:00",
    "dressCode": "Shoulders and knees covered",
    "bestTimeToVisit": "Sunset for best photos from across the river",
    "heritageType": "temple",
    "historicalSignificance": "Housed the Emerald Buddha briefly, iconic Bangkok landmark"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Wat Pho
INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'wat-pho',
  'Wat Pho (Temple of the Reclining Buddha)',
  'Home to the magnificent 46-meter Reclining Buddha and Thailand''s first public university.',
  'Wat Pho is one of Bangkok''s oldest and largest temples, predating the city itself. It houses the stunning 46-meter-long, 15-meter-high Reclining Buddha, covered in gold leaf. The temple is also famous as the birthplace of traditional Thai massage - it served as Thailand''s first public university, teaching medicine, massage, and astrology. The complex contains over 1,000 Buddha images, more than any other temple in Thailand.',
  'Culture',
  'Rattanakosin Island',
  'Bangkok',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
  false, false,
  '{"culture": 10, "history": 9, "photography": 9, "temples": 10, "architecture": 9, "wellness": 8, "massage": 10}',
  'heritage',
  '{
    "constructionDate": "1788",
    "constructionEra": "Rattanakosin Period",
    "architecturalStyles": ["Thai", "Rattanakosin"],
    "unescoStatus": null,
    "kingdomDynasty": "Chakri Dynasty",
    "religiousSignificance": "Royal temple, contains most Buddha images in Thailand",
    "entryFeeTHB": 200,
    "entryFeeForeignerTHB": 200,
    "openingHours": "08:00-18:30",
    "dressCode": "Shoulders and knees covered",
    "bestTimeToVisit": "Early morning to avoid crowds",
    "heritageType": "temple",
    "historicalSignificance": "Birthplace of traditional Thai massage, first public university"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Phimai Historical Park
INSERT INTO attractions (
  slug, name, description, about, category, location, province, image_url,
  is_hidden_gem, is_pro_only, categories, place_type, metadata
) VALUES (
  'phimai-historical-park',
  'Phimai Historical Park',
  'One of the most important Khmer temples in Thailand, connected to Angkor by an ancient road.',
  'Prasat Hin Phimai is one of the largest and most significant Khmer temples in Thailand, believed to predate Angkor Wat. The temple was connected to Angkor by an ancient road and served as a major religious center. Built primarily of white sandstone, it features intricate carvings depicting Hindu and Buddhist mythology. The site showcases the transition from Hinduism to Buddhism in the region.',
  'Culture',
  'Phimai',
  'Nakhon Ratchasima',
  'https://images.unsplash.com/photo-1598511757337-fe2cafc31ba0?w=800',
  true, false,
  '{"culture": 10, "history": 10, "photography": 9, "temples": 10, "architecture": 10, "offbeat": 9}',
  'heritage',
  '{
    "constructionDate": "1080",
    "constructionEra": "Khmer Period",
    "architecturalStyles": ["Khmer", "Angkorian"],
    "unescoStatus": null,
    "kingdomDynasty": "Khmer Empire",
    "religiousSignificance": "Major Buddhist temple, originally Hindu",
    "entryFeeTHB": 100,
    "entryFeeForeignerTHB": 100,
    "openingHours": "07:00-18:00",
    "dressCode": "Casual",
    "bestTimeToVisit": "Morning light for photography",
    "heritageType": "temple",
    "historicalSignificance": "Predates Angkor Wat, connected by ancient road"
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- HERITAGE IMAGES
-- =============================================

-- Get attraction IDs and insert images
INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200', 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400', 'Ayutthaya temple ruins at sunset', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'ayutthaya-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200', 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400', 'Sukhothai Buddha statue', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'sukhothai-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=1200', 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=400', 'Grand Palace Bangkok', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'grand-palace-bangkok'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200', 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400', 'Wat Arun spires at sunset', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'wat-arun'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200', 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400', 'Reclining Buddha at Wat Pho', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'wat-pho'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_images (attraction_id, image_url, thumbnail_url, alt_text, source, license, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1598511757337-fe2cafc31ba0?w=1200', 'https://images.unsplash.com/photo-1598511757337-fe2cafc31ba0?w=400', 'Phimai Khmer temple', 'unsplash', 'unsplash', true, 0
FROM attractions WHERE slug = 'phimai-historical-park'
ON CONFLICT DO NOTHING;

-- =============================================
-- HERITAGE EVENTS (Timeline)
-- =============================================

-- Ayutthaya timeline
INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1350, 'Ayutthaya Period', 'Foundation of Ayutthaya', 'King U Thong established Ayutthaya as the capital of his kingdom.', 'construction', 1
FROM attractions WHERE slug = 'ayutthaya-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1767, 'Ayutthaya Period', 'Fall of Ayutthaya', 'The city was destroyed by the Burmese army after a 14-month siege.', 'destruction', 2
FROM attractions WHERE slug = 'ayutthaya-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1991, 'Modern', 'UNESCO Inscription', 'Ayutthaya was inscribed as a UNESCO World Heritage Site.', 'designation', 3
FROM attractions WHERE slug = 'ayutthaya-historical-park'
ON CONFLICT DO NOTHING;

-- Sukhothai timeline
INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1238, 'Sukhothai Period', 'Kingdom Founded', 'Pho Khun Sri Indrathit established the Sukhothai Kingdom.', 'construction', 1
FROM attractions WHERE slug = 'sukhothai-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1283, 'Sukhothai Period', 'Thai Alphabet Created', 'King Ramkhamhaeng created the Thai alphabet, based on Khmer script.', 'event', 2
FROM attractions WHERE slug = 'sukhothai-historical-park'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1991, 'Modern', 'UNESCO Inscription', 'Sukhothai was inscribed as a UNESCO World Heritage Site.', 'designation', 3
FROM attractions WHERE slug = 'sukhothai-historical-park'
ON CONFLICT DO NOTHING;

-- Grand Palace timeline
INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1782, 'Rattanakosin Period', 'Palace Construction Begins', 'King Rama I began construction when he moved the capital to Bangkok.', 'construction', 1
FROM attractions WHERE slug = 'grand-palace-bangkok'
ON CONFLICT DO NOTHING;

INSERT INTO heritage_events (attraction_id, event_year, event_era, title, description, event_type, sort_order)
SELECT id, 1784, 'Rattanakosin Period', 'Emerald Buddha Installed', 'The sacred Emerald Buddha was installed in its new home.', 'event', 2
FROM attractions WHERE slug = 'grand-palace-bangkok'
ON CONFLICT DO NOTHING;
