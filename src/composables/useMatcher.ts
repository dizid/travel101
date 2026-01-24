import { computed } from 'vue'
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
}

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

// Map user interests to attraction category keys
function mapInterestToCategory(interest: string): string {
  const map: Record<string, string> = {
    temples: 'culture',
    shopping: 'budget',
  }
  return map[interest] || interest
}

export interface MatchFactor {
  category: string
  label: string
  contribution: number // Percentage contribution to total score
  strength: number // How strong this category is (0-100)
}

export interface MatchBreakdown {
  factors: MatchFactor[]
  totalScore: number
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

    // 1. Interest matching (highest weight) - only count weight when matched
    const interests = prefs.interests || []
    for (const interest of interests) {
      const categoryKey = mapInterestToCategory(interest)
      if (attraction.categories[categoryKey]) {
        totalScore += attraction.categories[categoryKey] * WEIGHTS.interests
        totalWeight += WEIGHTS.interests
      }
    }

    // 2. Travel style matching - only count weight when matched
    const travelStyles = prefs.travelStyle || []
    for (const style of travelStyles) {
      if (attraction.categories[style]) {
        totalScore += attraction.categories[style] * WEIGHTS.travelStyle
        totalWeight += WEIGHTS.travelStyle
      }
    }

    // 3. Budget matching - always count (single value preference)
    if (prefs.budget) {
      if (attraction.categories[prefs.budget]) {
        totalScore += attraction.categories[prefs.budget] * WEIGHTS.budget
        totalWeight += WEIGHTS.budget
      }
      if (prefs.budget === 'budget' && (attraction.categories.luxury || 0) > 0.7) {
        totalScore -= 0.3 * WEIGHTS.budget
      }
      if (prefs.budget === 'luxury' && (attraction.categories.budget || 0) > 0.7) {
        totalScore -= 0.2 * WEIGHTS.budget
      }
    }

    // 4. Group type matching - only count weight when matched
    if (prefs.groupType) {
      const groupCategoryMap: Record<string, string> = {
        couple: 'romantic',
        family: 'family',
      }
      const groupCategory = groupCategoryMap[prefs.groupType]
      if (groupCategory && attraction.categories[groupCategory]) {
        totalScore += attraction.categories[groupCategory] * WEIGHTS.groupType
        totalWeight += WEIGHTS.groupType
      }
    }

    // 5. Trip type matching - only count weight when matched
    if (prefs.tripType) {
      const tripCategories = TRIP_TYPE_CATEGORIES[prefs.tripType] || []
      let tripScore = 0
      let tripCount = 0
      for (const cat of tripCategories) {
        if (attraction.categories[cat]) {
          tripScore += attraction.categories[cat]
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
        if (attraction.categories[cat]) {
          courseScore += attraction.categories[cat]
          courseCount++
        }
      }
      if (courseCount > 0) {
        totalScore += (courseScore / courseCount) * WEIGHTS.courseInterests
        totalWeight += WEIGHTS.courseInterests
      }
    }

    // 7. Place type modifiers
    if (attraction.placeType) {
      // Coworking spaces get big boost for digital nomads
      if (attraction.placeType === 'coworking' && prefs.tripType === 'digital_nomad') {
        const nomadScore = attraction.categories.nomad || 0.8
        totalScore += nomadScore * 2 * WEIGHTS.placeType
        totalWeight += WEIGHTS.placeType
      }
      // Courses get boost if user has matching course interests
      if (attraction.placeType === 'course' && courseInterests.length > 0) {
        totalScore += 0.5 * WEIGHTS.placeType
        totalWeight += WEIGHTS.placeType
      }
    }

    if (totalWeight === 0) return 50
    return Math.round((totalScore / totalWeight) * 100)
  }

