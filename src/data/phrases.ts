export interface ThaiPhrase {
  id: number
  english: string
  thai: string
  phonetic: string
  context?: string
  category: PhraseCategory
}

export type PhraseCategory =
  | 'greetings'
  | 'polite'
  | 'numbers'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'directions'
  | 'emergency'
  | 'medical'
  | 'accommodation'
  | 'conversation'
  | 'bargaining'
  | 'time'
  | 'weather'

export const CATEGORY_CONFIG: Record<PhraseCategory, { label: string; icon: string; description: string }> = {
  greetings: { label: 'Greetings', icon: '👋', description: 'Hello, goodbye, and basic greetings' },
  polite: { label: 'Polite Words', icon: '🙏', description: 'Thank you, sorry, and polite expressions' },
  numbers: { label: 'Numbers', icon: '🔢', description: 'Counting, prices, and quantities' },
  food: { label: 'Food & Drink', icon: '🍜', description: 'Ordering, dietary needs, and food vocabulary' },
  transport: { label: 'Transport', icon: '🚕', description: 'Taxis, buses, trains, and getting around' },
  shopping: { label: 'Shopping', icon: '🛍️', description: 'Buying, sizes, colors, and market vocab' },
  directions: { label: 'Directions', icon: '🧭', description: 'Left, right, near, far, and finding places' },
  emergency: { label: 'Emergency', icon: '🆘', description: 'Help, police, hospital, and urgent situations' },
  medical: { label: 'Medical', icon: '🏥', description: 'Health, symptoms, pharmacy, and doctor visits' },
  accommodation: { label: 'Accommodation', icon: '🏨', description: 'Hotels, check-in, room requests' },
  conversation: { label: 'Conversation', icon: '💬', description: 'Small talk, introductions, and chatting' },
  bargaining: { label: 'Bargaining', icon: '💰', description: 'Negotiating prices at markets' },
  time: { label: 'Time & Days', icon: '🕐', description: 'Days, months, and telling time' },
  weather: { label: 'Weather', icon: '🌤️', description: 'Hot, cold, rain, and climate' },
}

