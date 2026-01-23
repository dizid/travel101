// User profile types
export interface UserProfile {
  id?: string
  authUserId?: string
  email?: string
  name?: string
  prefs: UserPreferences
  isPro: boolean
  savedPlaces?: string[]  // Array of attraction slugs
  createdAt?: Date
}

export interface UserPreferences {
  travelStyle: TravelStyle[]
  ageGroup: AgeGroup
  groupType: GroupType
  budget: BudgetLevel
  interests: Interest[]
  nationality: string
  tripType: TripType
}

export type TravelStyle = 'party' | 'adventure' | 'relaxation' | 'culture'
export type AgeGroup = 'young' | 'middle' | 'senior'
export type GroupType = 'solo' | 'couple' | 'family' | 'friends'
export type BudgetLevel = 'budget' | 'mid' | 'luxury'
export type Interest = 'beach' | 'nightlife' | 'temples' | 'food' | 'shopping' | 'nature' | 'wellness'
export type TripType = 'holiday' | 'expat' | 'digital_nomad'

// Place types for expanded taxonomy
export type PlaceType = 'attraction' | 'course' | 'tour' | 'activity' | 'coworking' | 'restaurant' | 'event' | 'heritage'

// Verification status for AI enrichment pipeline
export type VerificationStatus = 'pending' | 'ai_scored' | 'human_verified' | 'needs_review' | 'rejected'

// Data source for place ingestion
export type DataSource = 'manual' | 'google_places' | 'viator' | 'getyourguide' | 'coworker' | 'ai_generated'

// Country and content types
export interface Country {
  id: string
  code: string
  name: string
  theme: CountryTheme
}

export interface CountryTheme {
  primaryColor: string
  accentColor: string
  backgroundGradient: string
  pattern?: string
}

// Info types (visa, warnings, attractions)
export interface Info {
  id: string
  countryId: string
  type: InfoType
  title: string
  content: string
  severity?: SeverityLevel
  categories: Record<string, number>
  updatedAt: Date
}

export type InfoType = 'visa' | 'warning' | 'tdac' | 'attraction'
export type SeverityLevel = 1 | 2 | 3 | 4 // 1=tip, 2=note, 3=warning, 4=critical

// Visa types
export interface VisaType {
  id: string
  code: string
  name: string
  duration: number              // Days per entry
  validityPeriod?: number       // Total visa validity in days (e.g., DTV = 5 years)
  description: string
  requirements: string[]
  extendable: boolean
  extensionDays?: number        // How many days extension gives
  extensionFee?: number         // Fee in THB
  forProfiles: Partial<UserPreferences>[]
  reportingInterval?: number    // 90-day reporting if applicable
  renewalInfo?: string          // Annual renewal info
  entryType?: 'single' | 'multiple'
  notes?: string[]              // Important caveats
  officialUrl?: string          // Link to official immigration/MFA source
}

// Visa recommendation result with nationality-aware warnings
export interface VisaRecommendation {
  visa: VisaType | null
  warning?: string              // Nationality-specific warning
  alternatives?: VisaType[]     // Other visa options to consider
}

export interface VisaWizardState {
  step: number
  nationality: string
  currentLocation: 'in_thailand' | 'outside'
  tripPurpose: TripType
  duration: number
  ageGroup?: AgeGroup
  recommendedVisa?: VisaType
  checklist: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  label: string
  description?: string
  checked: boolean
  required: boolean
  link?: string
}

// Warning types
export interface Warning {
  id: string
  countryId: string
  category: WarningCategory
  title: string
  content: string
  severity: SeverityLevel
  tags: string[]
}

export type WarningCategory =
  | 'royal_family'
  | 'drug_laws'
  | 'scams'
  | 'traffic'
  | 'beach_safety'
  | 'nightlife'

// Attraction/Place types
export interface Attraction {
  id: string
  slug: string
  countryId?: string
  name: string
  description: string
  about?: string
  category: AttractionCategory
  location: string
  province: string
  coordinates?: { lat: number; lng: number }
  categories: Record<string, number>
  isHiddenGem: boolean
  isProOnly?: boolean
  imageUrl?: string
  affiliateLinks?: AffiliateLink[]
  // New fields for expanded place types
  placeType?: PlaceType
  metadata?: PlaceMetadata
  externalIds?: ExternalIds
  dataSource?: DataSource
  verificationStatus?: VerificationStatus
  aiEnrichedAt?: Date
}

