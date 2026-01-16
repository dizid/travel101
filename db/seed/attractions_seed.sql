-- Seed data for attractions system
-- Run this after 001_attractions.sql migration

-- Clear existing data (for re-seeding)
DELETE FROM attraction_recommendations;
DELETE FROM attraction_secrets;
DELETE FROM attraction_tips;
DELETE FROM attractions;

-- =============================================
-- ATTRACTIONS
-- =============================================

INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem) VALUES

-- Popular Beaches
('phuket', 'Phuket',
'Thailand''s largest island with stunning beaches, vibrant nightlife, and world-class resorts.',
'Phuket has transformed from a quiet fishing island into Thailand''s most famous beach destination. Beyond the famous Patong Beach, you''ll find over 30 distinct beaches, each with its own character. The west coast offers dramatic sunsets and surf, while the east coast provides calmer waters and authentic fishing villages. The Old Town showcases beautiful Sino-Portuguese architecture and is a UNESCO World Heritage consideration.',
'beach', 'Andaman Sea', 'Phuket',
'{"beach": 1, "nightlife": 0.9, "luxury": 0.8, "party": 0.9, "family": 0.6, "romantic": 0.7}', false),

('krabi', 'Krabi',
'Dramatic limestone cliffs, pristine beaches, and excellent rock climbing at Railay Beach.',
'Krabi province is a masterpiece of natural architecture. The towering limestone karsts that jut from emerald waters have made this one of the most photographed destinations in Southeast Asia. Railay Beach, accessible only by boat, is a world-renowned rock climbing destination with over 700 bolted routes. The four islands tour showcases some of Thailand''s most pristine marine environments.',
'beach', 'Andaman Sea', 'Krabi',
'{"beach": 1, "adventure": 0.9, "nature": 0.8, "relaxation": 0.7, "romantic": 0.8, "budget": 0.6}', false),

('koh-samui', 'Koh Samui',
'Palm-fringed beaches, luxury resorts, and a more refined island experience.',
'Koh Samui strikes a balance between development and natural beauty that few Thai islands achieve. The coconut palms that once defined the island''s economy now shade boutique resorts and wellness retreats. The ring road makes exploring easy, from the bustling Chaweng to the serene Maenam. The island has become Thailand''s wellness capital, with world-class spas and detox centers.',
'island', 'Gulf of Thailand', 'Surat Thani',
'{"beach": 0.9, "luxury": 0.9, "wellness": 0.9, "romantic": 0.9, "family": 0.7, "nightlife": 0.6}', false),

('koh-phangan', 'Koh Phangan',
'Famous for Full Moon Parties, but also offers serene beaches and yoga retreats.',
'Koh Phangan lives a double life. Yes, it hosts the legendary Full Moon Party that draws 30,000 revelers monthly to Haad Rin beach. But venture to the north or west coast and you''ll find a completely different island: yoga shalas hidden in the jungle, clothing-optional beaches, and communities of digital nomads and spiritual seekers. The island has some of Thailand''s most beautiful and least crowded beaches.',
'island', 'Gulf of Thailand', 'Surat Thani',
'{"party": 1, "beach": 0.8, "wellness": 0.7, "budget": 0.8, "nightlife": 0.9, "relaxation": 0.6}', false),

-- Culture
('bangkok-temples', 'Bangkok Temples',
'Explore Wat Pho, Wat Arun, and the Grand Palace - the spiritual heart of Thailand.',
'Bangkok''s historic Rattanakosin Island contains the spiritual and ceremonial heart of Thailand. The Grand Palace complex, home to the Emerald Buddha, showcases 150 years of Thai royal architecture. Wat Pho houses the 46-meter reclining Buddha and is the birthplace of traditional Thai massage. Across the river, Wat Arun''s Khmer-style prang glitters at sunset. Early morning visits reveal monks collecting alms and locals making merit.',
'culture', 'Bangkok', 'Bangkok',
'{"culture": 1, "history": 0.9, "temples": 1, "photography": 0.8}', false),

