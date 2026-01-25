import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useCountryStore } from '@/stores/countryStore'
import type { Attraction } from '@/types'

// Weight multipliers for different profile aspects
const WEIGHTS = {
  interests: 3.0,
  travelStyle: 2.5,
  courseInterests: 2.2,
  budget: 2.0,
  groupType: 1.5,
  tripType: 1.5,
  placeType: 1.0,
} as const

// Scoring configuration
const SCORING_CONFIG = {
  MIN_FACTOR_THRESHOLD: 0.3,
  BUDGET_CONFLICT_THRESHOLD: 0.7,
  BUDGET_LUXURY_PENALTY: 0.3,
  LUXURY_BUDGET_PENALTY: 0.2,
  COWORKING_NOMAD_MULTIPLIER: 2,
  COWORKING_DEFAULT_NOMAD_SCORE: 0.8,
  COURSE_INTEREST_BONUS: 0.5,
  STRONG_MATCH_THRESHOLD: 0.7,
} as const

// Trip type to category boosts
const TRIP_TYPE_CATEGORIES: Record<string, string[]> = {
  holiday: ['relaxation', 'beach', 'party', 'nightlife', 'romantic', 'island'],
  expat: ['culture', 'authentic', 'food', 'nomad', 'history'],
  digital_nomad: ['nomad'],
}

// Course interest to category mapping
const COURSE_CATEGORY_MAP: Record<string, string[]> = {
  cooking: ['food', 'culture', 'skill_building'],
  meditation: ['wellness', 'relaxation', 'authentic'],
  diving: ['adventure', 'nature', 'certification'],
  massage: ['wellness', 'skill_building'],
  muay_thai: ['adventure', 'physical', 'authentic'],
  yoga: ['wellness', 'relaxation'],
}

// Group type to category mapping
const GROUP_CATEGORY_MAP: Record<string, string> = {
  couple: 'romantic',
  family: 'family',
}