export const phrases: ThaiPhrase[] = [
  // ========== GREETINGS (15) ==========
  { id: 1, english: 'Hello', thai: 'สวัสดี', phonetic: 'sa-wat-dee', context: 'Add krap (male) or ka (female) at the end', category: 'greetings' },
  { id: 2, english: 'Hello (male speaker)', thai: 'สวัสดีครับ', phonetic: 'sa-wat-dee krap', category: 'greetings' },
  { id: 3, english: 'Hello (female speaker)', thai: 'สวัสดีค่ะ', phonetic: 'sa-wat-dee ka', category: 'greetings' },
  { id: 4, english: 'How are you?', thai: 'สบายดีไหม', phonetic: 'sa-bai dee mai', category: 'greetings' },
  { id: 5, english: 'I\'m fine', thai: 'สบายดี', phonetic: 'sa-bai dee', category: 'greetings' },
  { id: 6, english: 'Good morning', thai: 'อรุณสวัสดิ์', phonetic: 'a-run sa-wat', context: 'Formal; most Thais just say sa-wat-dee any time of day', category: 'greetings' },
  { id: 7, english: 'Good evening', thai: 'สวัสดีตอนเย็น', phonetic: 'sa-wat-dee ton yen', category: 'greetings' },
  { id: 8, english: 'Goodbye', thai: 'ลาก่อน', phonetic: 'la gon', context: 'Formal. Informally, Thais say sa-wat-dee for goodbye too', category: 'greetings' },
  { id: 9, english: 'See you later', thai: 'เจอกันใหม่', phonetic: 'jer gan mai', category: 'greetings' },
  { id: 10, english: 'Nice to meet you', thai: 'ยินดีที่ได้รู้จัก', phonetic: 'yin-dee tee dai roo-jak', category: 'greetings' },
  { id: 11, english: 'What\'s your name?', thai: 'คุณชื่ออะไร', phonetic: 'kun cheu a-rai', category: 'greetings' },
  { id: 12, english: 'My name is...', thai: 'ผม/ฉันชื่อ...', phonetic: 'pom/chan cheu...', context: 'Pom for males, chan for females', category: 'greetings' },
  { id: 13, english: 'Welcome', thai: 'ยินดีต้อนรับ', phonetic: 'yin-dee ton-rap', category: 'greetings' },
  { id: 14, english: 'Long time no see', thai: 'ไม่ได้เจอกันนาน', phonetic: 'mai dai jer gan naan', category: 'greetings' },
  { id: 15, english: 'Have a good trip', thai: 'เดินทางปลอดภัย', phonetic: 'dern taang plod-pai', category: 'greetings' },

  // ========== POLITE WORDS (15) ==========
  { id: 16, english: 'Thank you', thai: 'ขอบคุณ', phonetic: 'kop-kun', context: 'Add krap/ka for politeness', category: 'polite' },
  { id: 17, english: 'Thank you very much', thai: 'ขอบคุณมาก', phonetic: 'kop-kun maak', category: 'polite' },
  { id: 18, english: 'You\'re welcome', thai: 'ไม่เป็นไร', phonetic: 'mai pen rai', context: 'Also means "never mind" or "no problem"', category: 'polite' },
  { id: 19, english: 'Excuse me', thai: 'ขอโทษ', phonetic: 'kor-toht', context: 'Used for both "excuse me" and "sorry"', category: 'polite' },
  { id: 20, english: 'Sorry', thai: 'ขอโทษ', phonetic: 'kor-toht', category: 'polite' },
  { id: 21, english: 'Please', thai: 'กรุณา', phonetic: 'ga-ru-naa', context: 'Formal. Informally, add krap/ka to any request', category: 'polite' },
  { id: 22, english: 'No problem', thai: 'ไม่มีปัญหา', phonetic: 'mai mee pan-haa', category: 'polite' },
  { id: 23, english: 'Yes', thai: 'ใช่', phonetic: 'chai', category: 'polite' },
  { id: 24, english: 'No', thai: 'ไม่', phonetic: 'mai', category: 'polite' },
  { id: 25, english: 'No, thank you', thai: 'ไม่เอา ขอบคุณ', phonetic: 'mai ao, kop-kun', context: 'Very useful for declining hawkers politely', category: 'polite' },
  { id: 26, english: 'It doesn\'t matter', thai: 'ไม่เป็นไร', phonetic: 'mai pen rai', context: 'The quintessential Thai phrase — "don\'t worry about it"', category: 'polite' },
  { id: 27, english: 'Polite particle (male)', thai: 'ครับ', phonetic: 'krap', context: 'Add to end of sentences for politeness', category: 'polite' },
  { id: 28, english: 'Polite particle (female)', thai: 'ค่ะ / คะ', phonetic: 'ka / ka', context: 'Ka (falling tone) for statements, ka (rising) for questions', category: 'polite' },
  { id: 29, english: 'That\'s okay', thai: 'ได้เลย', phonetic: 'dai loey', category: 'polite' },
  { id: 30, english: 'After you', thai: 'เชิญครับ/ค่ะ', phonetic: 'chern krap/ka', category: 'polite' },

  // ========== NUMBERS (20) ==========
  { id: 31, english: 'Zero', thai: 'ศูนย์', phonetic: 'soon', category: 'numbers' },
  { id: 32, english: 'One', thai: 'หนึ่ง', phonetic: 'neung', category: 'numbers' },
  { id: 33, english: 'Two', thai: 'สอง', phonetic: 'song', category: 'numbers' },
  { id: 34, english: 'Three', thai: 'สาม', phonetic: 'saam', category: 'numbers' },
  { id: 35, english: 'Four', thai: 'สี่', phonetic: 'see', category: 'numbers' },
  { id: 36, english: 'Five', thai: 'ห้า', phonetic: 'haa', category: 'numbers' },
  { id: 37, english: 'Six', thai: 'หก', phonetic: 'hok', category: 'numbers' },
  { id: 38, english: 'Seven', thai: 'เจ็ด', phonetic: 'jet', category: 'numbers' },
  { id: 39, english: 'Eight', thai: 'แปด', phonetic: 'bpaet', category: 'numbers' },
  { id: 40, english: 'Nine', thai: 'เก้า', phonetic: 'gao', category: 'numbers' },
  { id: 41, english: 'Ten', thai: 'สิบ', phonetic: 'sip', category: 'numbers' },
  { id: 42, english: 'Twenty', thai: 'ยี่สิบ', phonetic: 'yee-sip', category: 'numbers' },
  { id: 43, english: 'Fifty', thai: 'ห้าสิบ', phonetic: 'haa-sip', category: 'numbers' },
  { id: 44, english: 'One hundred', thai: 'หนึ่งร้อย', phonetic: 'neung roi', category: 'numbers' },
  { id: 45, english: 'One thousand', thai: 'หนึ่งพัน', phonetic: 'neung pan', category: 'numbers' },
  { id: 46, english: 'Ten thousand', thai: 'หนึ่งหมื่น', phonetic: 'neung meun', category: 'numbers' },
  { id: 47, english: 'How much?', thai: 'เท่าไหร่', phonetic: 'tao-rai', context: 'Essential for markets and taxis', category: 'numbers' },
  { id: 48, english: 'How many?', thai: 'กี่', phonetic: 'gee', context: 'Followed by a classifier word', category: 'numbers' },
  { id: 49, english: 'One item (classifier)', thai: 'อันหนึ่ง', phonetic: 'an neung', context: '"An" is a general classifier for objects', category: 'numbers' },
  { id: 50, english: 'Two people', thai: 'สองคน', phonetic: 'song kon', context: '"Kon" is the classifier for people', category: 'numbers' },

  // ========== FOOD & DRINK (25) ==========
  { id: 51, english: 'I\'m hungry', thai: 'หิวข้าว', phonetic: 'hiu kao', category: 'food' },
  { id: 52, english: 'I\'m thirsty', thai: 'หิวน้ำ', phonetic: 'hiu nam', category: 'food' },
  { id: 53, english: 'Delicious!', thai: 'อร่อย', phonetic: 'a-roi', context: 'Thais love hearing foreigners say this', category: 'food' },
  { id: 54, english: 'Not spicy', thai: 'ไม่เผ็ด', phonetic: 'mai pet', context: 'Essential! Say this when ordering', category: 'food' },
  { id: 55, english: 'A little spicy', thai: 'เผ็ดนิดหน่อย', phonetic: 'pet nit noi', context: 'Thai "a little" is still quite spicy for most foreigners', category: 'food' },
  { id: 56, english: 'Very spicy', thai: 'เผ็ดมาก', phonetic: 'pet maak', category: 'food' },
  { id: 57, english: 'No sugar', thai: 'ไม่ใส่น้ำตาล', phonetic: 'mai sai nam-taan', context: 'Important for drinks — Thai drinks are very sweet by default', category: 'food' },
  { id: 58, english: 'Less sugar', thai: 'น้ำตาลน้อย', phonetic: 'nam-taan noi', category: 'food' },
  { id: 59, english: 'No MSG', thai: 'ไม่ใส่ผงชูรส', phonetic: 'mai sai pong-choo-rot', category: 'food' },
  { id: 60, english: 'Water', thai: 'น้ำ', phonetic: 'nam', category: 'food' },
  { id: 61, english: 'Drinking water', thai: 'น้ำเปล่า', phonetic: 'nam bplao', context: 'Specify this to get plain water, not flavored', category: 'food' },
  { id: 62, english: 'Iced coffee', thai: 'กาแฟเย็น', phonetic: 'ga-fae yen', category: 'food' },
  { id: 63, english: 'Beer', thai: 'เบียร์', phonetic: 'bia', category: 'food' },
  { id: 64, english: 'The bill, please', thai: 'เช็คบิลด้วย', phonetic: 'check bin duay', context: 'Or just make a writing gesture in the air', category: 'food' },
  { id: 65, english: 'I\'m vegetarian', thai: 'ฉันกินเจ', phonetic: 'chan gin jay', context: '"Jay" is strict vegan (no garlic/onion). "Mang-sa-wi-rat" is regular vegetarian', category: 'food' },
  { id: 66, english: 'Vegetarian (regular)', thai: 'มังสวิรัติ', phonetic: 'mang-sa-wi-rat', category: 'food' },
  { id: 67, english: 'No meat', thai: 'ไม่ใส่เนื้อสัตว์', phonetic: 'mai sai neua sat', category: 'food' },
  { id: 68, english: 'Chicken', thai: 'ไก่', phonetic: 'gai', category: 'food' },
  { id: 69, english: 'Pork', thai: 'หมู', phonetic: 'moo', category: 'food' },
  { id: 70, english: 'Shrimp / Prawn', thai: 'กุ้ง', phonetic: 'goong', category: 'food' },
  { id: 71, english: 'Fish', thai: 'ปลา', phonetic: 'bplaa', category: 'food' },
  { id: 72, english: 'Rice', thai: 'ข้าว', phonetic: 'kao', category: 'food' },
  { id: 73, english: 'Fried rice', thai: 'ข้าวผัด', phonetic: 'kao pat', category: 'food' },
  { id: 74, english: 'Pad Thai', thai: 'ผัดไทย', phonetic: 'pat tai', category: 'food' },
  { id: 75, english: 'I\'m allergic to peanuts', thai: 'ฉันแพ้ถั่ว', phonetic: 'chan pae tua', context: 'Pae = allergic. Very important for food allergies', category: 'food' },

  // ========== TRANSPORT (20) ==========
  { id: 76, english: 'Where is...?', thai: '...อยู่ที่ไหน', phonetic: '...yoo tee nai', category: 'transport' },
  { id: 77, english: 'I want to go to...', thai: 'อยากไป...', phonetic: 'yaak bpai...', category: 'transport' },
  { id: 78, english: 'How far?', thai: 'ไกลไหม', phonetic: 'glai mai', category: 'transport' },
  { id: 79, english: 'How long? (time)', thai: 'นานแค่ไหน', phonetic: 'naan kae nai', category: 'transport' },
  { id: 80, english: 'Stop here', thai: 'จอดที่นี่', phonetic: 'jot tee nee', context: 'Essential for taxis and songthaews', category: 'transport' },
  { id: 81, english: 'Turn left', thai: 'เลี้ยวซ้าย', phonetic: 'liao sai', category: 'transport' },
  { id: 82, english: 'Turn right', thai: 'เลี้ยวขวา', phonetic: 'liao kwaa', category: 'transport' },
  { id: 83, english: 'Go straight', thai: 'ตรงไป', phonetic: 'dtrong bpai', category: 'transport' },
  { id: 84, english: 'Use the meter', thai: 'ใช้มิเตอร์', phonetic: 'chai mi-ter', context: 'Say this firmly to Bangkok taxi drivers', category: 'transport' },
  { id: 85, english: 'Airport', thai: 'สนามบิน', phonetic: 'sa-naam bin', category: 'transport' },
  { id: 86, english: 'Bus station', thai: 'สถานีรถบัส', phonetic: 'sa-taa-nee rot-bat', category: 'transport' },
  { id: 87, english: 'Train station', thai: 'สถานีรถไฟ', phonetic: 'sa-taa-nee rot-fai', category: 'transport' },
  { id: 88, english: 'Pier / Boat dock', thai: 'ท่าเรือ', phonetic: 'taa reua', category: 'transport' },
  { id: 89, english: 'Taxi', thai: 'แท็กซี่', phonetic: 'taek-see', category: 'transport' },
  { id: 90, english: 'Motorcycle taxi', thai: 'มอเตอร์ไซค์', phonetic: 'mor-ter-sai', context: 'Guys in orange vests at soi entrances', category: 'transport' },
  { id: 91, english: 'How much to go to...?', thai: 'ไป...เท่าไหร่', phonetic: 'bpai...tao-rai', category: 'transport' },
  { id: 92, english: 'Is it near here?', thai: 'ใกล้ที่นี่ไหม', phonetic: 'glai tee-nee mai', category: 'transport' },
  { id: 93, english: 'Can you wait?', thai: 'รอได้ไหม', phonetic: 'ror dai mai', category: 'transport' },
  { id: 94, english: 'Slow down', thai: 'ช้าลง', phonetic: 'chaa long', category: 'transport' },
  { id: 95, english: 'I\'m lost', thai: 'หลงทาง', phonetic: 'long taang', category: 'transport' },

  // ========== SHOPPING (15) ==========
  { id: 96, english: 'How much is this?', thai: 'อันนี้เท่าไหร่', phonetic: 'an-nee tao-rai', category: 'shopping' },
  { id: 97, english: 'Too expensive', thai: 'แพงไป', phonetic: 'paeng bpai', category: 'shopping' },
  { id: 98, english: 'Can you lower the price?', thai: 'ลดได้ไหม', phonetic: 'lot dai mai', category: 'shopping' },
  { id: 99, english: 'I\'ll take it', thai: 'เอาอันนี้', phonetic: 'ao an nee', category: 'shopping' },
  { id: 100, english: 'I don\'t want it', thai: 'ไม่เอา', phonetic: 'mai ao', context: 'Polite but firm way to decline', category: 'shopping' },
  { id: 101, english: 'Do you have a bigger size?', thai: 'มีไซส์ใหญ่กว่านี้ไหม', phonetic: 'mee size yai gwaa nee mai', category: 'shopping' },
  { id: 102, english: 'Do you have a smaller size?', thai: 'มีไซส์เล็กกว่านี้ไหม', phonetic: 'mee size lek gwaa nee mai', category: 'shopping' },
  { id: 103, english: 'Red', thai: 'สีแดง', phonetic: 'see daeng', category: 'shopping' },
  { id: 104, english: 'Blue', thai: 'สีน้ำเงิน', phonetic: 'see nam-ngern', category: 'shopping' },
  { id: 105, english: 'Black', thai: 'สีดำ', phonetic: 'see dam', category: 'shopping' },
  { id: 106, english: 'White', thai: 'สีขาว', phonetic: 'see kao', category: 'shopping' },
  { id: 107, english: 'Can I try it on?', thai: 'ลองได้ไหม', phonetic: 'long dai mai', category: 'shopping' },
  { id: 108, english: 'Just looking', thai: 'ดูเฉยๆ', phonetic: 'doo choey choey', category: 'shopping' },
  { id: 109, english: 'Do you accept credit card?', thai: 'รับบัตรเครดิตไหม', phonetic: 'rap bat credit mai', category: 'shopping' },
  { id: 110, english: 'Can I have a bag?', thai: 'ขอถุงได้ไหม', phonetic: 'kor tung dai mai', category: 'shopping' },

  // ========== DIRECTIONS (15) ==========
  { id: 111, english: 'Where is the bathroom?', thai: 'ห้องน้ำอยู่ที่ไหน', phonetic: 'hong-nam yoo tee nai', context: 'Probably the most useful phrase in Thailand', category: 'directions' },
  { id: 112, english: 'Left', thai: 'ซ้าย', phonetic: 'sai', category: 'directions' },
  { id: 113, english: 'Right', thai: 'ขวา', phonetic: 'kwaa', category: 'directions' },
  { id: 114, english: 'Straight ahead', thai: 'ตรงไป', phonetic: 'dtrong bpai', category: 'directions' },
  { id: 115, english: 'Near', thai: 'ใกล้', phonetic: 'glai', category: 'directions' },
  { id: 116, english: 'Far', thai: 'ไกล', phonetic: 'glai', context: 'Same romanization as "near" but different Thai tone', category: 'directions' },
  { id: 117, english: 'Here', thai: 'ที่นี่', phonetic: 'tee-nee', category: 'directions' },
  { id: 118, english: 'There', thai: 'ที่นั่น', phonetic: 'tee-nan', category: 'directions' },
  { id: 119, english: 'Map', thai: 'แผนที่', phonetic: 'paen-tee', category: 'directions' },
  { id: 120, english: 'Next to', thai: 'ข้างๆ', phonetic: 'kaang kaang', category: 'directions' },
  { id: 121, english: 'In front of', thai: 'ข้างหน้า', phonetic: 'kaang naa', category: 'directions' },
  { id: 122, english: 'Behind', thai: 'ข้างหลัง', phonetic: 'kaang lang', category: 'directions' },
  { id: 123, english: 'Across from', thai: 'ตรงข้าม', phonetic: 'dtrong kaam', category: 'directions' },
  { id: 124, english: 'At the corner', thai: 'ตรงหัวมุม', phonetic: 'dtrong hua mum', category: 'directions' },
  { id: 125, english: 'Can you show me on the map?', thai: 'ช่วยชี้บนแผนที่ได้ไหม', phonetic: 'chuay chee bon paen-tee dai mai', category: 'directions' },

  // ========== EMERGENCY (15) ==========
  { id: 126, english: 'Help!', thai: 'ช่วยด้วย!', phonetic: 'chuay duay!', category: 'emergency' },
  { id: 127, english: 'Call the police', thai: 'เรียกตำรวจ', phonetic: 'riak dtam-ruat', category: 'emergency' },
  { id: 128, english: 'Call an ambulance', thai: 'เรียกรถพยาบาล', phonetic: 'riak rot pa-yaa-baan', category: 'emergency' },
  { id: 129, english: 'Fire!', thai: 'ไฟไหม้!', phonetic: 'fai mai!', category: 'emergency' },
  { id: 130, english: 'I need a doctor', thai: 'ต้องการหมอ', phonetic: 'dtong-gaan mor', category: 'emergency' },
  { id: 131, english: 'Hospital', thai: 'โรงพยาบาล', phonetic: 'rohng pa-yaa-baan', category: 'emergency' },
  { id: 132, english: 'Police station', thai: 'สถานีตำรวจ', phonetic: 'sa-taa-nee dtam-ruat', category: 'emergency' },
  { id: 133, english: 'I\'m lost', thai: 'ฉันหลงทาง', phonetic: 'chan long taang', category: 'emergency' },
  { id: 134, english: 'My bag was stolen', thai: 'กระเป๋าถูกขโมย', phonetic: 'gra-bpao took ka-moy', category: 'emergency' },
  { id: 135, english: 'My passport was stolen', thai: 'พาสปอร์ตถูกขโมย', phonetic: 'passport took ka-moy', category: 'emergency' },
  { id: 136, english: 'I\'m having an allergic reaction', thai: 'ฉันมีอาการแพ้', phonetic: 'chan mee aa-gaan pae', category: 'emergency' },
  { id: 137, english: 'Please help me', thai: 'ช่วยฉันด้วย', phonetic: 'chuay chan duay', category: 'emergency' },
  { id: 138, english: 'It\'s an emergency', thai: 'มันฉุกเฉิน', phonetic: 'man chuk-chern', category: 'emergency' },
  { id: 139, english: 'I need to call my embassy', thai: 'ต้องโทรหาสถานทูต', phonetic: 'dtong toh haa sa-taan-toot', category: 'emergency' },
  { id: 140, english: 'Danger', thai: 'อันตราย', phonetic: 'an-dta-rai', category: 'emergency' },

  // ========== MEDICAL (15) ==========
  { id: 141, english: 'I\'m sick', thai: 'ไม่สบาย', phonetic: 'mai sa-bai', context: 'Literally "not comfortable" — the general way to say you\'re unwell', category: 'medical' },
  { id: 142, english: 'Headache', thai: 'ปวดหัว', phonetic: 'bpuat hua', category: 'medical' },
  { id: 143, english: 'Stomachache', thai: 'ปวดท้อง', phonetic: 'bpuat tong', category: 'medical' },
  { id: 144, english: 'Fever', thai: 'มีไข้', phonetic: 'mee kai', category: 'medical' },
  { id: 145, english: 'Diarrhea', thai: 'ท้องเสีย', phonetic: 'tong sia', context: 'Very common for travelers — pharmacies carry Imodium', category: 'medical' },
  { id: 146, english: 'I have a cold', thai: 'เป็นหวัด', phonetic: 'bpen wat', category: 'medical' },
  { id: 147, english: 'Pharmacy', thai: 'ร้านขายยา', phonetic: 'raan kai yaa', context: 'Pharmacists in Thailand can prescribe many drugs directly', category: 'medical' },
  { id: 148, english: 'Medicine', thai: 'ยา', phonetic: 'yaa', category: 'medical' },
  { id: 149, english: 'Dentist', thai: 'หมอฟัน', phonetic: 'mor fan', category: 'medical' },
  { id: 150, english: 'I have allergies', thai: 'ฉันมีอาการแพ้', phonetic: 'chan mee aa-gaan pae', category: 'medical' },
  { id: 151, english: 'It hurts here', thai: 'เจ็บตรงนี้', phonetic: 'jep dtrong nee', context: 'Point to the area while saying this', category: 'medical' },
  { id: 152, english: 'I need medicine for...', thai: 'ต้องการยาสำหรับ...', phonetic: 'dtong-gaan yaa sam-rap...', category: 'medical' },
  { id: 153, english: 'Mosquito bite', thai: 'ยุงกัด', phonetic: 'yung gat', category: 'medical' },
  { id: 154, english: 'Sunburn', thai: 'ผิวไหม้แดด', phonetic: 'piu mai daet', category: 'medical' },
  { id: 155, english: 'I\'m diabetic', thai: 'เป็นเบาหวาน', phonetic: 'bpen bao-waan', category: 'medical' },

  // ========== ACCOMMODATION (15) ==========
  { id: 156, english: 'Do you have a room available?', thai: 'มีห้องว่างไหม', phonetic: 'mee hong waang mai', category: 'accommodation' },
  { id: 157, english: 'How much per night?', thai: 'คืนละเท่าไหร่', phonetic: 'keun la tao-rai', category: 'accommodation' },
  { id: 158, english: 'I have a reservation', thai: 'จองไว้แล้ว', phonetic: 'jong wai laew', category: 'accommodation' },
  { id: 159, english: 'Check in', thai: 'เช็คอิน', phonetic: 'check in', category: 'accommodation' },
  { id: 160, english: 'Check out', thai: 'เช็คเอาท์', phonetic: 'check out', category: 'accommodation' },
  { id: 161, english: 'Room key', thai: 'กุญแจห้อง', phonetic: 'gun-jae hong', category: 'accommodation' },
  { id: 162, english: 'What\'s the WiFi password?', thai: 'รหัส WiFi คืออะไร', phonetic: 'ra-hat wifi keu a-rai', category: 'accommodation' },
  { id: 163, english: 'Air conditioning', thai: 'แอร์', phonetic: 'ae', category: 'accommodation' },
  { id: 164, english: 'Hot water', thai: 'น้ำร้อน', phonetic: 'nam ron', context: 'Budget guesthouses may not have hot water — ask before booking', category: 'accommodation' },
  { id: 165, english: 'Towel', thai: 'ผ้าเช็ดตัว', phonetic: 'paa chet dtua', category: 'accommodation' },
  { id: 166, english: 'Is breakfast included?', thai: 'รวมอาหารเช้าไหม', phonetic: 'ruam aa-haan chao mai', category: 'accommodation' },
  { id: 167, english: 'Can I see the room first?', thai: 'ขอดูห้องก่อนได้ไหม', phonetic: 'kor doo hong gon dai mai', context: 'Always ask before paying at budget guesthouses', category: 'accommodation' },
  { id: 168, english: 'The room is dirty', thai: 'ห้องสกปรก', phonetic: 'hong sok-ga-bprok', category: 'accommodation' },
  { id: 169, english: 'The air con is broken', thai: 'แอร์เสีย', phonetic: 'ae sia', category: 'accommodation' },
  { id: 170, english: 'Late check out', thai: 'เช็คเอาท์ช้า', phonetic: 'check out chaa', category: 'accommodation' },

  // ========== CONVERSATION (15) ==========
  { id: 171, english: 'I don\'t understand', thai: 'ไม่เข้าใจ', phonetic: 'mai kao jai', category: 'conversation' },
  { id: 172, english: 'Please speak slowly', thai: 'พูดช้าๆ ได้ไหม', phonetic: 'poot chaa chaa dai mai', category: 'conversation' },
  { id: 173, english: 'Can you say that again?', thai: 'พูดอีกครั้งได้ไหม', phonetic: 'poot eek krang dai mai', category: 'conversation' },
  { id: 174, english: 'I can speak a little Thai', thai: 'พูดไทยได้นิดหน่อย', phonetic: 'poot tai dai nit noi', context: 'Thais will be delighted to hear this', category: 'conversation' },
  { id: 175, english: 'I\'m learning Thai', thai: 'กำลังเรียนภาษาไทย', phonetic: 'gam-lang rian paa-saa tai', category: 'conversation' },
  { id: 176, english: 'Do you speak English?', thai: 'พูดภาษาอังกฤษได้ไหม', phonetic: 'poot paa-saa ang-grit dai mai', category: 'conversation' },
  { id: 177, english: 'Where are you from?', thai: 'มาจากที่ไหน', phonetic: 'maa jaak tee nai', category: 'conversation' },
  { id: 178, english: 'I\'m from...', thai: 'มาจาก...', phonetic: 'maa jaak...', category: 'conversation' },
  { id: 179, english: 'What is this?', thai: 'นี่คืออะไร', phonetic: 'nee keu a-rai', category: 'conversation' },
  { id: 180, english: 'Beautiful', thai: 'สวย', phonetic: 'suay', category: 'conversation' },
  { id: 181, english: 'Fun / Enjoyable', thai: 'สนุก', phonetic: 'sa-nuk', context: '"Sa-nuk" is a core Thai cultural value — enjoying life', category: 'conversation' },
  { id: 182, english: 'I like Thailand', thai: 'ชอบเมืองไทย', phonetic: 'chop meuang tai', category: 'conversation' },
  { id: 183, english: 'Take a photo', thai: 'ถ่ายรูป', phonetic: 'tai roop', category: 'conversation' },
  { id: 184, english: 'Can you take my photo?', thai: 'ช่วยถ่ายรูปให้ได้ไหม', phonetic: 'chuay tai roop hai dai mai', category: 'conversation' },
  { id: 185, english: 'Cheers! (drinking)', thai: 'ชนแก้ว', phonetic: 'chon gaew', context: 'Literally "clink glasses"', category: 'conversation' },

  // ========== BARGAINING (10) ==========
  { id: 186, english: 'What\'s the best price?', thai: 'ราคาดีสุดเท่าไหร่', phonetic: 'raa-kaa dee sut tao-rai', category: 'bargaining' },
  { id: 187, english: 'Too expensive!', thai: 'แพงเกินไป', phonetic: 'paeng gern bpai', category: 'bargaining' },
  { id: 188, english: 'Can you do 200 baht?', thai: 'สองร้อยได้ไหม', phonetic: 'song roi dai mai', context: 'Replace the number as needed', category: 'bargaining' },
  { id: 189, english: 'I\'ll walk away', thai: 'ไม่เอาแล้ว', phonetic: 'mai ao laew', context: 'Often brings the price down — start walking', category: 'bargaining' },
  { id: 190, english: 'Last price?', thai: 'ราคาสุดท้าย', phonetic: 'raa-kaa sut tai', category: 'bargaining' },
  { id: 191, english: 'If I buy two, cheaper?', thai: 'ซื้อสองอัน ลดได้ไหม', phonetic: 'seu song an lot dai mai', category: 'bargaining' },
  { id: 192, english: 'Deal!', thai: 'ตกลง', phonetic: 'dtok-long', category: 'bargaining' },
  { id: 193, english: 'That\'s a fair price', thai: 'ราคาเหมาะสม', phonetic: 'raa-kaa mor-som', category: 'bargaining' },
  { id: 194, english: 'I\'m not a tourist', thai: 'ไม่ใช่นักท่องเที่ยว', phonetic: 'mai chai nak tong-tiao', context: 'Humorous — may or may not help with the price', category: 'bargaining' },
  { id: 195, english: 'The other shop is cheaper', thai: 'ร้านอื่นถูกกว่า', phonetic: 'raan eun took gwaa', category: 'bargaining' },

  // ========== TIME & DAYS (10) ==========
  { id: 196, english: 'Today', thai: 'วันนี้', phonetic: 'wan nee', category: 'time' },
  { id: 197, english: 'Tomorrow', thai: 'พรุ่งนี้', phonetic: 'prung nee', category: 'time' },
  { id: 198, english: 'Yesterday', thai: 'เมื่อวาน', phonetic: 'meua waan', category: 'time' },
  { id: 199, english: 'Morning', thai: 'เช้า', phonetic: 'chao', category: 'time' },
  { id: 200, english: 'Afternoon', thai: 'บ่าย', phonetic: 'baai', category: 'time' },
  { id: 201, english: 'Evening', thai: 'เย็น', phonetic: 'yen', category: 'time' },
  { id: 202, english: 'Night', thai: 'กลางคืน', phonetic: 'glaang keun', category: 'time' },
  { id: 203, english: 'What time is it?', thai: 'กี่โมงแล้ว', phonetic: 'gee mohng laew', category: 'time' },
  { id: 204, english: 'Monday', thai: 'วันจันทร์', phonetic: 'wan jan', category: 'time' },
  { id: 205, english: 'Now', thai: 'ตอนนี้', phonetic: 'dton nee', category: 'time' },

  // ========== WEATHER (5) ==========
  { id: 206, english: 'It\'s hot', thai: 'ร้อน', phonetic: 'ron', context: 'You\'ll say this a lot in Thailand', category: 'weather' },
  { id: 207, english: 'It\'s cold', thai: 'หนาว', phonetic: 'naao', context: 'Thais say this at 25°C — you probably won\'t need it', category: 'weather' },
  { id: 208, english: 'It\'s raining', thai: 'ฝนตก', phonetic: 'fon dtok', category: 'weather' },
  { id: 209, english: 'Very humid', thai: 'ชื้นมาก', phonetic: 'cheun maak', category: 'weather' },
  { id: 210, english: 'Good weather today', thai: 'วันนี้อากาศดี', phonetic: 'wan nee aa-gaat dee', category: 'weather' },
]
