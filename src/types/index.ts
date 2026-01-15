// User profile types
export interface UserProfile {
  id?: string
  authUserId?: string
  email?: string
  name?: string
  prefs: UserPreferences
  isPro: boolean
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

// Attraction types
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

// Affiliate types
export interface AffiliateLink {
  partner: AffiliatePartner
  url: string
  label: string
}

export type AffiliatePartner = 'agoda' | 'klook' | 'safetywing' | 'wise' | 'getyourguide' | '12go'

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