// Type-specific metadata for different place types
export interface PlaceMetadata {
  // Course/Tour metadata
  durationHours?: number
  priceTHB?: number
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  groupSizeMax?: number
  bookingUrl?: string
  // Restaurant metadata
  cuisine?: string[]
  priceRange?: '$' | '$$' | '$$$' | '$$$$'
  dietaryOptions?: string[]
  // Co-working metadata
  wifiSpeedMbps?: number
  hasMeetingRooms?: boolean
  is24Hours?: boolean
  monthlyPriceTHB?: number
  // Event metadata
  dateStart?: string
  dateEnd?: string
  isRecurring?: boolean
  // AI enrichment metadata
  aiConfidence?: number
}

// External IDs for deduplication
export interface ExternalIds {
  googlePlaceId?: string
  viatorId?: string
  gygId?: string
  coworkerId?: string
}

export interface AttractionDetail extends Attraction {
  tips: AttractionTip[]
  secrets: AttractionSecret[]
  recommendations: AttractionRecommendation[]
}

export type TipType = 'timing' | 'transport' | 'money_saving' | 'crowd_avoidance' | 'photography' | 'preparation'

export interface AttractionTip {
  id: string
  tipType: TipType
  title: string
  content: string
  isProOnly: boolean
  sortOrder: number
}

export type SecretType = 'hidden_spot' | 'local_food' | 'local_experience' | 'insider_knowledge'

export interface AttractionSecret {
  id: string
  secretType: SecretType
  title: string
  content: string
  locationHint?: string
  isProOnly: boolean
  sortOrder: number
}

export type RecommendationType = 'restaurant' | 'cafe' | 'hotel' | 'activity' | 'viewpoint' | 'shop'

export interface AttractionRecommendation {
  id: string
  recType: RecommendationType
  name: string
  description: string
  whySpecial?: string
  priceRange?: '$' | '$$' | '$$$' | '$$$$'
  googleMapsUrl?: string
  isProOnly: boolean
  sortOrder: number
}

export type AttractionCategory =
  // Core experience types
  | 'beach'
  | 'culture'
  | 'nightlife'
  | 'nature'
  | 'island'
  | 'foodie'
  | 'nomad'
  | 'wellness'
  | 'adventure'
  | 'family'
  | 'romantic'
  | 'budget'
  | 'luxury'
  // Extended categories
  | 'food'
  | 'party'
  | 'relaxation'
  | 'authentic'
  | 'temples'
  | 'history'
  | 'photography'
  | 'trekking'
  // Course/activity types
  | 'skill_building'
  | 'certification'
  | 'creative'
  | 'physical'
  // Tour types
  | 'guided'
  | 'day_trip'
  | 'small_group'
  | 'private_tour'
  // Restaurant types
  | 'fine_dining'
  | 'street_food'
  | 'vegetarian'
  | 'local_cuisine'
  // Co-working types
  | 'fast_wifi'
  | 'community'

// Affiliate types
export interface AffiliateLink {
  partner: AffiliatePartner
  url: string
  label: string
}

export type AffiliatePartner = 'klook' | 'agoda' | '12go' | 'getyourguide' | 'safetywing' | 'airalo' | 'nordvpn'

export interface AffiliateClick {
  id: string
  userId?: string
  partner: AffiliatePartner
  context: string
  destinationUrl: string
  converted: boolean
  commissionAmount?: number
  createdAt: Date
}

// AI types
export interface AIPrompt {
  id: string
  type: AIPromptType
  template: string
  model: string
  tokensEstimate: number
}

export type AIPromptType = 'visa_advisor' | 'itinerary_generator' | 'attraction_matcher'

export interface AIResponse {
  content: string
  cached: boolean
  timestamp: Date
}

export interface Itinerary {
  days: ItineraryDay[]
  tips: string[]
  warnings: string[]
}

export interface ItineraryDay {
  day: number
  location: string
  activities: string[]
  accommodationArea: string
  estimatedBudget: string
}

export interface AttractionMatch {
  attraction: Attraction
  score: number
  reasons: string[]
}

export interface AttractionListResponse {
  attractions: Attraction[]
  total: number
  hasMore: boolean
}

export interface AttractionDetailResponse {
  attraction: AttractionDetail
  matchInfo?: {
    score: number
    reasons: string[]
  }
}

// User activity types
export interface UserActivity {
  id: string
  userId: string
  action: UserActivityAction
  metadata: Record<string, unknown>
  createdAt: Date
}

export type UserActivityAction =
  | 'visa_wizard_start'
  | 'visa_wizard_complete'
  | 'checklist_progress'
  | 'ai_query'
  | 'itinerary_save'
  | 'affiliate_click'