('chiang-mai', 'Chiang Mai',
'The cultural capital of the North with ancient temples, cooking classes, and night markets.',
'Chiang Mai was founded in 1296 as the capital of the Lanna Kingdom, and that rich heritage permeates every corner. Over 300 temples dot the city and surrounding hills. The Old City, still partially surrounded by moats and walls, is home to revered temples like Wat Chedi Luang and Wat Phra Singh. Beyond temples, Chiang Mai has become Thailand''s creative hub, with thriving art, music, and culinary scenes.',
'culture', 'Northern Thailand', 'Chiang Mai',
'{"culture": 1, "food": 0.9, "nomad": 0.9, "temples": 0.9, "budget": 0.8, "nature": 0.7}', false),

('ayutthaya', 'Ayutthaya',
'UNESCO World Heritage ancient capital with impressive temple ruins.',
'For 417 years, Ayutthaya was one of the world''s largest and most cosmopolitan cities, a center of global diplomacy and trade. When Burmese invaders destroyed it in 1767, they left behind haunting ruins that earned UNESCO World Heritage status. The Historical Park covers 289 hectares and includes palaces, Buddhist temples, and monasteries. The iconic Buddha head entwined in tree roots at Wat Mahathat is Thailand''s most photographed ruin.',
'culture', 'Central Thailand', 'Ayutthaya',
'{"culture": 1, "history": 1, "temples": 0.9, "photography": 0.8, "budget": 0.7}', false),

-- Hidden Gems (is_hidden_gem = true)
('koh-kood', 'Koh Kood',
'Thailand''s fourth largest island remains blissfully undeveloped with pristine beaches.',
'Koh Kood is what Koh Samui was 40 years ago. Thailand''s fourth-largest island has resisted mass tourism, with no ATMs, no 7-Elevens, and electricity that wasn''t 24/7 until recently. Crystal-clear waters reveal some of Thailand''s best snorkeling right off the beach. Waterfalls cascade through ancient rainforest. The local population of just 2,000 maintains traditional fishing and coconut farming lifestyles.',
'island', 'Gulf of Thailand', 'Trat',
'{"beach": 1, "relaxation": 1, "romantic": 0.9, "nature": 0.9, "authentic": 1}', true),

('koh-yao-noi', 'Koh Yao Noi',
'A peaceful Muslim fishing community with stunning Phang Nga Bay views.',
'Floating in the middle of Phang Nga Bay, Koh Yao Noi offers front-row views of the limestone karsts without the crowds. This Muslim fishing community has consciously chosen sustainable tourism over development. Wake to the call to prayer, rent a bicycle to explore rubber plantations and rice paddies, and kayak among the famous karsts. The community has won awards for sustainable tourism practices.',
'island', 'Phang Nga Bay', 'Phang Nga',
'{"relaxation": 1, "romantic": 0.9, "nature": 0.9, "culture": 0.7, "authentic": 1, "budget": 0.7}', true),

('nan-province', 'Nan Province',
'Authentic northern culture, ancient temples, and barely any tourists.',
'Nan remained part of a semi-autonomous kingdom until 1931, developing a distinctive culture you won''t find elsewhere in Thailand. The province''s temples showcase unique Lanna-Nan architecture and rare murals depicting local life. Wat Phumin''s 400-year-old paintings are considered Thailand''s finest temple murals. The surrounding mountains shelter ethnic minority villages where traditional dress and customs continue.',
'culture', 'Northern Thailand', 'Nan',
'{"culture": 1, "nature": 0.8, "budget": 0.8, "authentic": 1, "temples": 0.9}', true),

