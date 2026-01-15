// Matching algorithm for personalizing attractions based on user profile

export interface UserPrefs {
  travelStyle?: string[]
  interests?: string[]
  budget?: string
  groupType?: string
  tripType?: string
  ageGroup?: string
}

export interface AttractionCategories {
  [key: string]: number
}

// Weight multipliers for different profile aspects
const WEIGHTS = {
  interests: 3.0,
  travelStyle: 2.5,
  budget: 2.0,
  groupType: 1.5,
  tripType: 1.5,
}

// Map user interests to attraction category keys
function mapInterestToCategory(interest: string): string {
  const map: Record<string, string> = {
    temples: 'culture',
    shopping: 'budget',
  }
  return map[interest] || interest
}

// Map attraction categories back to user-friendly interests
function mapCategoryToInterest(category: string): string {
  const map: Record<string, string> = {
    culture: 'temples',
  }
  return map[category] || category
}

export function calculateMatchScore(
  prefs: UserPrefs,
  categories: AttractionCategories
): number {
  if (!prefs || Object.keys(prefs).length === 0) {
    return 50 // Default score for users without profile
  }

  let totalScore = 0
  let totalWeight = 0

  // 1. Interest matching (highest weight)
  const interests = prefs.interests || []
  for (const interest of interests) {
    const categoryKey = mapInterestToCategory(interest)
    if (categories[categoryKey]) {
      totalScore += categories[categoryKey] * WEIGHTS.interests
    }
    totalWeight += WEIGHTS.interests
  }

  // 2. Travel style matching
  const travelStyles = prefs.travelStyle || []
  for (const style of travelStyles) {
    if (categories[style]) {
      totalScore += categories[style] * WEIGHTS.travelStyle
    }
    totalWeight += WEIGHTS.travelStyle
  }

  // 3. Budget matching
  if (prefs.budget) {
    if (categories[prefs.budget]) {
      totalScore += categories[prefs.budget] * WEIGHTS.budget
    }
    // Penalize mismatches
    if (prefs.budget === 'budget' && (categories.luxury || 0) > 0.7) {
      totalScore -= 0.3 * WEIGHTS.budget
    }
    if (prefs.budget === 'luxury' && (categories.budget || 0) > 0.7) {
      totalScore -= 0.2 * WEIGHTS.budget
    }
    totalWeight += WEIGHTS.budget
  }

  // 4. Group type matching
  if (prefs.groupType) {
    const groupCategoryMap: Record<string, string> = {
      couple: 'romantic',
      family: 'family',
    }
    const groupCategory = groupCategoryMap[prefs.groupType]
    if (groupCategory && categories[groupCategory]) {
      totalScore += categories[groupCategory] * WEIGHTS.groupType
    }
    totalWeight += WEIGHTS.groupType
  }

  // 5. Trip type matching
  if (prefs.tripType) {
    if (prefs.tripType === 'digital_nomad' && categories.nomad) {
      totalScore += categories.nomad * WEIGHTS.tripType
    }
    totalWeight += WEIGHTS.tripType
  }

  // Normalize to 0-100
  if (totalWeight === 0) return 50
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

  const reasonMap: Record<string, string> = {
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

  // Find top matching categories (>= 0.7 score)
  const topCategories = Object.entries(categories)
    .filter(([_, score]) => score >= 0.7)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const interests = prefs.interests || []
  const travelStyles = prefs.travelStyle || []

  for (const [category] of topCategories) {
    const mappedInterest = mapCategoryToInterest(category)
    if (interests.includes(mappedInterest) || interests.includes(category)) {
      if (reasonMap[category]) {
        reasons.push(reasonMap[category])
      }
    } else if (travelStyles.includes(category)) {
      if (reasonMap[category]) {
        reasons.push(reasonMap[category])
      }
    }
  }

  // If no specific matches, use highest category
  if (reasons.length === 0 && topCategories.length > 0) {
    const [category] = topCategories[0]
    if (reasonMap[category]) {
      reasons.push(reasonMap[category])
    }
  }

  return reasons.slice(0, 2)
}