// Subscription types
export interface Subscription {
  userId: string
  status: SubscriptionStatus
  plan: SubscriptionPlan
  currentPeriodEnd?: Date
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'none'
export type SubscriptionPlan = 'free' | 'pro'

// UI State types
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface ModalState {
  isOpen: boolean
  component?: string
  props?: Record<string, unknown>
}

// =============================================
// HERITAGE TYPES
// =============================================

// Thai historical eras
export type ThaiEra =
  | 'Prehistoric'
  | 'Dvaravati Period'
  | 'Srivijaya Period'
  | 'Khmer Period'
  | 'Sukhothai Period'
  | 'Ayutthaya Period'
  | 'Thonburi Period'
  | 'Rattanakosin Period'
  | 'Modern'

// UNESCO World Heritage status
export type UNESCOStatus = 'world_heritage_site' | 'tentative_list' | null

// Heritage site types
export type HeritageType =
  | 'temple'
  | 'palace'
  | 'ruins'
  | 'museum'
  | 'monument'
  | 'archaeological'
  | 'natural'
  | 'historical_park'

// Heritage event types for timeline
export type HeritageEventType =
  | 'construction'
  | 'destruction'
  | 'restoration'
  | 'designation'
  | 'event'
  | 'discovery'

// Heritage-specific metadata (stored in attractions.metadata JSONB)
export interface HeritageMetadata {
  constructionDate?: string
  constructionEra?: ThaiEra
  architecturalStyles?: string[]
  unescoStatus?: UNESCOStatus
  unescoInscriptionYear?: number
  unescoCriteria?: string[]
  kingdomDynasty?: string
  religiousSignificance?: string
  entryFeeTHB?: number
  entryFeeForeignerTHB?: number
  openingHours?: string
  dressCode?: string
  bestTimeToVisit?: string
  heritageType?: HeritageType
  historicalSignificance?: string
}

// Image in heritage gallery
export interface HeritageImage {
  id: string
  attractionId: string
  imageUrl: string
  thumbnailUrl?: string
  caption?: string
  altText: string
  source?: 'unsplash' | 'wikimedia' | 'tat' | 'manual'
  sourceUrl?: string
  photographer?: string
  photographerUrl?: string
  license?: 'unsplash' | 'cc-by' | 'cc-by-sa' | 'public-domain'
  isPrimary: boolean
  displayOrder: number
  width?: number
  height?: number
  blurHash?: string
  createdAt?: Date
}

// Historical event in heritage timeline
export interface HeritageEvent {
  id: string
  attractionId: string
  eventYear?: number
  eventYearEnd?: number
  eventEra?: ThaiEra
  title: string
  description: string
  eventType?: HeritageEventType
  isApproximate: boolean
  sortOrder: number
  createdAt?: Date
}

// Full heritage site detail (extends AttractionDetail)
export interface HeritageDetail extends AttractionDetail {
  images: HeritageImage[]
  timeline: HeritageEvent[]
  heritageMetadata: HeritageMetadata
}

// Heritage list item (for cards in grid view)
export interface HeritageSite extends Attraction {
  primaryImage?: HeritageImage
  heritageMetadata: HeritageMetadata
  eventCount?: number
  imageCount?: number
}

// Heritage list response
export interface HeritageListResponse {
  sites: HeritageSite[]
  total: number
  hasMore: boolean
}

// Heritage filter options
export interface HeritageFilters {
  era?: ThaiEra
  region?: string
  unescoOnly?: boolean
  heritageType?: HeritageType
  search?: string
}

// =============================================
// FESTIVAL TYPES
// =============================================

export type FestivalType = 'religious' | 'cultural' | 'royal' | 'modern' | 'harvest' | 'water'
export type FestivalReligion = 'buddhist' | 'hindu' | 'taoist' | 'animist' | 'secular'
export type FestivalRegion = 'North' | 'Isan' | 'Central' | 'South' | 'Bangkok' | 'East' | 'West'
export type CrowdLevel = 'low' | 'medium' | 'high' | 'extreme'

export interface Festival {
  id: string
  slug: string
  name: string
  nameThai?: string
  description?: string
  monthTypical?: number
  dateType: 'fixed' | 'lunar' | 'variable'
  dateFixed?: string
  durationDays: number
  date2025?: string
  date2026?: string
  provinces?: string[]
  isNationwide: boolean
  bestLocations?: string[]
  region?: FestivalRegion
  imageUrl?: string
  activities?: string[]
  tips?: string[]
  dressCode?: string
  festivalType?: FestivalType
  religion?: FestivalReligion
  isHiddenGem: boolean
  crowdLevel?: CrowdLevel
  foreignerFriendly?: number
}

export interface UpcomingFestival extends Festival {
  nextDate: string
  daysUntil: number
}

export interface FestivalListResponse {
  festivals: Festival[]
  count: number
  total?: number
  hasMore?: boolean
}

export interface UpcomingFestivalResponse {
  festivals: UpcomingFestival[]
  count: number
}

export interface FestivalFilters {
  type?: FestivalType
  region?: FestivalRegion
  hidden?: boolean
  month?: number
  search?: string
}