('umphang', 'Umphang',
'Remote jungle region with Thailand''s largest waterfall, Thi Lo Su.',
'Getting to Umphang requires navigating 1,219 curves through mountain jungle on one of Thailand''s most challenging roads. The reward is Thi Lo Su, Thailand''s largest waterfall, cascading 300 meters through pristine forest. The area is home to Karen hill tribe villages, limestone caves, and some of Thailand''s last wild elephants. Multi-day trekking and rafting trips access areas few tourists ever see.',
'nature', 'Western Thailand', 'Tak',
'{"nature": 1, "adventure": 1, "authentic": 1, "trekking": 0.9}', true),

-- Digital Nomad Hubs
('chiang-mai-nimman', 'Chiang Mai (Nimman)',
'The digital nomad capital with co-working spaces, cafes, and a thriving community.',
'Nimman Road has transformed into Southeast Asia''s digital nomad headquarters. Within a few square kilometers, you''ll find over 50 co-working spaces, hundreds of laptop-friendly cafes, and a community of thousands of remote workers from around the world. The combination of low cost of living, excellent internet, good weather, and rich culture has made this the #1 destination for location-independent professionals.',
'nomad', 'Northern Thailand', 'Chiang Mai',
'{"nomad": 1, "food": 0.9, "culture": 0.8, "budget": 0.8, "wellness": 0.7}', false),

('koh-lanta', 'Koh Lanta',
'Laid-back island perfect for remote workers seeking beach-work balance.',
'Koh Lanta offers what Chiang Mai nomads dream about: beach life with decent wifi. The island''s long sandy beaches remain relatively quiet even in high season. A growing community of digital nomads has spawned co-working spaces, networking events, and a supportive community. The pace is slower here, with sunsets viewed from hammocks rather than rooftop bars.',
'nomad', 'Andaman Sea', 'Krabi',
'{"nomad": 0.9, "beach": 0.9, "relaxation": 0.9, "budget": 0.7, "romantic": 0.7}', false),

-- Foodie
('yaowarat', 'Yaowarat (Bangkok Chinatown)',
'Street food paradise with legendary dishes and a vibrant night food scene.',
'Yaowarat is where Bangkok''s legendary street food culture reaches its peak. This 200-year-old Chinatown comes alive after dark when neon signs illuminate and vendors wheel out their carts. The density of food options is staggering: shark fin soup, bird''s nest sweets, and roasted duck share sidewalks with Michelin-recommended dishes costing less than $5. Several restaurants here have fed generations of families.',
'foodie', 'Bangkok', 'Bangkok',
'{"food": 1, "culture": 0.8, "nightlife": 0.7, "authentic": 0.9, "budget": 0.9}', false);

-- =============================================
-- INSIDER TIPS
-- =============================================

-- Phuket Tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'timing', 'Best Season', 'November to February offers perfect weather with dry skies and comfortable temperatures. Avoid late April through early May for the intense heat. The monsoon season (May-October) brings lower prices but rough west coast seas.', false, 1
FROM attractions WHERE slug = 'phuket';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'crowd_avoidance', 'Beach Strategy', 'Visit Patong before 9am or after 4pm when day-trippers leave. Kata Beach is less crowded than Patong. For peace, head to the northern beaches: Nai Yang and Mai Khao near the airport are often empty.', false, 2
FROM attractions WHERE slug = 'phuket';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'money_saving', 'Transport Savings', 'Use Grab instead of tuk-tuks - prices are fixed and typically 50% cheaper. Renting a scooter costs 200-300 THB/day and gives you freedom. The airport taxi desk has fixed rates - always use it over random drivers.', false, 3
FROM attractions WHERE slug = 'phuket';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'transport', 'Getting Around', 'No public transport exists - plan for taxis, Grab, scooter, or car rental. The island is bigger than you think (50km north to south). Base yourself strategically: Kata for families, Patong for nightlife, Rawai for long stays.', false, 4
FROM attractions WHERE slug = 'phuket';

