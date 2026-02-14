-- Migration 010: Fix festival dates + add missing festivals
-- Corrects 6 wrong 2026 dates and adds ~10 new festivals

-- =============================================
-- PART 1: Fix incorrect 2026 dates
-- =============================================

-- Chiang Mai Flower Festival: was Feb 6, actual is Feb 13-15
UPDATE thai_festivals SET date_2026 = '2026-02-13', date_type = 'variable', date_fixed = NULL WHERE slug = 'chiang-mai-flower-festival';

-- Loy Krathong: was Oct 25, actual is Nov 25 (full moon of 12th Thai lunar month)
UPDATE thai_festivals SET date_2026 = '2026-11-25' WHERE slug = 'loy-krathong';

-- Yi Peng: was Oct 25, actual is Nov 24 (day before Loy Krathong)
UPDATE thai_festivals SET date_2026 = '2026-11-24' WHERE slug = 'yi-peng';

-- Phuket Vegetarian Festival: was Oct 10, actual is Sep 27 (1st of 9th Chinese lunar month)
UPDATE thai_festivals SET date_2026 = '2026-09-27' WHERE slug = 'vegetarian-festival';

-- Trang Vegetarian Festival: same correction as Phuket (same Taoist calendar)
UPDATE thai_festivals SET date_2026 = '2026-09-27' WHERE slug = 'trang-vegetarian';

-- Wonderfruit: was Dec 17, actual is Dec 12
UPDATE thai_festivals SET date_2026 = '2026-12-12' WHERE slug = 'wonderfruit';

-- Lopburi Monkey Buffet: was Nov 24, actual is Nov 29 (last Sunday of November)
UPDATE thai_festivals SET date_2026 = '2026-11-29' WHERE slug = 'lopburi-monkey-festival';

-- =============================================
-- PART 2: New Music Festivals
-- =============================================

-- Tomorrowland Thailand (first Tomorrowland in Asia)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'tomorrowland-thailand',
  'Tomorrowland Thailand',
  'ทูมอร์โรว์แลนด์ ไทยแลนด์',
  'The first Tomorrowland in Asia! World-famous electronic music festival comes to Thailand with 6 stages, 50,000+ daily capacity, and the legendary Mainstage. A historic moment for Thailand''s festival scene.',
  12, 'variable', 3,
  NULL, '2026-12-11',
  ARRAY['Chonburi'],
  false,
  ARRAY['Wisdom Valley, Pattaya'],
  'East',
  ARRAY['6 stages of electronic music', 'Legendary Mainstage experience', 'International DJ lineups', 'Art installations', 'Food village', 'Fireworks shows'],
  ARRAY['Book early - first Asia edition will sell out fast', 'Tickets 5,100-20,200 THB range', 'Pattaya has plenty of accommodation', 'Stay hydrated in December heat', 'Bring comfortable shoes for 3 days'],
  'Festival wear, costumes encouraged',
  'modern', 'secular', false, 'extreme', 5
);

-- 808 Festival (Bangkok''s biggest EDM event)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  '808-festival',
  '808 Festival',
  '808 เฟสติวัล',
  'Bangkok''s premier electronic music festival since 2013. Features mainstream EDM, house, trance, psytrance, and hardstyle across multiple stages. A December tradition for Thailand''s dance music community.',
  12, 'variable', 3,
  '2025-12-05', '2026-12-05',
  ARRAY['Bangkok'],
  false,
  ARRAY['BITEC Bangna, Bangkok'],
  'Bangkok',
  ARRAY['Multiple stages of electronic music', 'International and Thai DJ lineups', 'Light shows', 'Food and drink vendors', 'Meet-and-greets'],
  ARRAY['BTS accessible via Bangna station', 'December weather is perfect for outdoor events', 'Tickets sell out - buy early', 'Multiple ticket tiers available'],
  'Festival wear, casual',
  'modern', 'secular', false, 'high', 5
);