// Unified label map for all categories
const LABEL_MAP: Record<string, string> = {
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

const TRIP_TYPE_LABELS: Record<string, string> = {
  holiday: 'Holiday-perfect',
  expat: 'Expat-friendly',
  digital_nomad: 'Digital nomad friendly',
}

const COURSE_LABELS: Record<string, string> = {
  cooking: 'Cooking classes',
  meditation: 'Meditation retreats',
  diving: 'Diving spots',
  massage: 'Massage courses',
  muay_thai: 'Muay Thai training',
  yoga: 'Yoga retreats',
}

const REASON_MAP: Record<string, string> = {
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

// Map user interests to attraction category keys
function mapInterestToCategory(interest: string): string {
  const map: Record<string, string> = {
    temples: 'culture',
    shopping: 'budget',
  }
  return map[interest] || interest
}

// Safe category score getter
function getCategoryScore(categories: Record<string, number>, key: string): number {
  return categories[key] ?? 0
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

interface UserPrefs {
  interests?: string[]
  travelStyle?: string[]
  budget?: string
  groupType?: string
  tripType?: string
  courseInterests?: string[]
}

interface ScoringResult {
  totalScore: number
  totalWeight: number
  factors: MatchFactor[]
}

// Core scoring engine - single source of truth for all scoring logic
function calculateScore(
  prefs: UserPrefs,
  attraction: Attraction,
  collectFactors: boolean
): ScoringResult {
  const factors: MatchFactor[] = []
  let totalScore = 0
  let totalWeight = 0

  // Helper to add score and optionally collect factor
  const addScore = (
    _categoryKey: string,
    categoryScore: number,
    weight: number,
    categoryType: string,
    label: string,
    modifier = 1
  ) => {
    if (categoryScore <= 0) return

    const contribution = categoryScore * weight * modifier
    totalScore += contribution
    totalWeight += weight

    if (collectFactors && categoryScore > SCORING_CONFIG.MIN_FACTOR_THRESHOLD) {
      factors.push({
        category: categoryType,
        label,
        contribution,
        strength: Math.round(categoryScore * 100),
      })
    }
  }

  // 1. Interest matching (highest weight)
  const interests = prefs.interests || []
  for (const interest of interests) {
    const categoryKey = mapInterestToCategory(interest)
    const categoryScore = getCategoryScore(attraction.categories, categoryKey)
    addScore(categoryKey, categoryScore, WEIGHTS.interests, 'interest', LABEL_MAP[categoryKey] || interest)
  }

  // 2. Travel style matching
  const travelStyles = prefs.travelStyle || []
  for (const style of travelStyles) {
    const categoryScore = getCategoryScore(attraction.categories, style)
    addScore(style, categoryScore, WEIGHTS.travelStyle, 'style', LABEL_MAP[style] || style)
  }

  // 3. Budget matching with penalties
  if (prefs.budget) {
    const budgetScore = getCategoryScore(attraction.categories, prefs.budget)
    let budgetModifier = 1

    if (prefs.budget === 'budget' && getCategoryScore(attraction.categories, 'luxury') > SCORING_CONFIG.BUDGET_CONFLICT_THRESHOLD) {
      budgetModifier -= SCORING_CONFIG.BUDGET_LUXURY_PENALTY
    }
    if (prefs.budget === 'luxury' && getCategoryScore(attraction.categories, 'budget') > SCORING_CONFIG.BUDGET_CONFLICT_THRESHOLD) {
      budgetModifier -= SCORING_CONFIG.LUXURY_BUDGET_PENALTY
    }

    if (budgetScore > 0) {
      addScore(prefs.budget, budgetScore, WEIGHTS.budget, 'budget', LABEL_MAP[prefs.budget] || prefs.budget, budgetModifier)
    }
  }

  // 4. Group type matching
  if (prefs.groupType) {
    const groupCategory = GROUP_CATEGORY_MAP[prefs.groupType]
    if (groupCategory) {
      const groupScore = getCategoryScore(attraction.categories, groupCategory)
      addScore(groupCategory, groupScore, WEIGHTS.groupType, 'group', LABEL_MAP[groupCategory] || prefs.groupType)
    }
  }

  // 5. Trip type matching (average across categories)
  if (prefs.tripType) {
    const tripCategories = TRIP_TYPE_CATEGORIES[prefs.tripType] || []
    let tripScore = 0
    let tripCount = 0

    for (const cat of tripCategories) {
      const score = getCategoryScore(attraction.categories, cat)
      if (score > 0) {
        tripScore += score
        tripCount++
      }
    }

    if (tripCount > 0) {
      const avgTripScore = tripScore / tripCount
      const contribution = avgTripScore * WEIGHTS.tripType
      totalScore += contribution
      totalWeight += WEIGHTS.tripType

      if (collectFactors && avgTripScore > SCORING_CONFIG.MIN_FACTOR_THRESHOLD) {
        factors.push({
          category: 'trip',
          label: TRIP_TYPE_LABELS[prefs.tripType] || prefs.tripType,
          contribution,
          strength: Math.round(avgTripScore * 100),
        })
      }
    }
  }

  // 6. Course interests matching (average across categories)
  const courseInterests = prefs.courseInterests || []
  for (const course of courseInterests) {
    const courseCategories = COURSE_CATEGORY_MAP[course] || []
    let courseScore = 0
    let courseCount = 0

    for (const cat of courseCategories) {
      const score = getCategoryScore(attraction.categories, cat)
      if (score > 0) {
        courseScore += score
        courseCount++
      }
    }

    if (courseCount > 0) {
      const avgCourseScore = courseScore / courseCount
      const contribution = avgCourseScore * WEIGHTS.courseInterests
      totalScore += contribution
      totalWeight += WEIGHTS.courseInterests

      if (collectFactors && avgCourseScore > SCORING_CONFIG.MIN_FACTOR_THRESHOLD) {
        factors.push({
          category: 'course',
          label: COURSE_LABELS[course] || course,
          contribution,
          strength: Math.round(avgCourseScore * 100),
        })
      }
    }
  }

  // 7. Place type modifiers
  if (attraction.placeType) {
    // Coworking boost for digital nomads
    if (attraction.placeType === 'coworking' && prefs.tripType === 'digital_nomad') {
      const nomadScore = getCategoryScore(attraction.categories, 'nomad') || SCORING_CONFIG.COWORKING_DEFAULT_NOMAD_SCORE
      const contribution = nomadScore * SCORING_CONFIG.COWORKING_NOMAD_MULTIPLIER * WEIGHTS.placeType
      totalScore += contribution
      totalWeight += WEIGHTS.placeType

      if (collectFactors) {
        factors.push({
          category: 'place',
          label: 'Co-working space',
          contribution,
          strength: Math.round(nomadScore * 100),
        })
      }
    }

    // Course boost for learners
    if (attraction.placeType === 'course' && courseInterests.length > 0) {
      const contribution = SCORING_CONFIG.COURSE_INTEREST_BONUS * WEIGHTS.placeType
      totalScore += contribution
      totalWeight += WEIGHTS.placeType

      if (collectFactors) {
        factors.push({
          category: 'place',
          label: 'Learning experience',
          contribution,
          strength: 50,
        })
      }
    }
  }

  return { totalScore, totalWeight, factors }
}

export function useMatcher() {
  const userStore = useUserStore()
  const countryStore = useCountryStore()

  // Memoization cache for scores
  const scoreCache = ref<Map<string, number>>(new Map())

  // Invalidate cache when preferences or attractions change
  watch(
    () => [userStore.profile.prefs, countryStore.attractions.length],
    () => {
      scoreCache.value.clear()
    },
    { deep: true }
  )

  // Client-side matching for immediate feedback
  function calculateLocalScore(attraction: Attraction): number {
    const prefs = userStore.profile.prefs
    if (!prefs || Object.keys(prefs).length === 0) {
      return 50
    }

    if (!attraction?.categories || typeof attraction.categories !== 'object') {
      return 50
    }

    const { totalScore, totalWeight } = calculateScore(prefs, attraction, false)
    if (totalWeight === 0) return 50
    return Math.round((totalScore / totalWeight) * 100)
  }

  // Memoized score calculation
  function getCachedScore(attraction: Attraction): number {
    const cacheKey = attraction.id
    if (scoreCache.value.has(cacheKey)) {
      return scoreCache.value.get(cacheKey)!
    }
    const score = calculateLocalScore(attraction)
    scoreCache.value.set(cacheKey, score)
    return score
  }

  function getMatchBreakdown(attraction: Attraction): MatchBreakdown {
    const prefs = userStore.profile.prefs
    if (!prefs || Object.keys(prefs).length === 0) {
      return { factors: [], totalScore: 50 }
    }

    if (!attraction?.categories || typeof attraction.categories !== 'object') {
      return { factors: [], totalScore: 50 }
    }

    const { totalScore, totalWeight, factors } = calculateScore(prefs, attraction, true)

    // Normalize factors to percentages
    if (totalWeight > 0) {
      for (const factor of factors) {
        factor.contribution = Math.round((factor.contribution / totalWeight) * 100)
      }
    }

    // Sort by contribution (highest first)
    factors.sort((a, b) => b.contribution - a.contribution)

    const finalScore = totalWeight === 0 ? 50 : Math.round((totalScore / totalWeight) * 100)
    return { factors, totalScore: finalScore }
  }

  function getMatchReason(attraction: Attraction): string {
    const prefs = userStore.profile.prefs
    if (!prefs || Object.keys(prefs).length === 0) return ''
    if (!attraction?.categories) return ''

    const interests = prefs.interests || []
    const travelStyles = prefs.travelStyle || []

    // Combine preference sources
    const preferenceKeys = [
      ...interests.map(mapInterestToCategory),
      ...travelStyles,
    ]

    // Find strong matches
    const strongMatches = preferenceKeys
      .map(key => ({
        key,
        score: getCategoryScore(attraction.categories, key),
      }))
      .filter(match => match.score >= SCORING_CONFIG.STRONG_MATCH_THRESHOLD)

    if (strongMatches.length === 0) return ''

    // Return reason for strongest match
    const strongest = strongMatches.reduce((best, current) =>
      current.score > best.score ? current : best
    )

    return REASON_MAP[strongest.key] || ''
  }

  const sortedByMatch = computed(() => {
    if (!userStore.hasProfile) {
      return countryStore.attractions
    }

    return [...countryStore.attractions].sort((a, b) => {
      return getCachedScore(b) - getCachedScore(a)
    })
  })

  const hasProfile = computed(() => userStore.hasProfile)

  return {
    calculateLocalScore,
    getMatchReason,
    getMatchBreakdown,
    sortedByMatch,
    hasProfile,
  }
}
