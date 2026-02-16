-- Migration 011: Fix province extraction and category misclassification
-- Cleans up 70 records with NULL province and corrects miscategorized places

-- ============================================
-- STEP 1: Fix NULL provinces using district/location patterns
-- ============================================

-- Chonburi province (Pattaya area)
UPDATE attractions SET province = 'Chonburi'
WHERE province IS NULL AND (
  location ILIKE '%Bang Lamung%'
  OR location ILIKE '%Sattahip%'
  OR location ILIKE '%Pattaya%'
  OR location ILIKE '%Nong Prue%'
  OR location ILIKE '%Nong Pla Lai%'
  OR location ILIKE '%Huai Kapi%'
  OR location ILIKE '%Na Chom Thian%'
  OR location ILIKE '%Chon Buri%'
  OR location ILIKE '%Jomtien%'
  OR location ILIKE '%Ko Lan%'
  OR location ILIKE '%Ko Larn%'
);

-- Phuket province
UPDATE attractions SET province = 'Phuket'
WHERE province IS NULL AND (
  location ILIKE '%Kathu%'
  OR location ILIKE '%Thalang%'
  OR location ILIKE '%Mueang Phuket%'
  OR location ILIKE '%Chalong%'
  OR location ILIKE '%Pa Tong%'
  OR location ILIKE '%Patong%'
  OR location ILIKE '%Karon%'
  OR location ILIKE '%phuket%'
  OR location ILIKE '%Wichit%'
);

-- Krabi province
UPDATE attractions SET province = 'Krabi'
WHERE province IS NULL AND (
  location ILIKE '%Ko Lanta%'
  OR location ILIKE '%Koh Lanta%'
  OR location ILIKE '%Mueang Krabi%'
  OR location ILIKE '%Ao Nang%'
  OR location ILIKE '%Railay%'
);

-- Surat Thani province (islands)
UPDATE attractions SET province = 'Surat Thani'
WHERE province IS NULL AND (
  location ILIKE '%Ko Pha-ngan%'
  OR location ILIKE '%Koh Phangan%'
  OR location ILIKE '%Ko Samui%'
  OR location ILIKE '%Koh Samui%'
  OR location ILIKE '%Ko Tao%'
  OR location ILIKE '%Koh Tao%'
  OR location ILIKE '%Bo Put%'
  OR location ILIKE '%Chaweng%'
);

-- Phang Nga province
UPDATE attractions SET province = 'Phang Nga'
WHERE province IS NULL AND (
  location ILIKE '%Takua Pa%'
  OR location ILIKE '%Takua Thung%'
  OR location ILIKE '%Khao Lak%'
  OR location ILIKE '%Mueang Phang-nga%'
);

-- Chiang Mai province
UPDATE attractions SET province = 'Chiang Mai'
WHERE province IS NULL AND (
  location ILIKE '%Mae Taeng%'
  OR location ILIKE '%Doi Saket%'
  OR location ILIKE '%San Kamphaeng%'
  OR location ILIKE '%Mueang Chiang Mai%'
  OR location ILIKE '%Mae Wang%'
  OR location ILIKE '%Su Thep%'
  OR location ILIKE '%Chiang Mai%'
);

-- Mae Hong Son province
UPDATE attractions SET province = 'Mae Hong Son'
WHERE province IS NULL AND (
  location ILIKE '%Pai%'
  OR location ILIKE '%Mae Hi%'
);

-- Kanchanaburi province
UPDATE attractions SET province = 'Kanchanaburi'
WHERE province IS NULL AND (
  location ILIKE '%Mueang Kanchanaburi%'
  OR location ILIKE '%Sai Yok%'
);

-- Prachinburi province
UPDATE attractions SET province = 'Prachinburi'
WHERE province IS NULL AND location ILIKE '%Prachin Buri%';

-- Samut Prakan province
UPDATE attractions SET province = 'Samut Prakan'
WHERE province IS NULL AND location ILIKE '%Samut Prakan%';

-- Phitsanulok province
UPDATE attractions SET province = 'Phitsanulok'
WHERE province IS NULL AND location ILIKE '%Phitsanulok%';

-- Phetchabun province
UPDATE attractions SET province = 'Phetchabun'
WHERE province IS NULL AND location ILIKE '%Bueng Sam Phan%';

-- Saraburi province
UPDATE attractions SET province = 'Saraburi'
WHERE province IS NULL AND location ILIKE '%Kaeng Khoi%';

-- Bangkok
UPDATE attractions SET province = 'Bangkok'
WHERE province IS NULL AND (
  location ILIKE '%Khlong Toei%'
  OR location ILIKE '%Suan Luang%'
  OR location ILIKE '%Phra Nakhon%'
  OR location ILIKE '%Talat Yot%'
  OR location ILIKE '%Sukhumvit%'
  OR location ILIKE '%Khet %'
);

-- ============================================
-- STEP 2: Fix miscategorized restaurants
-- ============================================

UPDATE attractions
SET category = 'food', place_type = 'restaurant'
WHERE place_type != 'restaurant'
  AND category != 'food'
  AND (
    name ILIKE '%restaurant%'
    OR name ILIKE '%kitchen%'
    OR name ILIKE '%bistro%'
  );

-- ============================================
-- STEP 3: Fix miscategorized beaches
-- ============================================

UPDATE attractions
SET category = 'beach'
WHERE category = 'culture'
  AND name ILIKE '%beach%';

-- ============================================
-- STEP 4: Fix miscategorized waterfalls
-- ============================================

UPDATE attractions
SET category = 'nature'
WHERE category = 'culture'
  AND name ILIKE '%waterfall%';

-- ============================================
-- STEP 5: Fix miscategorized dive centers/courses
-- ============================================

UPDATE attractions
SET place_type = 'course', category = 'adventure'
WHERE category = 'culture'
  AND (
    name ILIKE '%diving%'
    OR name ILIKE '%divers%'
    OR name ILIKE '%scuba%'
  );

-- ============================================
-- STEP 6: Fix miscategorized viewpoints
-- ============================================

UPDATE attractions
SET category = 'nature'
WHERE category = 'culture'
  AND (name ILIKE '%viewpoint%' OR name ILIKE '%view point%');
