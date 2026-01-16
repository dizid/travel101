-- Sample Tours, Courses, and Activities for Thailand
-- These are manually curated places to demonstrate the expanded place types

-- =====================
-- COOKING COURSES
-- =====================

INSERT INTO attractions (slug, name, description, about, category, location, province, place_type, metadata, data_source, verification_status, categories)
VALUES
('silom-thai-cooking-school-course', 'Silom Thai Cooking School',
'Learn authentic Thai cuisine in a hands-on half-day class with market tour.',
'One of Bangkok''s most popular cooking schools. Start with a guided tour of a local market to select fresh ingredients, then learn to cook 4-5 classic Thai dishes. Small class sizes ensure personal attention. You''ll make dishes like Pad Thai, Green Curry, Tom Yum, and Mango Sticky Rice.',
'food', 'Silom', 'Bangkok', 'course',
'{"durationHours": 4, "priceTHB": 1500, "skillLevel": "beginner", "groupSizeMax": 12, "includesMarketTour": true}',
'manual', 'pending',
'{"food": 1, "culture": 0.7, "skill_building": 0.9, "creative": 0.8, "budget": 0.6}'
),

('thai-farm-cooking-school-course', 'Thai Farm Cooking School Chiang Mai',
'Organic farm cooking experience with garden-to-table ingredients.',
'Located on a beautiful organic farm outside Chiang Mai. Pick your own herbs and vegetables from the garden, then cook traditional Northern Thai dishes. The setting is peaceful and the food is incredibly fresh. Perfect for those who want to understand Thai ingredients at their source.',
'food', 'Mae Taeng', 'Chiang Mai', 'course',
'{"durationHours": 5, "priceTHB": 1200, "skillLevel": "beginner", "groupSizeMax": 10, "includesFarmTour": true, "isOrganic": true}',
'manual', 'pending',
'{"food": 1, "nature": 0.8, "authentic": 0.9, "skill_building": 0.8, "relaxation": 0.6, "budget": 0.7}'
),

-- =====================
-- DIVING COURSES
-- =====================

('koh-tao-padi-open-water-course', 'PADI Open Water Diver - Koh Tao',
'Get certified to dive worldwide with the most popular diving course.',
'Koh Tao is the cheapest place in the world to get PADI certified, with crystal clear waters and diverse marine life. The 3-4 day course includes theory, pool sessions, and 4 open water dives. You''ll encounter sea turtles, reef sharks, and colorful coral gardens.',
'adventure', 'Koh Tao', 'Surat Thani', 'course',
'{"durationHours": 72, "priceTHB": 9800, "skillLevel": "beginner", "certification": "PADI Open Water", "includedDives": 4}',
'manual', 'pending',
'{"adventure": 1, "beach": 0.9, "certification": 1, "physical": 0.7, "nature": 0.8, "budget": 0.8}'
),

('koh-lanta-advanced-diving-course', 'PADI Advanced Open Water - Koh Lanta',
'Take your diving to the next level with deep dives and navigation.',
'Explore Koh Lanta''s famous dive sites including Hin Daeng and Hin Muang, known for manta rays. The 2-day course includes 5 adventure dives covering deep diving, navigation, night diving, and more. Smaller crowds than Koh Tao with equally stunning marine life.',
'adventure', 'Koh Lanta', 'Krabi', 'course',
'{"durationHours": 48, "priceTHB": 12500, "skillLevel": "intermediate", "certification": "PADI Advanced Open Water", "includedDives": 5}',
'manual', 'pending',
'{"adventure": 1, "beach": 0.8, "certification": 1, "physical": 0.8, "nature": 0.9, "authentic": 0.7}'
),

-- =====================
-- YOGA & WELLNESS COURSES
-- =====================

('pai-yoga-retreat-course', 'Pai Yoga & Meditation Retreat',
'7-day immersive yoga and meditation retreat in the mountains.',
'Escape to Pai''s peaceful mountains for a transformative week of twice-daily yoga, meditation sessions, and healthy vegetarian meals. Accommodation in traditional Thai bungalows surrounded by rice paddies. Perfect for beginners or experienced practitioners seeking deeper practice.',
'wellness', 'Pai', 'Mae Hong Son', 'course',
'{"durationHours": 168, "priceTHB": 15000, "skillLevel": "beginner", "includesAccommodation": true, "includesMeals": true, "yogaStyle": "Hatha/Vinyasa"}',
'manual', 'pending',
'{"wellness": 1, "relaxation": 1, "nature": 0.9, "authentic": 0.8, "skill_building": 0.7, "budget": 0.6}'
),

('koh-phangan-yoga-teacher-training-course', 'Yoga Teacher Training 200hr - Koh Phangan',
'Become a certified yoga instructor on the island of wellness.',
'Intensive 4-week program to earn your Yoga Alliance certified 200-hour teaching certificate. Train with experienced international teachers while living on beautiful Koh Phangan. Includes anatomy, philosophy, teaching methodology, and daily practice. Transform your life and start a new career.',
'wellness', 'Koh Phangan', 'Surat Thani', 'course',
'{"durationHours": 672, "priceTHB": 85000, "skillLevel": "intermediate", "certification": "Yoga Alliance RYT-200", "includesAccommodation": true}',
'manual', 'pending',
'{"wellness": 1, "certification": 1, "skill_building": 1, "beach": 0.7, "physical": 0.8, "relaxation": 0.6}'
),

