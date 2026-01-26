// Matching algorithm for personalizing attractions based on user profile
// Imports shared constants from frontend to ensure consistency

import {
  WEIGHTS,
  SCORING_CONFIG,
  TRIP_TYPE_CATEGORIES,
  COURSE_CATEGORY_MAP,
  GROUP_CATEGORY_MAP,
  EXTENDED_REASON_MAP,
  mapInterestToCategory,
  mapCategoryToInterest,
  getCategoryScore,
  type UserPrefs,
  type AttractionCategories,
} from '../../../src/shared/matching-constants.js'

// Re-export types for consumers
export type { UserPrefs, AttractionCategories }

export function calculateMatchScore(
  prefs: UserPrefs,
  categories: AttractionCategories,
  placeType?: string
): number {
  if (!prefs || Object.keys(prefs).length === 0) {
    return SCORING_CONFIG.DEFAULT_SCORE
  }

  let totalScore = 0
  let totalWeight = 0

  // 1. Interest matching (highest weight) - only count weight when matched
  const interests = prefs.interests || []
  for (const interest of interests) {
    const categoryKey = mapInterestToCategory(interest)
    const score = getCategoryScore(categories, categoryKey)
    if (score > 0) {
      totalScore += score * WEIGHTS.interests
      totalWeight += WEIGHTS.interests
    }
  }

  // 2. Travel style matching - only count weight when matched
  const travelStyles = prefs.travelStyle || []
  for (const style of travelStyles) {
    const score = getCategoryScore(categories, style)
    if (score > 0) {
      totalScore += score * WEIGHTS.travelStyle
      totalWeight += WEIGHTS.travelStyle
    }
  }

  // 3. Budget matching with penalties
  if (prefs.budget) {
    const budgetScore = getCategoryScore(categories, prefs.budget)
    if (budgetScore > 0) {
      totalScore += budgetScore * WEIGHTS.budget
      totalWeight += WEIGHTS.budget
    }
    // Penalize mismatches
    if (prefs.budget === 'budget' && getCategoryScore(categories, 'luxury') > SCORING_CONFIG.BUDGET_CONFLICT_THRESHOLD) {
      totalScore -= SCORING_CONFIG.BUDGET_LUXURY_PENALTY * WEIGHTS.budget
    }
    if (prefs.budget === 'luxury' && getCategoryScore(categories, 'budget') > SCORING_CONFIG.BUDGET_CONFLICT_THRESHOLD) {
      totalScore -= SCORING_CONFIG.LUXURY_BUDGET_PENALTY * WEIGHTS.budget
    }
  }

  // 4. Group type matching - only count weight when matched
  if (prefs.groupType) {
    const groupCategory = GROUP_CATEGORY_MAP[prefs.groupType]
    if (groupCategory) {
      const score = getCategoryScore(categories, groupCategory)
      if (score > 0) {
        totalScore += score * WEIGHTS.groupType
        totalWeight += WEIGHTS.groupType
      }
    }
  }

  // 5. Trip type matching - only count weight when matched
  if (prefs.tripType) {
    const tripCategories = TRIP_TYPE_CATEGORIES[prefs.tripType] || []
    let tripScore = 0
    let tripCount = 0
    for (const cat of tripCategories) {
      const score = getCategoryScore(categories, cat)
      if (score > 0) {
        tripScore += score
        tripCount++
      }
    }
    if (tripCount > 0) {
      totalScore += (tripScore / tripCount) * WEIGHTS.tripType
      totalWeight += WEIGHTS.tripType
    }
  }

  // 6. Course interests matching - only count weight when matched
  const courseInterests = prefs.courseInterests || []
  for (const course of courseInterests) {
    const courseCategories = COURSE_CATEGORY_MAP[course] || []
    let courseScore = 0
    let courseCount = 0
    for (const cat of courseCategories) {
      const score = getCategoryScore(categories, cat)
      if (score > 0) {
        courseScore += score
        courseCount++
      }
    }
    if (courseCount > 0) {
      totalScore += (courseScore / courseCount) * WEIGHTS.courseInterests
      totalWeight += WEIGHTS.courseInterests
    }
  }

  // 7. Place type modifiers
  if (placeType) {
    // Coworking spaces get big boost for digital nomads
    if (placeType === 'coworking' && prefs.tripType === 'digital_nomad') {
      const nomadScore = getCategoryScore(categories, 'nomad') || SCORING_CONFIG.COWORKING_DEFAULT_NOMAD_SCORE
      totalScore += nomadScore * SCORING_CONFIG.COWORKING_NOMAD_MULTIPLIER * WEIGHTS.placeType
      totalWeight += WEIGHTS.placeType
    }
    // Courses get boost if user has matching course interests
    if (placeType === 'course' && courseInterests.length > 0) {
      totalScore += SCORING_CONFIG.COURSE_INTEREST_BONUS * WEIGHTS.placeType
      totalWeight += WEIGHTS.placeType
    }
  }

  // Normalize to 0-100
  if (totalWeight === 0) return SCORING_CONFIG.DEFAULT_SCORE
  return Math.round((totalScore / totalWeight) * 100)
}

export function getMatchReasons(
  prefs: UserPrefs,
  categories: AttractionCategories
): string[] {
  const reasons: string[] = []

  if (!prefs || Object.keys(prefs).length === 0) {
    return reasons
  }

  // Find top matching categories (>= threshold score)
  const topCategories = Object.entries(categories)
    .filter(([_, score]) => score >= SCORING_CONFIG.STRONG_MATCH_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const interests = prefs.interests || []
  const travelStyles = prefs.travelStyle || []

  for (const [category] of topCategories) {
    const mappedInterest = mapCategoryToInterest(category)
    if (interests.includes(mappedInterest) || interests.includes(category)) {
      if (EXTENDED_REASON_MAP[category]) {
        reasons.push(EXTENDED_REASON_MAP[category])
      }
    } else if (travelStyles.includes(category)) {
      if (EXTENDED_REASON_MAP[category]) {
        reasons.push(EXTENDED_REASON_MAP[category])
      }
    }
  }

  // If no specific matches, use highest category
  if (reasons.length === 0 && topCategories.length > 0) {
    const [category] = topCategories[0]
    if (EXTENDED_REASON_MAP[category]) {
      reasons.push(EXTENDED_REASON_MAP[category])
    }
  }

  return reasons.slice(0, 2)
}
