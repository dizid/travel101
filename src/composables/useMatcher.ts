import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useCountryStore } from '@/stores/countryStore'
import type { Attraction } from '@/types'

// Import shared constants - single source of truth
import {
  WEIGHTS,
  SCORING_CONFIG,
  TRIP_TYPE_CATEGORIES,
  COURSE_CATEGORY_MAP,
  GROUP_CATEGORY_MAP,
  LABEL_MAP,
  TRIP_TYPE_LABELS,
  COURSE_LABELS,
  REASON_MAP,
  mapInterestToCategory,
  getCategoryScore,
  type UserPrefs,
  type MatchFactor,
  type MatchBreakdown,
  type ScoringResult,
} from '@/shared/matching-constants'

// Re-export types for consumers
export type { MatchFactor, MatchBreakdown }

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
      return SCORING_CONFIG.DEFAULT_SCORE
    }

    if (!attraction?.categories || typeof attraction.categories !== 'object') {
      return SCORING_CONFIG.DEFAULT_SCORE
    }

    const { totalScore, totalWeight } = calculateScore(prefs, attraction, false)
    if (totalWeight === 0) return SCORING_CONFIG.DEFAULT_SCORE
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
      return { factors: [], totalScore: SCORING_CONFIG.DEFAULT_SCORE }
    }

    if (!attraction?.categories || typeof attraction.categories !== 'object') {
      return { factors: [], totalScore: SCORING_CONFIG.DEFAULT_SCORE }
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

    const finalScore = totalWeight === 0 ? SCORING_CONFIG.DEFAULT_SCORE : Math.round((totalScore / totalWeight) * 100)
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