-- =====================
-- MUAY THAI COURSES
-- =====================

('tiger-muay-thai-course', 'Tiger Muay Thai Training Camp',
'Train like a fighter at Thailand''s most famous Muay Thai gym.',
'World-renowned training facility in Phuket offering programs from 1 day to several months. Train alongside professional fighters with experienced Thai coaches. Includes Muay Thai, fitness classes, and optional accommodation. Air-conditioned gym with modern equipment.',
'adventure', 'Chalong', 'Phuket', 'course',
'{"durationHours": 6, "priceTHB": 800, "skillLevel": "beginner", "perDay": true, "accommodationAvailable": true}',
'manual', 'pending',
'{"adventure": 0.9, "physical": 1, "skill_building": 0.9, "culture": 0.6, "budget": 0.5}'
),

-- =====================
-- DAY TOURS
-- =====================

('ayutthaya-day-tour-tour', 'Ayutthaya Ancient Capital Day Tour',
'Explore UNESCO World Heritage temple ruins with expert guide.',
'Full-day tour from Bangkok to the ancient capital of Siam. Visit iconic temples including Wat Mahathat (famous Buddha head in tree roots), Wat Phra Si Sanphet, and Wat Chaiwatthanaram. Includes lunch, air-conditioned transport, and English-speaking guide.',
'culture', 'Ayutthaya', 'Phra Nakhon Si Ayutthaya', 'tour',
'{"durationHours": 10, "priceTHB": 1800, "groupSizeMax": 15, "includesLunch": true, "includesTransport": true, "guide": "English"}',
'manual', 'pending',
'{"culture": 1, "history": 1, "temples": 1, "photography": 0.8, "guided": 0.9, "day_trip": 1}'
),

('james-bond-island-tour-tour', 'James Bond Island & Sea Canoe Tour',
'Kayak through limestone caves and visit the famous movie location.',
'Iconic Phang Nga Bay tour including James Bond Island (from "The Man with the Golden Gun"), sea canoeing through hidden lagoons, and lunch at a floating village. Stunning karst scenery and calm waters make this perfect for all ages.',
'nature', 'Phang Nga Bay', 'Phang Nga', 'tour',
'{"durationHours": 9, "priceTHB": 2200, "groupSizeMax": 20, "includesLunch": true, "includesKayaking": true}',
'manual', 'pending',
'{"nature": 1, "adventure": 0.7, "photography": 0.9, "family": 0.8, "guided": 0.8, "day_trip": 1}'
),

('doi-inthanon-tour-tour', 'Doi Inthanon National Park Day Tour',
'Visit Thailand''s highest peak with waterfalls and hill tribe villages.',
'Journey to the roof of Thailand at 2,565 meters. Visit the twin pagodas built for the King and Queen, explore misty cloud forests, and stop at stunning waterfalls. Includes visits to Karen and Hmong hill tribe villages. Cool temperatures year-round.',
'nature', 'Doi Inthanon', 'Chiang Mai', 'tour',
'{"durationHours": 10, "priceTHB": 1500, "groupSizeMax": 12, "includesLunch": true, "includesParkFees": true}',
'manual', 'pending',
'{"nature": 1, "trekking": 0.7, "photography": 0.9, "authentic": 0.8, "culture": 0.6, "day_trip": 1, "guided": 0.8}'
),

('phi-phi-islands-tour-tour', 'Phi Phi Islands Speedboat Tour',
'Full-day island hopping to Thailand''s most famous islands.',
'Speed through the Andaman Sea to the stunning Phi Phi Islands. Swim in Maya Bay (made famous by "The Beach"), snorkel at Pileh Lagoon, visit Monkey Beach, and enjoy lunch on Phi Phi Don. Small group tour for a more personal experience.',
'beach', 'Phi Phi Islands', 'Krabi', 'tour',
'{"durationHours": 8, "priceTHB": 2500, "groupSizeMax": 15, "includesLunch": true, "includesSnorkeling": true, "boatType": "speedboat"}',
'manual', 'pending',
'{"beach": 1, "nature": 0.9, "adventure": 0.6, "photography": 0.9, "day_trip": 1, "small_group": 0.8}'
),

-- =====================
-- ACTIVITIES
-- =====================

('elephant-nature-park-activity', 'Elephant Nature Park Visit',
'Ethical elephant sanctuary experience - feed and bathe rescued elephants.',
'Thailand''s most famous ethical elephant sanctuary founded by Lek Chailert. No riding - instead, feed, walk with, and bathe elephants who have been rescued from tourism and logging. Educational experience that supports conservation. Full day includes vegetarian lunch.',
'nature', 'Mae Taeng', 'Chiang Mai', 'activity',
'{"durationHours": 8, "priceTHB": 2500, "isEthical": true, "includesLunch": true, "includesTransport": true}',
'manual', 'pending',
'{"nature": 1, "authentic": 0.9, "family": 0.9, "adventure": 0.5, "relaxation": 0.6}'
),