-- Chiang Mai Tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'timing', 'Best Time to Visit', 'November to February is ideal with cool, dry weather. The Loi Krathong festival (November full moon) is magical. Avoid March-April when burning season creates hazardous air quality from agricultural fires.', false, 1
FROM attractions WHERE slug = 'chiang-mai';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'money_saving', 'Budget Tips', 'Eat where locals eat - university area restaurants serve meals for 30-50 THB. Rent a bicycle for 50 THB/day to explore the Old City. The Sunday Walking Street has food stalls far cheaper than restaurants.', false, 2
FROM attractions WHERE slug = 'chiang-mai';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'transport', 'Getting Around', 'Songthaews (red trucks) run set routes for 20-30 THB. Grab works well here. The Old City is walkable. For Doi Suthep temple, share a songthaew from Chiang Mai Zoo (40 THB per person).', false, 3
FROM attractions WHERE slug = 'chiang-mai';

-- Koh Samui Tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'timing', 'When to Visit', 'December to April offers the best weather. October-November can see heavy rain. Unlike the Andaman coast, Samui has its own microclimate - check specifically for this island, not general Thai forecasts.', false, 1
FROM attractions WHERE slug = 'koh-samui';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'money_saving', 'Save on Flights', 'Bangkok Airways has a monopoly on flights, making them expensive. Consider flying to Surat Thani (much cheaper) and taking the ferry. The combo ticket is often half the price of direct flights.', false, 2
FROM attractions WHERE slug = 'koh-samui';

-- Krabi Tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'timing', 'Best Season', 'November to April has the best weather. The famous Four Islands tour is best done early morning (7am departure) to avoid the 100+ tourist boats that arrive by 10am.', false, 1
FROM attractions WHERE slug = 'krabi';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'transport', 'Reaching Railay', 'Railay is only accessible by boat. From Ao Nang, longtail boats leave constantly (100 THB per person, 15 minutes). From Krabi Town pier, boats cost 150 THB but take longer. Don''t pay more than these prices.', false, 2
FROM attractions WHERE slug = 'krabi';

-- Bangkok Temples Tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'timing', 'Opening Strategy', 'Grand Palace opens at 8:30am - arrive at 8am to be first in line. By 10am, tour groups arrive en masse. Wat Pho and Wat Arun are best visited late afternoon when crowds thin and light softens.', false, 1
FROM attractions WHERE slug = 'bangkok-temples';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'preparation', 'Dress Code', 'Strict dress code enforced: cover shoulders, knees, and no flip-flops. Sarongs are available to rent but slow you down. Wear light long pants and bring a scarf/cardigan for air-conditioned areas.', false, 2
FROM attractions WHERE slug = 'bangkok-temples';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'money_saving', 'Combo Strategy', 'Grand Palace (500 THB) includes entry to several sites. Wat Pho (200 THB) includes a free Thai massage course. Wat Arun (100 THB) is best value. Buy tickets only at official booths, never from random people.', false, 3
FROM attractions WHERE slug = 'bangkok-temples';

-- Hidden Gem Tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'preparation', 'Essential Planning', 'Bring cash - no ATMs on the island. Book accommodation in advance during high season (Dec-Feb). Electricity is now 24/7 but mobile signal is patchy. Bring offline maps and entertainment.', false, 1
FROM attractions WHERE slug = 'koh-kood';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, is_pro_only, sort_order)
SELECT id, 'transport', 'Getting There', 'From Bangkok: fly to Trat, then speedboat (1 hour, 600 THB) or car ferry (2.5 hours, 200 THB). The speedboat can be rough in monsoon season. From Koh Chang, speedboats run twice daily.', false, 2
FROM attractions WHERE slug = 'koh-kood';

-- =============================================
-- LOCAL SECRETS (Pro-only)
-- =============================================

