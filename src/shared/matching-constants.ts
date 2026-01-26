// Shared matching algorithm constants - single source of truth
// Used by both frontend (useMatcher.ts) and backend (matching.mts)

// Weight multipliers for different profile aspects
export const WEIGHTS = {
  interests: 3.0,
  travelStyle: 2.5,
  courseInterests: 2.2,
  budget: 2.0,
  groupType: 1.5,
  tripType: 1.5,
  placeType: 1.0,
} as const

// Scoring configuration thresholds
export const SCORING_CONFIG = {
  MIN_FACTOR_THRESHOLD: 0.3,
  BUDGET_CONFLICT_THRESHOLD: 0.7,
  BUDGET_LUXURY_PENALTY: 0.3,
  LUXURY_BUDGET_PENALTY: 0.2,
  COWORKING_NOMAD_MULTIPLIER: 2,
  COWORKING_DEFAULT_NOMAD_SCORE: 0.8,
  COURSE_INTEREST_BONUS: 0.5,
  STRONG_MATCH_THRESHOLD: 0.7,
  DEFAULT_SCORE: 50,
} as const

// Trip type to category boosts
export const TRIP_TYPE_CATEGORIES: Record<string, string[]> = {
  holiday: ['relaxation', 'beach', 'party', 'nightlife', 'romantic', 'island'],
  expat: ['culture', 'authentic', 'food', 'nomad', 'history'],
  digital_nomad: ['nomad'],
}

// Course interest to category mapping
export const COURSE_CATEGORY_MAP: Record<string, string[]> = {
  cooking: ['food', 'culture', 'skill_building'],
  meditation: ['wellness', 'relaxation', 'authentic'],
  diving: ['adventure', 'nature', 'certification'],
  massage: ['wellness', 'skill_building'],
  muay_thai: ['adventure', 'physical', 'authentic'],
  yoga: ['wellness', 'relaxation'],
}

// Group type to category mapping
export const GROUP_CATEGORY_MAP: Record<string, string> = {
  couple: 'romantic',
  family: 'family',
}

// Interest to category mapping (for user preferences → attraction categories)
const INTEREST_TO_CATEGORY: Record<string, string> = {
  temples: 'culture',
  shopping: 'budget',
}

// Category to interest mapping (reverse lookup)
const CATEGORY_TO_INTEREST: Record<string, string> = {
  culture: 'temples',
}

// Map user interests to attraction category keys
export function mapInterestToCategory(interest: string): string {
  return INTEREST_TO_CATEGORY[interest] || interest
}

// Map attraction categories back to user-friendly interests
export function mapCategoryToInterest(category: string): string {
  return CATEGORY_TO_INTEREST[category] || category
}

// Safe category score getter
export function getCategoryScore(categories: Record<string, number>, key: string): number {
  return categories[key] ?? 0
}

// UI Labels for categories
export const LABEL_MAP: Record<string, string> = {
  beach: 'Beach lover',
  nightlife: 'Nightlife',
  culture: 'Culture & temples',
  food: 'Food scene',
  nature: 'Nature',
  wellness: 'Wellness',
  adventure: 'Adventure',
  party: 'Party scene',
  relaxation: 'Relaxation',
  romantic: 'Romantic vibes',
  family: 'Family-friendly',
  budget: 'Budget-friendly',
  luxury: 'Luxury',
  nomad: 'Digital nomad',
  authentic: 'Authentic',
}

// Trip type labels
export const TRIP_TYPE_LABELS: Record<string, string> = {
  holiday: 'Holiday-perfect',
  expat: 'Expat-friendly',
  digital_nomad: 'Digital nomad friendly',
}

// Course labels
export const COURSE_LABELS: Record<string, string> = {
  cooking: 'Cooking classes',
  meditation: 'Meditation retreats',
  diving: 'Diving spots',
  massage: 'Massage courses',
  muay_thai: 'Muay Thai training',
  yoga: 'Yoga retreats',
}

// Match reason explanations
export const REASON_MAP: Record<string, string> = {
  beach: 'Great for beach lovers',
  nightlife: 'Perfect for nightlife',
  culture: 'Rich in culture',
  food: 'Amazing food scene',
  nature: 'Beautiful nature',
  wellness: 'Ideal for wellness',
  adventure: 'Adventure awaits',
  party: 'Great party scene',
  relaxation: 'Perfect for relaxing',
  romantic: 'Romantic destination',
  family: 'Family-friendly',
  budget: 'Budget-friendly',
  luxury: 'Premium experience',
  nomad: 'Nomad-friendly',
  authentic: 'Authentic experience',
}

// Extended reason map for backend (slightly different wording)
export const EXTENDED_REASON_MAP: Record<string, string> = {
  beach: 'Perfect for beach lovers',
  nightlife: 'Great nightlife scene',
  culture: 'Rich cultural experiences',
  food: 'Amazing food scene',
  nature: 'Beautiful natural setting',
  wellness: 'Ideal for wellness seekers',
  adventure: 'Exciting adventures await',
  party: 'Vibrant party atmosphere',
  relaxation: 'Perfect for unwinding',
  romantic: 'Romantic getaway spot',
  family: 'Family-friendly destination',
  budget: 'Easy on the wallet',
  luxury: 'Premium experience',
  nomad: 'Great for remote work',
  authentic: 'Authentic local experience',
}

// Type definitions
export interface UserPrefs {
  interests?: string[]
  travelStyle?: string[]
  budget?: string
  groupType?: string
  tripType?: string
  ageGroup?: string
  courseInterests?: string[]
  dietaryRestrictions?: string[]
}

export interface AttractionCategories {
  [key: string]: number
}

export interface MatchFactor {
  category: string
  label: string
  contribution: number
  strength: number
}

export interface MatchBreakdown {
  factors: MatchFactor[]
  totalScore: number
}

export interface ScoringResult {
  totalScore: number
  totalWeight: number
  factors: MatchFactor[]
}
