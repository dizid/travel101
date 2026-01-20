import type {
  UserProfile,
  UserPreferences,
  Attraction,
  AttractionDetail,
  AttractionTip,
  AttractionSecret,
  AttractionRecommendation,
  VisaType,
  Warning,
  UserActivity,
} from '@/types'

// ============================================
// User Preferences Fixtures
// ============================================

export const defaultPreferences: UserPreferences = {
  travelStyle: [],
  ageGroup: 'middle',
  groupType: 'solo',
  budget: 'mid',
  interests: [],
  nationality: '',
  tripType: 'holiday',
}

export const backpackerPrefs: UserPreferences = {
  travelStyle: ['adventure', 'culture'],
  ageGroup: 'young',
  groupType: 'solo',
  budget: 'budget',
  interests: ['temples', 'food', 'nature'],
  nationality: 'US',
  tripType: 'holiday',
}

export const luxuryCouplePrefs: UserPreferences = {
  travelStyle: ['relaxation'],
  ageGroup: 'middle',
  groupType: 'couple',
  budget: 'luxury',
  interests: ['beach', 'wellness', 'food'],
  nationality: 'UK',
  tripType: 'holiday',
}

export const digitalNomadPrefs: UserPreferences = {
  travelStyle: ['culture'],
  ageGroup: 'young',
  groupType: 'solo',
  budget: 'mid',
  interests: ['food', 'nature'],
  nationality: 'DE',
  tripType: 'digital_nomad',
}

export const familyPrefs: UserPreferences = {
  travelStyle: ['relaxation', 'adventure'],
  ageGroup: 'middle',
  groupType: 'family',
  budget: 'mid',
  interests: ['beach', 'nature'],
  nationality: 'AU',
  tripType: 'holiday',
}

export const seniorExpatPrefs: UserPreferences = {
  travelStyle: ['relaxation'],
  ageGroup: 'senior',
  groupType: 'couple',
  budget: 'mid',
  interests: ['temples', 'wellness'],
  nationality: 'US',
  tripType: 'expat',
}

// ============================================
// User Profile Fixtures
// ============================================

export const mockUserProfile: UserProfile = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  prefs: backpackerPrefs,
  isPro: false,
  savedPlaces: ['phuket', 'chiang-mai'],
}

export const mockProUserProfile: UserProfile = {
  id: 'user-pro-456',
  email: 'pro@example.com',
  name: 'Pro User',
  prefs: luxuryCouplePrefs,
  isPro: true,
  savedPlaces: ['koh-samui', 'krabi'],
}

export const mockEmptyProfile: UserProfile = {
  prefs: defaultPreferences,
  isPro: false,
}

// ============================================
// Attraction Fixtures
// ============================================

export const mockBeachAttraction: Attraction = {
  id: 'attr-1',
  slug: 'phuket',
  name: 'Phuket',
  description: 'Beautiful island with stunning beaches',
  about: 'Thailand\'s largest island offers pristine beaches and vibrant nightlife.',
  category: 'beach',
  location: 'Andaman Sea',
  province: 'Phuket',
  categories: {
    beach: 0.95,
    nightlife: 0.85,
    luxury: 0.75,
    party: 0.8,
    relaxation: 0.7,
    romantic: 0.6,
  },
  isHiddenGem: false,
  isProOnly: false,
}

export const mockTempleAttraction: Attraction = {
  id: 'attr-2',
  slug: 'wat-phra-kaew',
  name: 'Wat Phra Kaew',
  description: 'Temple of the Emerald Buddha',
  about: 'The most sacred Buddhist temple in Thailand.',
  category: 'culture',
  location: 'Grand Palace',
  province: 'Bangkok',
  categories: {
    culture: 0.98,
    history: 0.95,
    photography: 0.85,
    authentic: 0.9,
  },
  isHiddenGem: false,
  isProOnly: false,
}