-- Phuket Secrets
INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'hidden_spot', 'Freedom Beach', 'One of Phuket''s most pristine beaches, accessible only by longtail boat from Patong (300 THB). Crystal clear water, white sand, and a fraction of the crowds. Bring snacks - there''s only one small restaurant.', 'South of Patong Beach', true, 1
FROM attractions WHERE slug = 'phuket';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'hidden_spot', 'Windmill Viewpoint', 'Most tourists go to Promthep Cape for sunset. Locals know the nearby Windmill Viewpoint (Ya Nui) offers better views with zero crowds. There''s a small beach below perfect for sunset swimming.', 'Between Nai Harn and Rawai', true, 2
FROM attractions WHERE slug = 'phuket';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'local_food', 'Go Benz Seafood', 'Skip Rawai seafood market''s tourist restaurants. Go Benz serves the same quality at half the price. Their yellow curry crab is legendary. Open late, no English menu - point at what others are eating.', 'Chalong area', true, 3
FROM attractions WHERE slug = 'phuket';

-- Chiang Mai Secrets
INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'hidden_spot', 'Wat Umong Tunnel Temple', 'While tourists pack Doi Suthep, locals meditate at Wat Umong. Built in the 14th century, its moss-covered tunnels house ancient Buddha images. The forest monastery grounds are perfect for quiet walks.', 'Southwest of Old City', true, 1
FROM attractions WHERE slug = 'chiang-mai';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'local_food', 'Khao Soi Mae Sai', 'Forget the famous Khao Soi Khun Yai - locals line up at Khao Soi Mae Sai instead. The soup is richer, the noodles fresher, and there''s no tourist markup. Opens early, closes when the pot''s empty (usually by 1pm).', 'Near Chang Phueak Gate', true, 2
FROM attractions WHERE slug = 'chiang-mai';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'local_experience', 'Baan Kang Wat Artist Village', 'A hidden community of artists and craftspeople in a traditional Lanna village setting. Every Sunday they host an intimate market with handmade goods, live music, and homemade food. No tour buses.', 'Canal Road area', true, 3
FROM attractions WHERE slug = 'chiang-mai';

-- Krabi Secrets
INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'hidden_spot', 'Phra Nang Cave Beach', 'At the far end of Railay''s Phra Nang beach, a sea cave hides a shrine covered in wooden phalluses left by local fishermen. At low tide, you can walk through the cave to a hidden lagoon.', 'East end of Railay', true, 1
FROM attractions WHERE slug = 'krabi';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'insider_knowledge', 'Tonsai Beach Entrance', 'Most pay 100 THB for the boat from Railay to Tonsai. But at low tide, you can walk over the rocks in 15 minutes. Wear shoes with grip. This is the local climber route.', 'Between Railay West and Tonsai', true, 2
FROM attractions WHERE slug = 'krabi';

-- Bangkok Secrets
INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'local_food', 'Jay Fai''s Real Competition', 'Jay Fai has a Michelin star and 2-hour waits. Two streets away, Pa Kang serves nearly identical crab omelette for a third of the price. No reservations, no hype, same quality.', 'Near Wat Saket', true, 1
FROM attractions WHERE slug = 'bangkok-temples';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order)
SELECT id, 'hidden_spot', 'Artist''s House', 'A crumbling wooden house on a canal in Thonburi hosts traditional Thai puppet shows daily at 2pm. Free admission. The artist serves coffee and lets you hold centuries-old puppets. Most guidebooks miss it entirely.', 'Khlong Bang Luang', true, 2
FROM attractions WHERE slug = 'bangkok-temples';

-- =============================================
-- RECOMMENDATIONS
-- =============================================

-- Phuket Recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'restaurant', 'Raya Restaurant', 'Thai-Chinese cuisine in a stunning 100-year-old Sino-Portuguese mansion in Phuket Town.', 'The crab curry is legendary - locals drive across the island for it. The building alone is worth the visit.', '$$', false, 1
FROM attractions WHERE slug = 'phuket';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'viewpoint', 'Karon Viewpoint', 'Three-bay panorama viewpoint overlooking Kata Noi, Kata, and Karon beaches.', 'Best at sunset when the beaches glow gold. Much less crowded than Promthep Cape with equally good views.', '$', false, 2
FROM attractions WHERE slug = 'phuket';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'activity', 'Sunrise Kayak to James Bond Island', 'Depart at 5am to paddle among the karsts of Phang Nga Bay before tour boats arrive.', 'You''ll have James Bond Island nearly to yourself - a completely different experience from the crowded day tours.', '$$', true, 3
FROM attractions WHERE slug = 'phuket';