-- S2O Songkran Music Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  's2o-songkran',
  'S2O Songkran Music Festival',
  'S2O สงกรานต์ มิวสิค เฟสติวัล',
  'Where Songkran meets EDM! The world''s wettest music festival combines Thailand''s famous water fights with world-class DJs and massive water cannons. A modern twist on the traditional New Year celebration.',
  4, 'variable', 3,
  '2025-04-13', '2026-04-13',
  ARRAY['Bangkok'],
  false,
  ARRAY['Live Park Rama 9, Bangkok', 'Show DC Bangkok'],
  'Bangkok',
  ARRAY['Water cannon battles', 'International DJ performances', 'LED and laser shows', 'Foam parties', 'Thai New Year celebrations'],
  ARRAY['Wear quick-dry clothes', 'Waterproof phone case essential', 'Book Bangkok hotels months ahead for Songkran', 'Sunscreen is a must', 'Tickets available online in advance'],
  'Quick-dry clothes, swimwear OK',
  'modern', 'secular', false, 'extreme', 5
);

-- Pattaya International Music Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'pattaya-music-festival',
  'Pattaya International Music Festival',
  'เทศกาลดนตรีนานาชาติพัทยา',
  'Free beachfront music festival with multiple stages along Pattaya Beach Road. Features Thai pop, rock, indie, hip-hop, and international acts. One of the best free music events in Southeast Asia.',
  3, 'variable', 2,
  '2025-03-14', '2026-03-13',
  ARRAY['Chonburi'],
  false,
  ARRAY['Pattaya Beach Road', 'Central Pattaya'],
  'East',
  ARRAY['Multiple music stages on the beach', 'Thai and international performers', 'Food stalls along beach road', 'Beach parties', 'Free admission'],
  ARRAY['It''s free! Just show up', 'Beach Road gets packed - arrive early', '2 hours from Bangkok by bus', 'Multiple stages cater to different tastes', 'Great atmosphere with locals and tourists'],
  'Casual beach wear',
  'modern', 'secular', false, 'high', 5
);

-- =============================================
-- PART 3: New Cultural / Regional Festivals
-- =============================================

-- Lai Ruea Fai (Illuminated Boat Procession)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'lai-ruea-fai',
  'Lai Ruea Fai (Illuminated Boat Procession)',
  'ไหลเรือไฟ',
  'Spectacular procession where all 12 districts of Nakhon Phanom decorate boats with thousands of flowers, candles, and lanterns, then launch them into the Mekong River at night. One of Isan''s most visually stunning festivals, marking the end of Buddhist Lent.',
  10, 'lunar', 2,
  '2025-10-07', '2026-10-26',
  ARRAY['Nakhon Phanom'],
  false,
  ARRAY['Nakhon Phanom Mekong riverfront', 'Phra That Phanom area'],
  'Isan',
  ARRAY['Illuminated boat processions on the Mekong', 'Boat building competitions', 'Traditional Isan performances', 'Naga fireball watching', 'Temple ceremonies', 'Local food markets'],
  ARRAY['Book accommodation early - small city gets packed', 'Best views from the Mekong riverfront', 'Coincides with Ok Phansa', 'Combines well with Phra That Phanom visit', 'Bring a camera with night mode'],
  'Casual',
  'cultural', 'buddhist', true, 'high', 3
);

-- Chak Phra Festival (Pulling the Buddha)
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'chak-phra',
  'Chak Phra Festival',
  'ชักพระ',
  'Unique southern Thai festival commemorating Buddha''s return from heaven. Over 100 temples create elaborately decorated boats and land floats pulling Buddha images. Features exciting longboat races with up to 50 oarsmen per boat on the Tapi River.',
  10, 'lunar', 9,
  '2025-10-07', '2026-10-26',
  ARRAY['Surat Thani'],
  false,
  ARRAY['Tapi River, Surat Thani', 'Surat Thani city center'],
  'South',
  ARRAY['Decorated boat processions', 'Longboat racing with 50 oarsmen', 'Land-based float parades', 'Temple ceremonies', 'Traditional southern food', 'Offering robes to monks'],
  ARRAY['Most tourists skip Surat Thani but this is worth stopping for', 'Longboat races are thrilling', 'Coincides with Ok Phansa', 'Gateway to Koh Samui and Koh Phangan', 'Stay at least 2 days for full experience'],
  'Casual, modest for temple areas',
  'religious', 'buddhist', true, 'medium', 3
);