  function getMatchBreakdown(attraction: Attraction): MatchBreakdown {
    const prefs = userStore.profile.prefs
    if (!prefs || Object.keys(prefs).length === 0) {
      return { factors: [], totalScore: 50 }
    }

    const factors: MatchFactor[] = []
    let totalScore = 0
    let totalWeight = 0

    const labelMap: Record<string, string> = {
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

    // 1. Interest matching - only count weight when matched
    const interests = prefs.interests || []
    for (const interest of interests) {
      const categoryKey = mapInterestToCategory(interest)
      const categoryScore = attraction.categories[categoryKey] || 0
      if (categoryScore > 0) {
        const contribution = categoryScore * WEIGHTS.interests
        totalScore += contribution
        totalWeight += WEIGHTS.interests

        if (categoryScore > 0.3) {
          factors.push({
            category: 'interest',
            label: labelMap[categoryKey] || interest,
            contribution: contribution,
            strength: Math.round(categoryScore * 100),
          })
        }
      }
    }

    // 2. Travel style matching - only count weight when matched
    const travelStyles = prefs.travelStyle || []
    for (const style of travelStyles) {
      const categoryScore = attraction.categories[style] || 0
      if (categoryScore > 0) {
        const contribution = categoryScore * WEIGHTS.travelStyle
        totalScore += contribution
        totalWeight += WEIGHTS.travelStyle

        if (categoryScore > 0.3) {
          factors.push({
            category: 'style',
            label: labelMap[style] || style,
            contribution: contribution,
            strength: Math.round(categoryScore * 100),
          })
        }
      }
    }

    // 3. Budget matching - only count weight when matched
    if (prefs.budget) {
      const budgetScore = attraction.categories[prefs.budget] || 0
      if (budgetScore > 0) {
        let contribution = budgetScore * WEIGHTS.budget

        if (prefs.budget === 'budget' && (attraction.categories.luxury || 0) > 0.7) {
          contribution -= 0.3 * WEIGHTS.budget
        }
        if (prefs.budget === 'luxury' && (attraction.categories.budget || 0) > 0.7) {
          contribution -= 0.2 * WEIGHTS.budget
        }

        totalScore += contribution
        totalWeight += WEIGHTS.budget

        if (budgetScore > 0.3) {
          factors.push({
            category: 'budget',
            label: labelMap[prefs.budget] || prefs.budget,
            contribution: contribution,
            strength: Math.round(budgetScore * 100),
          })
        }
      }
    }

    // 4. Group type matching - only count weight when matched
    if (prefs.groupType) {
      const groupCategoryMap: Record<string, string> = {
        couple: 'romantic',
        family: 'family',
      }
      const groupCategory = groupCategoryMap[prefs.groupType]
      if (groupCategory) {
        const groupScore = attraction.categories[groupCategory] || 0
        if (groupScore > 0) {
          const contribution = groupScore * WEIGHTS.groupType
          totalScore += contribution
          totalWeight += WEIGHTS.groupType

          if (groupScore > 0.3) {
            factors.push({
              category: 'group',
              label: labelMap[groupCategory] || prefs.groupType,
              contribution: contribution,
              strength: Math.round(groupScore * 100),
            })
          }
        }
      }
    }

    // 5. Trip type matching - only count weight when matched
    if (prefs.tripType) {
      const tripCategories = TRIP_TYPE_CATEGORIES[prefs.tripType] || []
      let tripScore = 0
      let tripCount = 0
      for (const cat of tripCategories) {
        if (attraction.categories[cat]) {
          tripScore += attraction.categories[cat]
          tripCount++
        }
      }
      if (tripCount > 0) {
        const avgTripScore = tripScore / tripCount
        const contribution = avgTripScore * WEIGHTS.tripType
        totalScore += contribution
        totalWeight += WEIGHTS.tripType

        const tripLabels: Record<string, string> = {
          holiday: 'Holiday-perfect',
          expat: 'Expat-friendly',
          digital_nomad: 'Digital nomad friendly',
        }
        if (avgTripScore > 0.3) {
          factors.push({
            category: 'trip',
            label: tripLabels[prefs.tripType] || prefs.tripType,
            contribution: contribution,
            strength: Math.round(avgTripScore * 100),
          })
        }
      }
    }

    // 6. Course interests matching - only count weight when matched
    const courseInterests = prefs.courseInterests || []
    if (courseInterests.length > 0) {
      const courseLabels: Record<string, string> = {
        cooking: 'Cooking classes',
        meditation: 'Meditation retreats',
        diving: 'Diving spots',
        massage: 'Massage courses',
        muay_thai: 'Muay Thai training',
        yoga: 'Yoga retreats',
      }
      for (const course of courseInterests) {
        const courseCategories = COURSE_CATEGORY_MAP[course] || []
        let courseScore = 0
        let courseCount = 0
        for (const cat of courseCategories) {
          if (attraction.categories[cat]) {
            courseScore += attraction.categories[cat]
            courseCount++
          }
        }
        if (courseCount > 0) {
          const avgCourseScore = courseScore / courseCount
          const contribution = avgCourseScore * WEIGHTS.courseInterests
          totalScore += contribution
          totalWeight += WEIGHTS.courseInterests

          if (avgCourseScore > 0.3) {
            factors.push({
              category: 'course',
              label: courseLabels[course] || course,
              contribution: contribution,
              strength: Math.round(avgCourseScore * 100),
            })
          }
        }
      }
    }

    // 7. Place type modifiers
    if (attraction.placeType) {
      if (attraction.placeType === 'coworking' && prefs.tripType === 'digital_nomad') {
        const nomadScore = attraction.categories.nomad || 0.8
        const contribution = nomadScore * 2 * WEIGHTS.placeType
        totalScore += contribution
        totalWeight += WEIGHTS.placeType

        factors.push({
          category: 'place',
          label: 'Co-working space',
          contribution: contribution,
          strength: Math.round(nomadScore * 100),
        })
      }
      if (attraction.placeType === 'course' && courseInterests.length > 0) {
        const contribution = 0.5 * WEIGHTS.placeType
        totalScore += contribution
        totalWeight += WEIGHTS.placeType

        factors.push({
          category: 'place',
          label: 'Learning experience',
          contribution: contribution,
          strength: 50,
        })
      }
    }

    // Normalize factors to percentages
    if (totalWeight > 0) {
      const maxPossibleContribution = totalWeight
      for (const factor of factors) {
        factor.contribution = Math.round((factor.contribution / maxPossibleContribution) * 100)
      }
    }

    // Sort by contribution (highest first)
    factors.sort((a, b) => b.contribution - a.contribution)

    const finalScore = totalWeight === 0 ? 50 : Math.round((totalScore / totalWeight) * 100)
    return { factors, totalScore: finalScore }
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
    getMatchBreakdown,
    sortedByMatch,
    hasProfile,
  }
}