-- Chiang Mai Recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'restaurant', 'Huen Phen', 'Traditional northern Thai cuisine in a beautiful old teak house with two distinct dining areas.', 'Lunch is simple and cheap, dinner is elaborate with traditional decor. Their khao soi and sai oua are textbook perfect.', '$$', false, 1
FROM attractions WHERE slug = 'chiang-mai';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'cafe', 'Ristr8to Coffee', 'World Latte Art Championship winner creates amazing coffee and art in a minimalist space.', 'The owner Arnon is a 6x Thai Barista Champion. Come for the coffee art, stay for exceptional single-origin brews.', '$$', false, 2
FROM attractions WHERE slug = 'chiang-mai';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'activity', 'Elephant Nature Park', 'Ethical elephant sanctuary where you observe and feed rescued elephants without riding.', 'The only elephant experience in Thailand that''s genuinely ethical. Full-day includes feeding, watching them bathe, and learning their rescue stories.', '$$$', false, 3
FROM attractions WHERE slug = 'chiang-mai';

-- Krabi Recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'restaurant', 'Krua Thara', 'Seafood restaurant on stilts over Krabi River with views of the mangroves.', 'Fresh seafood at local prices. Their whole steamed fish with lime is the best in town. Go at sunset for the view.', '$$', false, 1
FROM attractions WHERE slug = 'krabi';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'activity', 'Rock Climbing at Railay', 'World-class limestone climbing with over 700 routes from beginner to expert.', 'Even if you''ve never climbed, half-day courses (1,000 THB) let you scale cliffs with stunning views. King Climbers has the best instructors.', '$$', false, 2
FROM attractions WHERE slug = 'krabi';

-- Bangkok Recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'restaurant', 'Thip Samai', 'The most famous Pad Thai in Bangkok, operating since 1966 with a permanent queue.', 'The "superb" Pad Thai wrapped in egg is worth the wait. Go at 6pm when they open to minimize queue time.', '$', false, 1
FROM attractions WHERE slug = 'bangkok-temples';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'viewpoint', 'Wat Saket (Golden Mount)', 'A hilltop temple with 360-degree views of Bangkok''s temples and skyline.', '318 steps to the top, but the view and the temple reward the climb. Much less crowded than Wat Arun with better photography angles.', '$', false, 2
FROM attractions WHERE slug = 'bangkok-temples';

-- Yaowarat Recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'restaurant', 'Nai Ek Roll Noodles', 'Legendary rolled rice noodle soup that''s been perfecting one dish for 80 years.', 'Three generations making one dish. The broth is incredibly rich, the noodles silky smooth. Opens early, closes by noon.', '$', false, 1
FROM attractions WHERE slug = 'yaowarat';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'restaurant', 'T&K Seafood', 'Massive outdoor seafood restaurant that''s been a Yaowarat institution for decades.', 'The grilled prawns with glass noodles are legendary. Come hungry - portions are enormous and prices are reasonable for the quality.', '$$', false, 2
FROM attractions WHERE slug = 'yaowarat';

-- Koh Kood Recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'activity', 'Klong Chao Waterfall', 'A multi-tiered waterfall with natural swimming pools surrounded by jungle.', 'Most beautiful in the wet season. Bring a picnic - you''ll likely have the pools to yourself.', '$', false, 1
FROM attractions WHERE slug = 'koh-kood';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, is_pro_only, sort_order)
SELECT id, 'hotel', 'Soneva Kiri', 'Ultra-luxury resort that defined sustainable luxury in Thailand.', 'If budget allows, the treetop dining experience is unforgettable - your meal arrives by zipline.', '$$$$', true, 2
FROM attractions WHERE slug = 'koh-kood';