export const mockHiddenGemAttraction: Attraction = {
  id: 'attr-3',
  slug: 'secret-waterfall',
  name: 'Secret Waterfall',
  description: 'A hidden gem in northern Thailand',
  about: 'Pristine waterfall known only to locals.',
  category: 'nature',
  location: 'Hidden Valley',
  province: 'Chiang Mai',
  categories: {
    nature: 0.95,
    adventure: 0.85,
    authentic: 0.9,
    relaxation: 0.6,
  },
  isHiddenGem: true,
  isProOnly: true,
}

export const mockNomadAttraction: Attraction = {
  id: 'attr-4',
  slug: 'chiang-mai',
  name: 'Chiang Mai',
  description: 'Digital nomad paradise in northern Thailand',
  about: 'The cultural capital of northern Thailand, popular with remote workers.',
  category: 'nomad',
  location: 'Northern Thailand',
  province: 'Chiang Mai',
  categories: {
    nomad: 0.95,
    culture: 0.85,
    food: 0.9,
    budget: 0.8,
    authentic: 0.85,
    nature: 0.7,
  },
  isHiddenGem: false,
  isProOnly: false,
}

export const mockLuxuryAttraction: Attraction = {
  id: 'attr-5',
  slug: 'koh-samui',
  name: 'Koh Samui',
  description: 'Luxury island getaway',
  about: 'Upscale island destination with world-class resorts.',
  category: 'island',
  location: 'Gulf of Thailand',
  province: 'Surat Thani',
  categories: {
    beach: 0.9,
    luxury: 0.95,
    wellness: 0.85,
    romantic: 0.9,
    relaxation: 0.85,
    budget: 0.1,
  },
  isHiddenGem: false,
  isProOnly: false,
}

export const mockFamilyAttraction: Attraction = {
  id: 'attr-6',
  slug: 'hua-hin',
  name: 'Hua Hin',
  description: 'Family-friendly beach resort town',
  about: 'Royal resort town with calm beaches perfect for families.',
  category: 'beach',
  location: 'Gulf of Thailand',
  province: 'Prachuap Khiri Khan',
  categories: {
    beach: 0.85,
    family: 0.9,
    relaxation: 0.8,
    budget: 0.6,
    authentic: 0.7,
  },
  isHiddenGem: false,
  isProOnly: false,
}

// Collection of all attractions for testing
export const mockAttractions: Attraction[] = [
  mockBeachAttraction,
  mockTempleAttraction,
  mockHiddenGemAttraction,
  mockNomadAttraction,
  mockLuxuryAttraction,
  mockFamilyAttraction,
]

// ============================================
// Attraction Detail Fixtures
// ============================================

export const mockAttractionTips: AttractionTip[] = [
  {
    id: 'tip-1',
    tipType: 'timing',
    title: 'Best Time to Visit',
    content: 'November to February offers the best weather.',
    isProOnly: false,
    sortOrder: 0,
  },
  {
    id: 'tip-2',
    tipType: 'transport',
    title: 'Getting There',
    content: 'Take a taxi from the airport, about 30 minutes.',
    isProOnly: false,
    sortOrder: 1,
  },
  {
    id: 'tip-3',
    tipType: 'money_saving',
    title: 'Budget Tip',
    content: 'Visit on weekdays to avoid crowds and higher prices.',
    isProOnly: true,
    sortOrder: 2,
  },
]

export const mockAttractionSecrets: AttractionSecret[] = [
  {
    id: 'secret-1',
    secretType: 'hidden_spot',
    title: 'Secret Beach',
    content: 'Hidden cove on the west side, accessible at low tide.',
    locationHint: 'Near the lighthouse',
    isProOnly: true,
    sortOrder: 0,
  },
  {
    id: 'secret-2',
    secretType: 'local_food',
    title: 'Local Favorite',
    content: 'Authentic noodle shop behind the temple.',
    isProOnly: true,
    sortOrder: 1,
  },
]

