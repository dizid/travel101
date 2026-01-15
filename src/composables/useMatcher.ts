import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useCountryStore } from '@/stores/countryStore'
import type { Attraction } from '@/types'

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

export function useMatcher() {
  const userStore = useUserStore()
  const countryStore = useCountryStore()

  // Client-side matching for immediate feedback
  function calculateLocalScore(attraction: Attraction): number {
    const prefs = userStore.profile.prefs
    if (!prefs || Object.keys(prefs).length === 0) {
      return 50
    }

    let totalScore = 0
    let totalWeight = 0

    // 1. Interest matching (highest weight)
    const interests = prefs.interests || []
    for (const interest of interests) {
      const categoryKey = mapInterestToCategory(interest)
      if (attraction.categories[categoryKey]) {
        totalScore += attraction.categories[categoryKey] * WEIGHTS.interests
      }
      totalWeight += WEIGHTS.interests
    }

    // 2. Travel style matching
    const travelStyles = prefs.travelStyle || []
    for (const style of travelStyles) {
      if (attraction.categories[style]) {
        totalScore += attraction.categories[style] * WEIGHTS.travelStyle
      }
      totalWeight += WEIGHTS.travelStyle
    }

    // 3. Budget matching
    if (prefs.budget) {
      if (attraction.categories[prefs.budget]) {
        totalScore += attraction.categories[prefs.budget] * WEIGHTS.budget
      }
      if (prefs.budget === 'budget' && (attraction.categories.luxury || 0) > 0.7) {
        totalScore -= 0.3 * WEIGHTS.budget
      }
      if (prefs.budget === 'luxury' && (attraction.categories.budget || 0) > 0.7) {
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
      if (groupCategory && attraction.categories[groupCategory]) {
        totalScore += attraction.categories[groupCategory] * WEIGHTS.groupType
      }
      totalWeight += WEIGHTS.groupType
    }

    // 5. Trip type matching
    if (prefs.tripType) {
      if (prefs.tripType === 'digital_nomad' && attraction.categories.nomad) {
        totalScore += attraction.categories.nomad * WEIGHTS.tripType
      }
      totalWeight += WEIGHTS.tripType
    }

    if (totalWeight === 0) return 50
    return Math.round((totalScore / totalWeight) * 100)
  }

  function getMatchReason(attraction: Attraction): string {
    const prefs = userStore.profile.prefs
    if (!prefs || Object.keys(prefs).length === 0) {
      return ''
    }

    const reasonMap: Record<string, string> = {
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

    const interests = prefs.interests || []
    const travelStyles = prefs.travelStyle || []

    // Find the strongest matching category
    const matches: { key: string; score: number }[] = []

    for (const interest of interests) {
      const key = mapInterestToCategory(interest)
      if (attraction.categories[key] && attraction.categories[key] >= 0.7) {
        matches.push({ key, score: attraction.categories[key] })
      }
    }

    for (const style of travelStyles) {
      if (attraction.categories[style] && attraction.categories[style] >= 0.7) {
        matches.push({ key: style, score: attraction.categories[style] })
      }
    }

    if (matches.length === 0) return ''

    const best = matches.sort((a, b) => b.score - a.score)[0]
    return reasonMap[best.key] || ''
  }

  const sortedByMatch = computed(() => {
    if (!userStore.hasProfile) {
      return countryStore.attractions
    }

    return [...countryStore.attractions].sort((a, b) => {
      return calculateLocalScore(b) - calculateLocalScore(a)
    })
  })

  const hasProfile = computed(() => userStore.hasProfile)

  return {
    calculateLocalScore,
    getMatchReason,
    sortedByMatch,
    hasProfile,
  }
}