('bangkok-food-tour-activity', 'Bangkok Street Food Night Tour',
'Eat your way through Bangkok''s best street food with local guide.',
'3-hour walking tour through Bangkok''s most delicious neighborhoods. Sample 10+ dishes including Pad Thai, mango sticky rice, boat noodles, and hidden local favorites. Small groups ensure personal attention and plenty of food. Vegetarian options available.',
'food', 'Old Town', 'Bangkok', 'activity',
'{"durationHours": 3, "priceTHB": 1200, "groupSizeMax": 8, "dishesIncluded": 10, "vegetarianFriendly": true}',
'manual', 'pending',
'{"food": 1, "culture": 0.8, "authentic": 0.9, "nightlife": 0.5, "small_group": 0.9, "budget": 0.7}'
),

('krabi-rock-climbing-activity', 'Railay Beach Rock Climbing',
'World-class limestone climbing on stunning sea cliffs.',
'Railay Beach is a rock climbing paradise with routes for all levels. Half-day session includes equipment, instruction, and 4-5 routes ranging from beginner to advanced. Climb with views of the Andaman Sea and pristine beaches below.',
'adventure', 'Railay Beach', 'Krabi', 'activity',
'{"durationHours": 4, "priceTHB": 1800, "skillLevel": "beginner", "routesIncluded": 5, "equipmentIncluded": true}',
'manual', 'pending',
'{"adventure": 1, "beach": 0.7, "physical": 0.9, "nature": 0.8, "photography": 0.7}'
),

('chiang-mai-night-safari-activity', 'Chiang Mai Night Safari',
'See nocturnal animals up close on a tram ride through open enclosures.',
'Thailand''s first night safari features open-air tram rides through African and Asian zones. See lions, giraffes, hyenas, and more in naturalistic settings. Includes walking zones and a spectacular fountain show. Great family activity.',
'nature', 'Hang Dong', 'Chiang Mai', 'activity',
'{"durationHours": 4, "priceTHB": 800, "familyFriendly": true, "zones": ["African", "Predator", "Savanna"]}',
'manual', 'pending',
'{"nature": 0.8, "family": 1, "adventure": 0.5, "nightlife": 0.4, "budget": 0.7}'
)

ON CONFLICT (slug) DO NOTHING;

-- Add some co-working spaces
INSERT INTO attractions (slug, name, description, about, category, location, province, place_type, metadata, data_source, verification_status, categories)
VALUES
('punspace-nimman-coworking', 'PunSpace Nimman',
'Popular co-working space in the heart of Nimman, Chiang Mai''s digital nomad hub.',
'Chiang Mai''s original co-working space with fast fiber internet, air conditioning, meeting rooms, and a cafe. Located on trendy Nimmanhaemin Road with easy access to restaurants and cafes. Day passes and monthly memberships available. Strong community of remote workers and entrepreneurs.',
'nomad', 'Nimmanhaemin', 'Chiang Mai', 'coworking',
'{"wifiSpeedMbps": 200, "is24Hours": false, "hasMeetingRooms": true, "dayPassTHB": 250, "monthlyPriceTHB": 3500, "hasLounge": true}',
'manual', 'pending',
'{"nomad": 1, "community": 0.9, "fast_wifi": 0.9, "budget": 0.7}'
),

('kohub-coworking', 'KoHub - Koh Lanta',
'Beachside co-working and coliving space for digital nomads.',
'Work with ocean views at Thailand''s most scenic co-working space. Located steps from Long Beach on Koh Lanta. Includes high-speed internet, standing desks, AC rooms, and a pool. Optional coliving apartments on-site. Perfect for nomads wanting beach life without sacrificing productivity.',
'nomad', 'Long Beach', 'Krabi', 'coworking',
'{"wifiSpeedMbps": 150, "is24Hours": false, "hasMeetingRooms": true, "dayPassTHB": 350, "monthlyPriceTHB": 5000, "hasPool": true, "colivingAvailable": true}',
'manual', 'pending',
'{"nomad": 1, "beach": 0.9, "community": 0.8, "fast_wifi": 0.8, "relaxation": 0.7}'
),

('the-hive-thonglor-coworking', 'The Hive Thonglor',
'Premium co-working in Bangkok''s trendy Thonglor district.',
'Stylish co-working space spread across multiple floors in a renovated building. Features hot desks, private offices, podcast studio, and rooftop terrace. Central location near BTS Thong Lo with excellent food and nightlife nearby. Popular with startups and creative professionals.',
'nomad', 'Thonglor', 'Bangkok', 'coworking',
'{"wifiSpeedMbps": 500, "is24Hours": true, "hasMeetingRooms": true, "dayPassTHB": 550, "monthlyPriceTHB": 7500, "hasPodcastStudio": true}',
'manual', 'pending',
'{"nomad": 1, "fast_wifi": 1, "community": 0.7, "luxury": 0.6, "twentyfour_hour_access": 1}'
)

ON CONFLICT (slug) DO NOTHING;