export const mockAttractionRecommendations: AttractionRecommendation[] = [
  {
    id: 'rec-1',
    recType: 'restaurant',
    name: 'Local Thai Kitchen',
    description: 'Authentic Thai cuisine loved by locals.',
    whySpecial: 'Family recipes passed down for generations.',
    priceRange: '$$',
    googleMapsUrl: 'https://maps.google.com/example',
    isProOnly: false,
    sortOrder: 0,
  },
  {
    id: 'rec-2',
    recType: 'hotel',
    name: 'Boutique Beach Resort',
    description: 'Charming beachfront property.',
    whySpecial: 'Private beach access.',
    priceRange: '$$$',
    googleMapsUrl: 'https://maps.google.com/example2',
    isProOnly: false,
    sortOrder: 1,
  },
]

export const mockAttractionDetail: AttractionDetail = {
  ...mockBeachAttraction,
  tips: mockAttractionTips,
  secrets: mockAttractionSecrets,
  recommendations: mockAttractionRecommendations,
}

// ============================================
// Visa Type Fixtures
// ============================================

export const mockVisaExemption: VisaType = {
  id: 'visa-ve',
  code: 'VE',
  name: 'Visa Exemption',
  duration: 30,
  description: 'Visa-free entry for eligible nationalities.',
  requirements: ['Valid passport', 'Return ticket', 'Proof of accommodation'],
  extendable: true,
  extensionDays: 30,
  extensionFee: 1900,
  forProfiles: [{ tripType: 'holiday' }],
  entryType: 'single',
}

export const mockVisaOnArrival: VisaType = {
  id: 'visa-voa',
  code: 'VOA',
  name: 'Visa on Arrival',
  duration: 15,
  description: 'Available for select nationalities at entry points.',
  requirements: ['Valid passport', 'Passport photo', '2,000 THB fee', 'Return ticket'],
  extendable: true,
  extensionDays: 15,
  extensionFee: 1900,
  forProfiles: [{ tripType: 'holiday' }],
  entryType: 'single',
}

export const mockDigitalNomadVisa: VisaType = {
  id: 'visa-dtv',
  code: 'DTV',
  name: 'Destination Thailand Visa',
  duration: 180,
  validityPeriod: 1825,
  description: 'Long-stay visa for digital nomads and remote workers.',
  requirements: ['Proof of remote work', 'Income verification', 'Health insurance'],
  extendable: true,
  extensionDays: 180,
  extensionFee: 1900,
  forProfiles: [{ tripType: 'digital_nomad' }],
  reportingInterval: 90,
  entryType: 'multiple',
}

export const mockRetirementVisa: VisaType = {
  id: 'visa-non-o',
  code: 'Non-O',
  name: 'Non-Immigrant O (Retirement)',
  duration: 90,
  description: 'Long-stay visa for retirees aged 50+.',
  requirements: ['Age 50+', '800,000 THB in Thai bank', 'Health insurance'],
  extendable: true,
  extensionDays: 365,
  forProfiles: [{ tripType: 'expat', ageGroup: 'senior' }],
  reportingInterval: 90,
  entryType: 'single',
}

export const mockVisaTypes: VisaType[] = [
  mockVisaExemption,
  mockVisaOnArrival,
  mockDigitalNomadVisa,
  mockRetirementVisa,
]

// ============================================
// Warning Fixtures
// ============================================

export const mockWarnings: Warning[] = [
  {
    id: 'warn-1',
    countryId: 'thailand',
    category: 'royal_family',
    title: 'Lèse-majesté Laws',
    content: 'Speaking negatively about the royal family is a serious criminal offense.',
    severity: 4,
    tags: ['legal', 'culture'],
  },
  {
    id: 'warn-2',
    countryId: 'thailand',
    category: 'drug_laws',
    title: 'Drug Penalties',
    content: 'Drug possession carries severe penalties including death sentence.',
    severity: 4,
    tags: ['legal'],
  },
  {
    id: 'warn-3',
    countryId: 'thailand',
    category: 'scams',
    title: 'Taxi Scams',
    content: 'Always use the meter or agree on price before getting in.',
    severity: 2,
    tags: ['transport'],
  },
]

