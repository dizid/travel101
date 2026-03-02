-- Migration: Add 25 new hand-curated attractions
-- Fills geographic and thematic gaps in the attraction library
-- Generated: 2026-03-02

-- =============================================
-- 1. KHAO YAI NATIONAL PARK
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('khao-yai', 'Khao Yai National Park',
'UNESCO World Heritage rainforest with hornbills, waterfalls, and surprisingly accessible hiking trails just 3 hours from Bangkok.',
'Thailand''s oldest and most visited national park covers 2,168 square kilometers of dense monsoon forest straddling the border of Nakhon Ratchasima and three other provinces. The park is home to over 3,000 plant species, 320 bird species (including four species of hornbill), and around 80 wild elephants. The Haew Narok and Haew Suwat waterfalls are the star attractions — Haew Suwat was featured in the movie The Beach. The surrounding area has developed into Thailand''s wine country, with PB Valley and GranMonte producing surprisingly decent wines.',
'nature', 'Pak Chong', 'Nakhon Ratchasima',
'{"nature": 1, "adventure": 0.8, "wildlife": 0.9, "hiking": 0.9, "photography": 0.8, "family": 0.6}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 2. KOH CHANG
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('koh-chang', 'Koh Chang',
'Thailand''s third-largest island with jungle-covered mountains, waterfalls, and beaches that feel decades behind Phuket''s development.',
'Koh Chang sits in the Gulf of Thailand near the Cambodian border, part of a marine national park that includes 52 islands. Unlike the southern islands, Koh Chang has retained a rougher, more authentic edge — the interior is mountainous and heavily forested, with several waterfalls accessible by hiking trail. White Sand Beach and Lonely Beach anchor the tourist scene, while Salak Phet and Bang Bao remain fishing villages. The island is popular with budget travelers and families looking for an alternative to the Andaman coast.',
'island', 'Gulf of Thailand', 'Trat',
'{"beach": 0.8, "nature": 0.9, "budget": 0.8, "relaxation": 0.7, "adventure": 0.7, "family": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 3. KOH TAO
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('koh-tao', 'Koh Tao',
'The world''s cheapest place to get PADI dive certified, with crystal-clear waters, coral reefs, and a tight-knit traveler community.',
'Koh Tao (Turtle Island) has become the world capital of budget scuba diving certification. Over 100 dive shops compete for business, driving PADI Open Water prices to 8,000-10,000 THB — far cheaper than anywhere else. But Koh Tao is more than diving: the snorkeling at Japanese Garden and Hin Wong Bay is world-class, the viewpoints offer panoramic gulf views, and the small island (21 sq km) creates an intimate atmosphere where everyone knows each other within days. Water taxis connect otherwise inaccessible beaches.',
'island', 'Gulf of Thailand', 'Surat Thani',
'{"diving": 1, "beach": 0.8, "budget": 0.8, "adventure": 0.9, "nature": 0.8, "party": 0.5}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 4. PATTAYA
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('pattaya', 'Pattaya',
'Once just a party town, now a surprisingly diverse destination with water parks, temples, gardens, and family attractions 90 minutes from Bangkok.',
'Pattaya has reinvented itself over the past decade. While Walking Street still anchors the nightlife reputation, the broader city offers the Sanctuary of Truth (an all-wood temple masterpiece), Nong Nooch Tropical Garden, Cartoon Network Amazone water park, and excellent seafood on Jomtien Beach. The surrounding area includes Koh Larn island (30-minute ferry, much cleaner beaches), the Silverlake vineyard, and several floating markets. Budget flights from Bangkok airports have been replaced by a comfortable 90-minute bus ride from Ekkamai.',
'city', 'Eastern Seaboard', 'Chonburi',
'{"nightlife": 0.9, "family": 0.7, "beach": 0.6, "budget": 0.7, "luxury": 0.6, "food": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 5. KOH LIPE
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('koh-lipe', 'Koh Lipe',
'The "Maldives of Thailand" — pristine white sand, turquoise water, and coral reefs at the country''s southernmost inhabited island.',
'Koh Lipe sits in the Tarutao National Marine Park near the Malaysian border, and its isolation has preserved some of Thailand''s most stunning marine environments. Sunrise Beach faces east with calm, crystal-clear water and visible coral from shore. The walking street offers surprisingly good restaurants and bars for such a small island. Snorkeling trips visit Koh Adang, Koh Rawi, and Koh Hin Ngam (the stone island). Access is by speedboat from Pak Bara pier (1.5 hours) or seasonal ferry from Koh Lanta. Only accessible November through May.',
'island', 'Andaman Sea', 'Satun',
'{"beach": 1, "snorkeling": 1, "romantic": 0.9, "relaxation": 0.9, "nature": 0.9, "luxury": 0.5}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 6. KOH LANTA
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('koh-lanta', 'Koh Lanta',
'A laid-back Andaman island with long beaches, a charming Old Town, and a pace of life that rewards staying longer than planned.',
'Koh Lanta Yai (the main island most people mean by "Koh Lanta") stretches 30 km down the Andaman coast with a string of beaches that get progressively quieter the further south you go. Long Beach is the social hub; Klong Dao is family-friendly; Kantiang Bay is the romantic pick. The eastern side has Lanta Old Town — a photogenic street of wooden Chinese-Thai shophouses on stilts over the water. The national park at the southern tip has a lighthouse with sweeping views. Koh Lanta rewards slow travel: rent a motorbike, eat at beachside restaurants, and settle in.',
'island', 'Andaman Sea', 'Krabi',
'{"beach": 0.9, "relaxation": 1, "family": 0.8, "romantic": 0.8, "budget": 0.7, "nature": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 7. PHANG NGA BAY
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('phang-nga-bay', 'Phang Nga Bay',
'Towering limestone karsts rising from emerald water — including the famous James Bond Island — best explored by kayak or longtail boat.',
'Phang Nga Bay is one of Thailand''s most dramatic natural landscapes. Over 40 limestone karsts and small islands dot the bay, many with hidden lagoons (hongs) accessible only by kayak through sea caves at the right tide. Ko Tapu (James Bond Island, from The Man with the Golden Gun) is the most photographed spot, though nearby Ko Panyi — a Muslim fishing village built entirely on stilts — is more culturally interesting. Day trips depart from Phuket or Phang Nga town; the latter is cheaper and less crowded. Sunset kayaking tours are the best way to experience the bay.',
'nature', 'Phang Nga Bay', 'Phang Nga',
'{"nature": 1, "photography": 1, "adventure": 0.8, "romantic": 0.8, "family": 0.7, "kayaking": 0.9}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 8. SIMILAN ISLANDS
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('similan-islands', 'Similan Islands',
'World-class diving and snorkeling at nine pristine islands, open only November through May to protect the marine ecosystem.',
'The Similan Islands National Park comprises nine islands (plus two Surin islands further north) with some of the best dive sites in the world. Visibility regularly exceeds 30 meters, and the marine life includes manta rays, whale sharks (seasonal), leopard sharks, and vast coral gardens. Richelieu Rock, nearby, is consistently ranked among the world''s top 10 dive sites. Day trips from Khao Lak are the most common access; serious divers opt for 2-4 night liveaboard trips that cover more remote sites. The park closes June through October to allow marine recovery.',
'nature', 'Andaman Sea', 'Phang Nga',
'{"diving": 1, "nature": 1, "snorkeling": 0.9, "adventure": 0.8, "photography": 0.9, "beach": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 9. KHAO LAK
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('khao-lak', 'Khao Lak',
'A quiet, family-friendly beach alternative to Phuket and the gateway to Similan Islands diving.',
'Khao Lak stretches along 20 km of Andaman coastline about 80 km north of Phuket. It was devastated by the 2004 tsunami and rebuilt as a quieter, more upscale destination than its southern neighbor. The main draw is long, wide beaches without the crowds or nightlife of Phuket. It''s also the primary departure point for Similan Islands liveaboards and day trips. Several excellent national parks are nearby, including Khao Sok (accessible as a day trip). The town has a good selection of Thai and international restaurants, family resorts, and dive operators.',
'beach', 'Andaman Coast', 'Phang Nga',
'{"beach": 0.9, "relaxation": 0.9, "family": 0.9, "diving": 0.7, "nature": 0.8, "romantic": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 10. CHIANG RAI
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('chiang-rai', 'Chiang Rai',
'Home to the White Temple, Blue Temple, and Black House — plus hill tribe villages and the Golden Triangle where Thailand meets Myanmar and Laos.',
'Chiang Rai province is Thailand''s northernmost territory, sharing borders with Myanmar and Laos at the legendary Golden Triangle. The city itself is smaller and quieter than Chiang Mai but has become an art destination thanks to Ajarn Chalermchai Kositpipat''s stunning Wat Rong Khun (White Temple), Rong Suea Ten (Blue Temple), and the Baan Dam Museum (Black House) by the late Thawan Duchanee. The night market has one of the best live music scenes in Thailand. Day trips to hill tribe villages, tea plantations (Choui Fong and Singha Park), and the Golden Triangle are popular.',
'culture', 'Northern Thailand', 'Chiang Rai',
'{"culture": 1, "temples": 0.9, "photography": 0.9, "art": 0.9, "nature": 0.7, "budget": 0.8}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 11. DOI INTHANON
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('doi-inthanon', 'Doi Inthanon National Park',
'Thailand''s highest peak (2,565m) with twin royal pagodas, cloud forest hiking, cascading waterfalls, and the country''s best birdwatching.',
'Doi Inthanon is Thailand''s rooftop — a 2,565-meter peak covered in cloud forest that''s cool enough for rhododendrons and mossy epiphytes. The twin pagodas (Naphamethinidon and Naphaphonphumisiri) near the summit were built to honor the King and Queen and offer sweeping views on clear days. The park has several accessible waterfalls (Wachirathan and Mae Klang are the most impressive), a nature trail through sphagnum bog, and Doi Inthanon Royal Project market selling Arabica coffee and seasonal strawberries. Birdwatchers come for the green-tailed sunbird and Hume''s pheasant.',
'nature', 'Northern Thailand', 'Chiang Mai',
'{"nature": 1, "hiking": 0.9, "photography": 0.9, "wildlife": 0.8, "adventure": 0.7, "budget": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 12. SUKHOTHAI
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('sukhothai', 'Sukhothai Historical Park',
'The ruins of Thailand''s first kingdom — a UNESCO World Heritage site best explored by bicycle at sunrise.',
'Sukhothai was the capital of the first Thai kingdom (1238-1438) and is considered the birthplace of Thai civilization, the Thai alphabet, and Theravada Buddhist art. The Historical Park covers 70 square kilometers with 193 ruins including Wat Mahathat (the spiritual center with its iconic lotus-bud stupas), Wat Si Chum (housing a massive seated Buddha peering through narrow walls), and Wat Sa Si on an island in a lotus pond. The park is divided into five zones — the central zone is the most compact and popular. Cycling the ruins at dawn or dusk, when tourist buses have departed, is one of Thailand''s most peaceful experiences.',
'culture', 'Central Thailand', 'Sukhothai',
'{"culture": 1, "history": 1, "temples": 0.9, "photography": 0.9, "budget": 0.8, "cycling": 0.8}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 13. MAE HONG SON
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('mae-hong-son', 'Mae Hong Son',
'A remote mountain province with misty valleys, Shan-Burmese temples, Tham Lot cave, and the serene lake at Pang Ung.',
'Mae Hong Son sits in Thailand''s northwestern corner, wedged between mountains and the Myanmar border. The provincial capital has a distinctly Burmese feel — Wat Jong Kham and Wat Jong Klang reflect in a scenic lake surrounded by mountains. The province is famous for the "Mae Hong Son Loop," a spectacular 600 km motorbike route from Chiang Mai via Pai and Mae Sariang with 4,000+ curves. Tham Lot cave is one of Southeast Asia''s most impressive cave systems. Pang Ung reservoir, ringed by pine forests and often shrouded in morning mist, is dubbed "Thailand''s Switzerland." Getting here is half the adventure — the flight from Chiang Mai takes 30 minutes over mountains.',
'nature', 'Northern Thailand', 'Mae Hong Son',
'{"nature": 1, "adventure": 0.9, "authentic": 0.9, "photography": 0.9, "relaxation": 0.7, "budget": 0.7}', true,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 14. KANCHANABURI
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('kanchanaburi', 'Kanchanaburi',
'The Bridge over the River Kwai, Erawan Falls'' seven emerald tiers, and the haunting Death Railway — all within easy reach of Bangkok.',
'Kanchanaburi province offers one of Thailand''s most varied day-trip or weekend experiences. The Bridge over the River Kwai and associated WWII museums (Hellfire Pass, JEATH War Museum) provide sobering historical context. Erawan National Park, 65 km north, has seven tiers of cascading emerald pools that are some of the most beautiful waterfalls in Southeast Asia. The Death Railway (now partially a tourist train) hugs the cliff face along the Kwai Noi River — the Wang Po viaduct section is particularly dramatic. Floating raft houses on the River Kwai make for a memorable overnight stay.',
'culture', 'Western Thailand', 'Kanchanaburi',
'{"culture": 0.9, "history": 1, "nature": 0.9, "adventure": 0.7, "photography": 0.8, "budget": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 15. LOPBURI
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('lopburi', 'Lopburi',
'Thailand''s "Monkey City" — ancient Khmer ruins overrun by hundreds of macaques, making for a quirky day trip from Bangkok.',
'Lopburi was an important city in the Khmer empire, and its Prang Sam Yot (three Khmer prangs) and Phra Narai Ratchaniwet palace are genuine historical treasures. But what most visitors come for are the hundreds of crab-eating macaques that have taken over the old town center. The monkeys live in and around the temples, climb on visitors, and have become the town''s identity — there''s even an annual Monkey Buffet Festival in November where tables of food are laid out for them. The town is 2.5 hours from Bangkok by train, making it an easy day trip. Keep belongings secured and sunglasses in your bag.',
'culture', 'Central Thailand', 'Lopburi',
'{"culture": 0.8, "wildlife": 0.7, "photography": 0.8, "budget": 0.9, "quirky": 0.9, "history": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 16. KHON KAEN
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('khon-kaen', 'Khon Kaen',
'A gateway to authentic Isaan culture with a dinosaur museum, the best som tam in the country, and almost zero tourists.',
'Khon Kaen is northeastern Thailand''s largest and most developed city, yet it receives almost no international tourists. This is Isaan at its most genuine — markets selling insects, som tam stalls with mortar-pounded salads that make Bangkok versions seem tame, and a thriving university culture that keeps the city young and energetic. The Phu Wiang Dinosaur Museum displays fossils of Siamotyrannus, a T-Rex ancestor discovered nearby. Bueng Kaen Nakhon (the city lake) has a pleasant walking and cycling path. The nearby Phu Kradueng plateau is one of Thailand''s most popular hiking destinations with camping on top.',
'culture', 'Isaan', 'Khon Kaen',
'{"culture": 0.9, "food": 1, "authentic": 1, "budget": 0.9, "nature": 0.6, "adventure": 0.5}', true,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 17. UDON THANI
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('udon-thani', 'Udon Thani',
'Home to the surreal Red Lotus Sea, the UNESCO-listed Ban Chiang archaeological site, and authentic Isaan life far from tourist trails.',
'Udon Thani is best known for Talay Bua Daeng (Red Lotus Sea) — a lake covered in millions of pink water lilies that bloom December through February, best seen by boat at dawn when the flowers open. The Ban Chiang archaeological site, a UNESCO World Heritage site, displays evidence of one of the world''s oldest Bronze Age civilizations dating back 5,000 years. The city itself is a regional hub with a large expat community (many retirees), excellent night markets, and direct flights to Bangkok. It''s also a convenient base for visiting Nong Khai and the Mekong River border with Laos.',
'culture', 'Isaan', 'Udon Thani',
'{"culture": 0.8, "nature": 0.8, "photography": 0.9, "authentic": 1, "history": 0.8, "budget": 0.8}', true,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 18. PHI PHI ISLANDS
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('phi-phi-islands', 'Phi Phi Islands',
'Thailand''s most photogenic islands — the iconic Maya Bay, dramatic viewpoints, and turquoise lagoons between towering limestone cliffs.',
'Phi Phi Don (the inhabited island) and Phi Phi Leh (home to Maya Bay, famous from The Beach) form one of Thailand''s most spectacular island groups. After years of closure for environmental recovery, Maya Bay reopened with strict visitor limits — arrive early with a tour or by longtail. The viewpoint on Phi Phi Don requires a steep 20-minute climb but rewards with one of Thailand''s most iconic panoramas. Monkey Beach, Bamboo Island, and the Bida Nok/Nai dive sites round out the experience. The island has no roads — everything is walkable, and that pedestrian-only atmosphere is part of the charm.',
'island', 'Andaman Sea', 'Krabi',
'{"beach": 1, "photography": 1, "snorkeling": 0.9, "party": 0.8, "diving": 0.7, "romantic": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 19. KOH MAK
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('koh-mak', 'Koh Mak',
'A car-free eco-island where the only noise is the waves — cycling between coconut plantations, rubber trees, and empty beaches.',
'Koh Mak is Thailand''s eco-tourism success story. This small island (16 sq km) in the Trat archipelago has deliberately limited development: no cars, no jet skis, no banana boats, no loud bars. Instead, you''ll find family-run guesthouses, beachfront bungalows for 500-1,500 THB, and a pace of life that moves at bicycle speed. The beaches are never crowded — even in peak season you''ll have stretches to yourself. Kayaking between Koh Mak and neighboring Koh Kham is a popular half-day activity. The island grows its own rubber, coconuts, and seafood. It''s accessible by speedboat from Laem Ngop pier near Trat.',
'island', 'Gulf of Thailand', 'Trat',
'{"relaxation": 1, "beach": 0.9, "nature": 0.9, "romantic": 0.8, "authentic": 1, "cycling": 0.8}', true,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 20. KOH SAMET
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('koh-samet', 'Koh Samet',
'The closest quality island to Bangkok — just 3.5 hours door-to-door, making it the perfect weekend beach escape.',
'Koh Samet sits just 6.5 km off the coast of Rayong province, making it the most accessible decent island from Bangkok (200 km, about 3.5 hours by car + ferry). The island is technically a national park (200 THB entry for foreigners), which has limited some development. Hat Sai Kaew (Diamond Beach) is the busiest and most developed, with fire shows every night. Ao Phai and Ao Vong Duen offer a better balance of facilities and peace. The western side is almost entirely undeveloped. It''s a popular weekend destination for Bangkok Thais — arrive Friday afternoon, leave Sunday, and you''ve had a beach holiday without taking time off work.',
'island', 'Gulf of Thailand', 'Rayong',
'{"beach": 0.8, "relaxation": 0.7, "nightlife": 0.6, "budget": 0.6, "romantic": 0.7, "family": 0.6}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 21. FLOATING MARKETS
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('floating-markets', 'Bangkok Floating Markets',
'An honest comparison of Thailand''s famous floating markets — which are genuine experiences and which are tourist traps.',
'Thailand''s floating markets range from completely authentic to completely staged. Damnoen Saduak is the most famous and most touristy — packed with boats loaded with souvenirs rather than food, it''s essentially a theme park. Amphawa Floating Market (weekends only, 60 km from Bangkok) is far more genuine: locals actually shop here, the seafood grilled on boats is excellent, and the evening firefly boat tours along the canal are magical. Khlong Lat Mayom (Bangkok) is the most authentic and least touristy — a real community market where locals buy produce, with boat noodles and Thai desserts. Taling Chan Market (Bangkok) is also worth visiting on weekends.',
'culture', 'Bangkok Area', 'Bangkok',
'{"culture": 0.9, "food": 0.9, "photography": 0.9, "authentic": 0.7, "family": 0.7, "shopping": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 22. ELEPHANT SANCTUARIES
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('elephant-sanctuaries', 'Ethical Elephant Sanctuaries',
'Where to have a genuine, ethical elephant experience in Thailand — and how to spot the tourist traps.',
'Thailand has over 200 elephant camps, but only a handful operate ethically. The gold standard is Elephant Nature Park (ENP) in Chiang Mai, founded by Sangduen "Lek" Chailert, which rescues elephants from logging and tourism industries. At ethical sanctuaries you observe elephants, prepare food for them, and may bathe alongside them in rivers — but you don''t ride them. Riding requires a painful "breaking" process that ethical operators refuse to support. Other reputable options: Boon Lott''s Elephant Sanctuary (Sukhothai), Elephant Haven (Kanchanaburi), and Burm and Emily''s Elephant Sanctuary (Chiang Mai). Red flags: riding, painting, circus tricks, or chained elephants.',
'nature', 'Various', 'Chiang Mai',
'{"nature": 0.9, "wildlife": 1, "ethical": 1, "family": 0.8, "photography": 0.8, "culture": 0.7}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 23. MUAY THAI
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('muay-thai', 'Muay Thai Experience',
'Watch authentic Muay Thai fights at legendary Bangkok stadiums, or train at a camp yourself — Thailand''s national sport is unforgettable.',
'Muay Thai (Thai boxing) is Thailand''s national sport and watching a live fight is one of the country''s most electrifying experiences. Bangkok has two legendary stadiums: Rajadamnern (est. 1945, the more prestigious) and Lumpinee (relocated to Ram Intra Road). Tickets for foreigners run 1,000-2,000 THB for ringside. The atmosphere — gambling, ceremonial wai kru dances, live traditional music — is unlike any other sporting event. For those wanting to train, camps in Bangkok (Evolve MMA, RSM Academy), Chiang Mai, Phuket, and Koh Phangan offer everything from single classes (500-800 THB) to months-long training residencies.',
'adventure', 'Bangkok', 'Bangkok',
'{"adventure": 0.9, "culture": 0.9, "fitness": 0.9, "nightlife": 0.6, "authentic": 0.8, "unique": 1}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 24. THAI COOKING CLASSES
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('thai-cooking-classes', 'Thai Cooking Classes',
'Learn to cook pad thai, green curry, and tom yum from scratch — most classes include a morning market visit.',
'A Thai cooking class is consistently rated one of the top activities in Thailand, and for good reason. Most half-day classes (900-1,500 THB) start with a visit to a local market where you learn to identify Thai ingredients — galangal vs ginger, kaffir lime leaves, shrimp paste, palm sugar. Then you cook 3-5 dishes in an outdoor kitchen, eat everything you''ve made, and receive a recipe booklet. Chiang Mai has the highest concentration of cooking schools (Mama Noi, Thai Farm Cooking, Asia Scenic). Bangkok options include Silom Thai Cooking School and Baipai. Many schools have vegetarian-friendly menus. Book a day ahead in peak season.',
'culture', 'Various', 'Chiang Mai',
'{"food": 1, "culture": 0.9, "family": 0.8, "unique": 0.8, "budget": 0.6, "authentic": 0.8}', false,
'attraction', 'manual', 'human_verified');

-- =============================================
-- 25. FULL MOON PARTY
-- =============================================
INSERT INTO attractions (slug, name, description, about, category, location, province, categories, is_hidden_gem, place_type, data_source, verification_status) VALUES
('full-moon-party', 'Full Moon Party',
'Koh Phangan''s legendary all-night beach rave — 10,000-30,000 people, neon paint, fire shows, and buckets of Thai whiskey.',
'The Full Moon Party at Haad Rin beach on Koh Phangan is Southeast Asia''s most famous party and has been running monthly since the late 1980s. The beach is lined with sound systems, each playing different genres (house, EDM, reggae, drum and bass, Thai pop). Fire dancers, neon body paint stations, and bucket cocktails (Thai whiskey + Red Bull + Coke, around 200-300 THB) define the atmosphere. Entry is 100 THB (or free if you arrive before a certain time). Peak attendance is December-January and around Songkran. Safety tips: wear shoes on the beach, don''t swim drunk, keep valuables locked at your accommodation, and arrange boat transport back to Koh Samui in advance.',
'adventure', 'Haad Rin Beach', 'Surat Thani',
'{"party": 1, "nightlife": 1, "beach": 0.7, "budget": 0.7, "adventure": 0.7, "unique": 0.9}', false,
'attraction', 'manual', 'human_verified');


-- =============================================
-- TIPS FOR NEW ATTRACTIONS
-- =============================================

-- Khao Yai tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'timing', 'Best Season for Wildlife', 'Visit during the dry season (November-February) for the best wildlife sightings. Hornbills are most active at dawn and dusk. Avoid weekends and Thai holidays when the park is packed.', 1
FROM attractions WHERE slug = 'khao-yai';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'transport', 'Getting There Without a Car', 'Minivans from Mo Chit in Bangkok to Pak Chong (150-200 THB, 3 hours). From Pak Chong, songthaews run to the park entrance for 50 THB. Inside the park, you''ll need to hire a guide with a vehicle (around 2,000 THB/day for a group) or join a tour.', 2
FROM attractions WHERE slug = 'khao-yai';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'money-saving', 'Save on Wine Tasting', 'PB Valley Khao Yai winery does tastings for 300 THB per person including a vineyard tour. Go during the grape harvest (February) for the most interesting visit. Buy direct at the winery — prices are 30% cheaper than Bangkok.', 3
FROM attractions WHERE slug = 'khao-yai';

-- Koh Tao tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'money-saving', 'Cheapest Dive Certification', 'Compare at least 3 dive shops before committing. PADI Open Water runs 8,000-10,000 THB. Most shops include free accommodation during the 3-4 day course — factor this into the value. Crystal Dive, Ban''s Diving, and Big Blue are well-established operations.', 1
FROM attractions WHERE slug = 'koh-tao';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'timing', 'Best Visibility Window', 'March through September offers the best underwater visibility (20-40 meters). October-November can bring rough seas and rain. Whale sharks are occasionally spotted at Chumphon Pinnacle from March to May.', 2
FROM attractions WHERE slug = 'koh-tao';

-- Chiang Rai tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'timing', 'Temple Circuit Strategy', 'Do the White Temple first thing in the morning (it opens at 8am) before tour buses arrive from Chiang Mai around 10am. Blue Temple and Black House are less crowded in the afternoon. The night market starts at 6pm — plan dinner there.', 1
FROM attractions WHERE slug = 'chiang-rai';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'transport', 'Getting from Chiang Mai', 'Green Bus runs hourly from Chiang Mai Bus Station 3 (Arcade) to Chiang Rai (166-288 THB, 3-4 hours). VIP buses have wider seats and are worth the extra 100 THB. AirAsia and Nok Air fly the route for 800-1,500 THB if booked early.', 2
FROM attractions WHERE slug = 'chiang-rai';

-- Koh Lipe tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'timing', 'Seasonal Access', 'Koh Lipe is only reliably accessible November through May. Ferries from Pak Bara (1.5 hours, 750 THB one-way) and speedboats from Koh Lanta (seasonal) are the main access. During rainy season, seas can be too rough for safe passage.', 1
FROM attractions WHERE slug = 'koh-lipe';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'money-saving', 'Eat on Walking Street', 'Skip the overpriced beachfront restaurants. Walking Street in the center has Thai restaurants with full meals for 100-200 THB. Sunrise Beach has the best water but the priciest food — compromise by eating in town and sunbathing on the beach.', 2
FROM attractions WHERE slug = 'koh-lipe';

-- Sukhothai tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'transport', 'Explore by Bicycle', 'Rent a bicycle from any guesthouse in New Sukhothai or at the park entrance (30-50 THB/day). The central zone is compact enough to cycle in 2-3 hours. The northern and western zones require more time and energy but have far fewer visitors.', 1
FROM attractions WHERE slug = 'sukhothai';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'timing', 'Dawn and Dusk Photography', 'The central zone is open 6:30am-6:00pm. Arrive at opening for the best light and fewest tourists. Late afternoon (4-6pm) also works well, with warm light on the ruins. The park entrance fee is 100 THB per zone per day.', 2
FROM attractions WHERE slug = 'sukhothai';

-- Kanchanaburi tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'timing', 'Erawan Falls Strategy', 'Arrive at park opening (8:00am) to have the lower tiers to yourself. The full climb to tier 7 takes 1.5-2 hours each way. Tiers 1-3 are easy; tiers 4-7 involve scrambling. Weekends are extremely crowded — go on a weekday if possible. Entry is 300 THB for foreigners.', 1
FROM attractions WHERE slug = 'kanchanaburi';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'transport', 'Day Trip from Bangkok', 'Minivans leave Bangkok''s Southern Bus Terminal for Kanchanaburi (120-150 THB, 2.5 hours). Or take the iconic train from Thonburi station (100 THB, 3 hours). The Bridge and Death Railway can be done as a day trip; add Erawan Falls and you''ll need an overnight stay.', 2
FROM attractions WHERE slug = 'kanchanaburi';

-- Full Moon Party tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'prep', 'Survival Essentials', 'Wear closed shoes (broken glass on the beach is real). Leave valuables at your accommodation. Bring cash only — enough for drinks and boat back. Wear clothes you don''t mind ruining (neon paint doesn''t wash out). Apply mosquito repellent before going.', 1
FROM attractions WHERE slug = 'full-moon-party';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'transport', 'Getting Home After', 'Pre-book your boat back to Koh Samui. After the party (around 6-8am), boats get packed and expensive. Many hostels on Haad Rin include boat transfers in their package. If staying in Thong Sala or elsewhere on Koh Phangan, songthaews run until around 2am and resume at 5am.', 2
FROM attractions WHERE slug = 'full-moon-party';

-- Phi Phi tips
INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'timing', 'Maya Bay Booking', 'Maya Bay allows limited visitors per day. Book through the DNP (Department of National Parks) app or website in advance. Morning slots (7-10am) have the calmest water and best light. Afternoon slots are less crowded. Entry is 400 THB for foreigners.', 1
FROM attractions WHERE slug = 'phi-phi-islands';

INSERT INTO attraction_tips (attraction_id, tip_type, title, content, sort_order)
SELECT id, 'money-saving', 'Skip the Day Trip', 'Day trips from Phuket or Krabi are expensive (1,500-2,500 THB) and rushed. Stay overnight on Phi Phi Don — accommodation starts at 500 THB for a dorm and you can explore at your own pace, catching sunrise at the viewpoint without the crowds.', 2
FROM attractions WHERE slug = 'phi-phi-islands';


-- =============================================
-- SECRETS FOR NEW ATTRACTIONS (Pro-only)
-- =============================================

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, sort_order)
SELECT id, 'hidden-spot', 'Night Safari Drives', 'Book the park''s official night safari drive (1,000 THB per vehicle) for a chance to see wild elephants, sambar deer, and civets on the park roads after dark. Ask for the Khao Khiao route — it has the highest elephant encounter rate.', 'Park headquarters', 1
FROM attractions WHERE slug = 'khao-yai';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, sort_order)
SELECT id, 'insider-tip', 'Tanote Bay Secret Beach', 'Walk past the end of Tanote Bay to the right over the rocks. After 5 minutes of scrambling you''ll find a tiny hidden cove with some of the island''s best snorkeling — nurse sharks rest here in the mornings.', 'South end of Tanote Bay', 1
FROM attractions WHERE slug = 'koh-tao';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, sort_order)
SELECT id, 'hidden-spot', 'Singha Park Sunrise', 'Singha Park tea plantation opens at 7am but the access road is ungated. Drive up before dawn for misty sunrise views over the tea fields without anyone else around. The on-site cafe opens at 8am for excellent local coffee.', 'Singha Park, Mae Chan district', 1
FROM attractions WHERE slug = 'chiang-rai';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, sort_order)
SELECT id, 'local-food', 'Secret Seafood Market', 'At the southern end of Walking Street, past the tattoo shops, there''s a small open-air seafood area where local fishermen sell the day''s catch grilled to order. A full grilled fish with som tam and sticky rice is 200-300 THB — half the price of beachfront restaurants.', 'South end of Walking Street', 1
FROM attractions WHERE slug = 'koh-lipe';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, sort_order)
SELECT id, 'experience', 'Wat Si Chum Inner Staircase', 'There''s a narrow staircase hidden within the walls of Wat Si Chum that leads up behind the massive Buddha. The stairway has ceiling jataka tale engravings from the Sukhothai era. Ask a park ranger to unlock the door — it''s not officially promoted but they''ll usually oblige.', 'Wat Si Chum, northern zone', 1
FROM attractions WHERE slug = 'sukhothai';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, sort_order)
SELECT id, 'hidden-spot', 'Erawan Tier 7 Swimming', 'Most visitors stop at tier 3 or 4. Tier 7 has a deep emerald pool with a rope swing and almost no one around — it''s a genuine reward for the climb. Bring water shoes as the limestone is slippery.', 'Erawan Falls tier 7', 1
FROM attractions WHERE slug = 'kanchanaburi';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, sort_order)
SELECT id, 'insider-tip', 'Pre-Party at Mushroom Mountain', 'The real Koh Phangan experience starts at the pre-party bars on the hill above Haad Rin. Mushroom Mountain bar has panoramic views, cheaper drinks than the beach, and plays better music. Head down to the beach party after midnight when it peaks.', 'Hill above Haad Rin', 1
FROM attractions WHERE slug = 'full-moon-party';

INSERT INTO attraction_secrets (attraction_id, secret_type, title, content, location_hint, sort_order)
SELECT id, 'hidden-spot', 'Long Beach Empty Section', 'The northern end of Long Beach past the resorts becomes completely empty. Walk 10 minutes beyond the last resort and you''ll have pristine beach to yourself — bring a snorkel as the offshore coral here is undisturbed.', 'North end of Long Beach', 1
FROM attractions WHERE slug = 'phi-phi-islands';


-- =============================================
-- RECOMMENDATIONS FOR NEW ATTRACTIONS
-- =============================================

-- Khao Yai recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'restaurant', 'Midwinter Green', 'Farm-to-table restaurant in the Khao Yai vineyard area.', 'Uses ingredients from their own garden. The mushroom soup and grilled pork neck are exceptional.', '$$', 1
FROM attractions WHERE slug = 'khao-yai';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'activity', 'PB Valley Khao Yai Winery', 'Thailand''s most established winery with vineyard tours and tastings.', 'Wine tasting flight is 300 THB. Surprisingly decent Chenin Blanc and Shiraz.', '$$', 2
FROM attractions WHERE slug = 'khao-yai';

-- Koh Tao recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'restaurant', 'Barracuda Restaurant', 'Seafood restaurant on the main road in Mae Haad.', 'The catch-of-the-day BBQ platter is the best value seafood meal on the island.', '$$', 1
FROM attractions WHERE slug = 'koh-tao';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'activity', 'Crystal Dive Resort', 'One of the island''s oldest and most reputable dive schools.', 'PADI Open Water from 9,800 THB including accommodation. Small class sizes and experienced instructors.', '$$', 2
FROM attractions WHERE slug = 'koh-tao';

-- Chiang Rai recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'restaurant', 'Chivit Thamma Da Coffee House', 'Riverside cafe with gardens and excellent coffee.', 'Beautiful setting on the Kok River. Great for coffee and cake after a day of temple-hopping.', '$', 1
FROM attractions WHERE slug = 'chiang-rai';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'hotel', 'Le Meridien Chiang Rai Resort', 'Riverside resort 15 minutes from town.', 'Best pool in Chiang Rai with river views. Prices are reasonable by international standards (3,000-5,000 THB).', '$$$', 2
FROM attractions WHERE slug = 'chiang-rai';

-- Phi Phi recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'restaurant', 'Unni''s Restaurant', 'Family-run Thai restaurant in Tonsai Village.', 'The panang curry and papaya salad are made fresh to order. One of the few places on Phi Phi that doesn''t feel like a tourist trap.', '$', 1
FROM attractions WHERE slug = 'phi-phi-islands';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'activity', 'Phi Phi Viewpoint Trek', 'A steep 20-minute climb to the iconic viewpoint.', 'Free to access. Best at sunrise (bring a headlamp). The view of the twin bays is one of Thailand''s most photographed scenes.', '$', 2
FROM attractions WHERE slug = 'phi-phi-islands';

-- Kanchanaburi recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'hotel', 'River Kwai Jungle Rafts', 'Floating bamboo raft accommodation on the river.', 'No electricity, no wifi — just the sound of the river. Kerosene lamps at night. A genuinely unique overnight experience.', '$$', 1
FROM attractions WHERE slug = 'kanchanaburi';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'activity', 'Hellfire Pass Memorial Walk', 'Hiking trail along the most brutal section of the Death Railway.', 'The museum (free, Australian-run) provides sobering context. The trail itself follows the original railway cutting through solid rock — done by hand by POWs.', '$', 2
FROM attractions WHERE slug = 'kanchanaburi';

-- Sukhothai recommendations
INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'restaurant', 'Poo Restaurant', 'Simple local restaurant near the historical park entrance.', 'The cheapest and best pad thai in Sukhothai. Run by a family who''ve been here for decades. 60-80 THB per dish.', '$', 1
FROM attractions WHERE slug = 'sukhothai';

INSERT INTO attraction_recommendations (attraction_id, rec_type, name, description, why_special, price_range, sort_order)
SELECT id, 'hotel', 'Legendha Sukhothai Resort', 'Thai-style resort between Old and New Sukhothai.', 'Traditional Sukhothai architecture with modern comforts. Pool surrounded by lotus ponds. 1,500-2,500 THB per night.', '$$', 2
FROM attractions WHERE slug = 'sukhothai';