-- Phra That Phanom Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'phra-that-phanom',
  'Phra That Phanom Festival',
  'งานนมัสการพระธาตุพนม',
  'Thousands of Buddhist pilgrims from Thailand and Laos converge on Wat Phra That Phanom, one of the most sacred Buddhist sites in the Mekong region. The 7-day festival includes candlelit processions around the ancient Lao-style stupa.',
  2, 'lunar', 7,
  '2025-02-12', '2026-03-03',
  ARRAY['Nakhon Phanom'],
  false,
  ARRAY['Wat Phra That Phanom', 'That Phanom district'],
  'Isan',
  ARRAY['Candlelit wien thien processions', 'Merit-making at the stupa', 'Traditional Isan-Lao performances', 'Buddhist sermons', 'Local handicraft markets', 'Alms giving ceremonies'],
  ARRAY['One of the most revered Buddhist sites in Thailand and Laos', 'Full moon of the 3rd lunar month', 'Combine with Nakhon Phanom city exploration', 'Dress modestly for temple', 'Beautiful at sunrise and sunset'],
  'White or modest temple attire',
  'religious', 'buddhist', true, 'high', 3
);

-- Chiang Rai Flower Festival
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'chiang-rai-flower-festival',
  'Chiang Rai Flower Festival',
  'งานเชียงรายดอกไม้งาม',
  'Chiang Rai''s answer to the famous Chiang Mai flower festival. Features beautiful garden displays, flower competitions, and cultural performances in the cooler northern mountains. Less crowded and more relaxed than its bigger cousin.',
  12, 'variable', 14,
  '2025-12-26', '2026-12-26',
  ARRAY['Chiang Rai'],
  false,
  ARRAY['Suan Tung Flower Garden', 'Chiang Rai city center'],
  'North',
  ARRAY['Flower garden exhibitions', 'Flower queen pageant', 'Northern Thai cultural shows', 'Hill tribe performances', 'Photography competitions', 'Local food market'],
  ARRAY['Much less crowded than Chiang Mai version', 'December-January has perfect cool weather', 'Combine with White Temple and Blue Temple visits', 'Great for photographers', 'Night market nearby'],
  'Casual, layers for cool weather',
  'cultural', 'secular', true, 'medium', 4
);

-- Samui Regatta
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'samui-regatta',
  'Koh Samui Regatta',
  'การแข่งขันเรือใบเกาะสมุย',
  'One of Asia''s top sailing regattas, attracting international crews for competitive racing around Koh Samui. A week of sailing by day and beach parties by night. The premier yachting event in the Gulf of Thailand.',
  5, 'variable', 7,
  '2025-05-24', '2026-05-23',
  ARRAY['Surat Thani'],
  false,
  ARRAY['Chaweng Beach, Koh Samui', 'Koh Samui Marina'],
  'South',
  ARRAY['International yacht racing', 'Beach parties and BBQs', 'Award ceremonies', 'Sailing workshops', 'Beach volleyball tournaments', 'Live music'],
  ARRAY['Great spectator event even if you don''t sail', 'Beach parties are open to everyone', 'May is shoulder season - good hotel deals', 'Combine with Koh Phangan visit', 'Book beachfront accommodation'],
  'Casual resort wear',
  'modern', 'secular', true, 'medium', 5
);

-- EDC Thailand
INSERT INTO thai_festivals (slug, name, name_thai, description, month_typical, date_type, duration_days, date_2025, date_2026, provinces, is_nationwide, best_locations, region, activities, tips, dress_code, festival_type, religion, is_hidden_gem, crowd_level, foreigner_friendly)
VALUES (
  'edc-thailand',
  'EDC Thailand',
  'อีดีซี ไทยแลนด์',
  'Electric Daisy Carnival brings its world-famous production to Phuket. Massive LED installations, carnival rides, international EDM headliners, and Insomniac''s signature immersive experience on a tropical island.',
  1, 'variable', 3,
  '2025-01-16', '2026-01-16',
  ARRAY['Phuket'],
  false,
  ARRAY['Rhythm Park, Phuket'],
  'South',
  ARRAY['World-class EDM performances', 'Carnival rides and attractions', 'Massive LED art installations', 'Fireworks shows', 'Cosplay and festival fashion', 'VIP experiences'],
  ARRAY['Phuket in January has great weather', 'Book Phuket accommodation early', 'Shuttle buses from major hotel areas', 'Stay hydrated', 'Multiple ticket tiers available'],
  'Festival wear, costumes and kandi encouraged',
  'modern', 'secular', false, 'extreme', 5
);