// ============================================
// Activity Fixtures
// ============================================

export const mockActivities: UserActivity[] = [
  {
    id: 'activity-1',
    userId: 'user-123',
    action: 'visa_wizard_start',
    metadata: { step: 1 },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'activity-2',
    userId: 'user-123',
    action: 'ai_query',
    metadata: { query: 'Best beaches in Thailand' },
    createdAt: new Date('2024-01-16'),
  },
]

// ============================================
// API Response Fixtures
// ============================================

export const mockAttractionListResponse = {
  attractions: mockAttractions,
  total: mockAttractions.length,
  hasMore: false,
}

export const mockAttractionDetailResponse = {
  attraction: mockAttractionDetail,
  matchInfo: {
    score: 85,
    reasons: ['Great for beach lovers', 'Perfect for relaxing'],
  },
}

export const mockSubscriptionStatus = {
  isPro: true,
  subscription: {
    status: 'active',
    currentPeriodEnd: new Date('2024-12-31').toISOString(),
    cancelAtPeriodEnd: false,
  },
}

export const mockWeatherData = {
  location: 'Bangkok',
  current: {
    temp_c: 32,
    condition: 'Sunny',
    icon: 'sunny.png',
    humidity: 65,
    wind_kph: 12,
    uv: 8,
  },
  forecast: [
    {
      date: '2024-02-01',
      maxtemp_c: 34,
      mintemp_c: 26,
      condition: 'Sunny',
      icon: 'sunny.png',
      chance_of_rain: 10,
    },
    {
      date: '2024-02-02',
      maxtemp_c: 33,
      mintemp_c: 25,
      condition: 'Partly cloudy',
      icon: 'cloudy.png',
      chance_of_rain: 20,
    },
  ],
  isMonsoon: false,
  packingTips: ['Sunscreen', 'Light clothes', 'Sunglasses'],
}

export const mockCurrencyRates = {
  base: 'USD',
  rates: {
    THB: 35.5,
    EUR: 0.92,
    GBP: 0.79,
    AUD: 1.52,
    JPY: 149.5,
  },
  timestamp: Date.now(),
}

export const mockFlightSearchResponse = {
  flights: [
    {
      id: 'flight-1',
      price: 150,
      currency: 'USD',
      airlines: ['Thai Airways'],
      departureTime: '2024-02-15T08:00:00Z',
      arrivalTime: '2024-02-15T10:30:00Z',
      duration: 150,
      stops: 0,
      origin: { code: 'BKK', city: 'Bangkok', airport: 'Suvarnabhumi' },
      destination: { code: 'HKT', city: 'Phuket', airport: 'Phuket International' },
      bookingUrl: 'https://example.com/book',
    },
    {
      id: 'flight-2',
      price: 120,
      currency: 'USD',
      airlines: ['AirAsia'],
      departureTime: '2024-02-15T14:00:00Z',
      arrivalTime: '2024-02-15T16:00:00Z',
      duration: 120,
      stops: 0,
      origin: { code: 'BKK', city: 'Bangkok', airport: 'Don Mueang' },
      destination: { code: 'HKT', city: 'Phuket', airport: 'Phuket International' },
      bookingUrl: 'https://example.com/book2',
    },
  ],
  searchId: 'search-123',
  currency: 'USD',
}

// ============================================
// Factory Functions
// ============================================

export function createUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    ...mockUserProfile,
    id: `user-${Date.now()}`,
    ...overrides,
  }
}

export function createAttraction(overrides: Partial<Attraction> = {}): Attraction {
  return {
    ...mockBeachAttraction,
    id: `attr-${Date.now()}`,
    slug: `test-attraction-${Date.now()}`,
    ...overrides,
  }
}

export function createPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    ...defaultPreferences,
    ...overrides,
  }
}
