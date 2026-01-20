import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMatcher } from './useMatcher'
import { useUserStore } from '@/stores/userStore'
import { useCountryStore } from '@/stores/countryStore'
import {
  mockBeachAttraction,
  mockTempleAttraction,
  mockNomadAttraction,
  mockLuxuryAttraction,
  mockFamilyAttraction,
  mockAttractions,
  backpackerPrefs,
  luxuryCouplePrefs,
  digitalNomadPrefs,
  familyPrefs,
} from '@/test/fixtures'
import type { Attraction } from '@/types'

describe('useMatcher', () => {
  let userStore: ReturnType<typeof useUserStore>
  let countryStore: ReturnType<typeof useCountryStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    countryStore = useCountryStore()
    // Set attractions in country store
    countryStore.attractions = [...mockAttractions]
    // Reset prefs with minimal structure to avoid breaking hasProfile computed
    // hasProfile requires nationality and travelStyle to be defined
    userStore.profile.prefs = { nationality: '', travelStyle: [] } as any
  })

  describe('calculateLocalScore', () => {
    it('should return 50 for empty preferences', () => {
      const { calculateLocalScore } = useMatcher()

      const score = calculateLocalScore(mockBeachAttraction)

      expect(score).toBe(50)
    })

    it('should return 50 for null preferences object', () => {
      userStore.profile.prefs = null as any
      const { calculateLocalScore } = useMatcher()

      const score = calculateLocalScore(mockBeachAttraction)

      expect(score).toBe(50)
    })

    describe('interest matching (weight 3.0)', () => {
      it('should score high for matching beach interest with only interest set', () => {
        // Only set interest - no other prefs that add weight
        userStore.profile.prefs = { interests: ['beach'] } as any
        const { calculateLocalScore } = useMatcher()

        const score = calculateLocalScore(mockBeachAttraction)

        // Beach attraction has beach: 0.95
        // Score = (0.95 * 3.0) / 3.0 * 100 = 95
        expect(score).toBe(95)
      })

      it('should dilute score when other prefs add weight without matching categories', () => {
        // Multiple prefs where only one matches - score gets diluted
        // mockTempleAttraction has: culture: 0.98, history: 0.95, photography: 0.85, authentic: 0.9
        // It does NOT have nightlife or luxury
        userStore.profile.prefs = {
          interests: ['culture'], // matches temple (0.98)
          travelStyle: ['nightlife'], // doesn't match temple
          budget: 'luxury', // doesn't match temple
        } as any
        const { calculateLocalScore } = useMatcher()

        const score = calculateLocalScore(mockTempleAttraction)

        // Culture scores 98 (weight 3), but other prefs add weight without contributing
        // totalWeight = 3 + 2.5 + 2 = 7.5
        // totalScore = 0.98 * 3 = 2.94
        // Final = (2.94 / 7.5) * 100 = 39.2
        expect(score).toBeGreaterThan(30)
        expect(score).toBeLessThan(50)
      })

      it('should map temples interest to culture category', () => {
        userStore.profile.prefs = { interests: ['temples'] } as any
        const { calculateLocalScore } = useMatcher()

        const score = calculateLocalScore(mockTempleAttraction)

        // Temple attraction has culture: 0.98
        expect(score).toBe(98)
      })

      it('should map shopping interest to budget category', () => {
        userStore.profile.prefs = { interests: ['shopping'] } as any
        const { calculateLocalScore } = useMatcher()

        const attractionWithBudget: Attraction = {
          ...mockBeachAttraction,
          categories: { beach: 0.9, budget: 0.8 },
        }
        const score = calculateLocalScore(attractionWithBudget)

        // shopping maps to budget, score = 0.8 * 100 = 80
        expect(score).toBe(80)
      })

      it('should accumulate scores for multiple interests', () => {
        userStore.profile.prefs = { interests: ['beach', 'food'] } as any
        const { calculateLocalScore } = useMatcher()

        const attractionWithMultiple: Attraction = {
          ...mockBeachAttraction,
          categories: { beach: 0.9, food: 0.8 },
        }
        const score = calculateLocalScore(attractionWithMultiple)

        // Score = (0.9*3 + 0.8*3) / (3+3) * 100 = 5.1/6 * 100 = 85
        expect(score).toBe(85)
      })

      it('should handle missing categories for interests', () => {
        userStore.profile.prefs = { interests: ['wellness'] } as any
        const { calculateLocalScore } = useMatcher()

        // Beach attraction doesn't have wellness category
        const score = calculateLocalScore(mockBeachAttraction)

        // No match: score = 0/3 * 100 = 0
        expect(score).toBe(0)
      })
    })

    describe('travel style matching (weight 2.5)', () => {
      it('should boost score for matching travel style', () => {
        userStore.profile.prefs = { travelStyle: ['relaxation'] } as any
        const { calculateLocalScore } = useMatcher()

        // Beach attraction has relaxation: 0.7
        const score = calculateLocalScore(mockBeachAttraction)

        // Score = (0.7 * 2.5) / 2.5 * 100 = 70
        expect(score).toBe(70)
      })

      it('should handle multiple travel styles', () => {
        userStore.profile.prefs = { travelStyle: ['adventure', 'culture'] } as any
        const { calculateLocalScore } = useMatcher()

        const adventureAttraction: Attraction = {
          ...mockBeachAttraction,
          categories: { adventure: 0.9, culture: 0.8 },
        }
        const score = calculateLocalScore(adventureAttraction)

        // Score = (0.9*2.5 + 0.8*2.5) / (2.5+2.5) * 100 = 4.25/5 * 100 = 85
        expect(score).toBe(85)
      })
    })

    describe('budget matching (weight 2.0)', () => {
      it('should match budget preference', () => {
        userStore.profile.prefs = { budget: 'luxury' } as any
        const { calculateLocalScore } = useMatcher()

        // Luxury attraction has luxury: 0.95
        const score = calculateLocalScore(mockLuxuryAttraction)

        // Score = (0.95 * 2.0) / 2.0 * 100 = 95
        expect(score).toBe(95)
      })

      it('should apply penalty for budget traveler at luxury spot', () => {
        userStore.profile.prefs = { budget: 'budget' } as any
        const { calculateLocalScore } = useMatcher()

        // Luxury attraction has luxury: 0.95 (> 0.7 threshold), budget: 0.1
        const score = calculateLocalScore(mockLuxuryAttraction)

        // Score = (0.1*2.0 - 0.3*2.0) / 2.0 * 100 = (0.2 - 0.6)/2 * 100 = -20
        // Capped at some minimum or negative allowed
        expect(score).toBeLessThan(20)
      })

      it('should apply smaller penalty for luxury traveler at budget spot', () => {
        userStore.profile.prefs = { budget: 'luxury' } as any
        const { calculateLocalScore } = useMatcher()

        const budgetAttraction: Attraction = {
          ...mockBeachAttraction,
          categories: { beach: 0.9, budget: 0.9, luxury: 0 },
        }
        const score = calculateLocalScore(budgetAttraction)

        // Score = (0*2.0 - 0.2*2.0) / 2.0 * 100 = -0.4/2 * 100 = -20
        expect(score).toBeLessThan(0)
      })

      it('should not penalize mid-budget travelers', () => {
        userStore.profile.prefs = { budget: 'mid' } as any
        const { calculateLocalScore } = useMatcher()

        // Mid-budget doesn't get penalized
        const scoreAtLuxury = calculateLocalScore(mockLuxuryAttraction)
        const scoreAtBudget = calculateLocalScore(mockNomadAttraction)

        // No penalty, but also no match since there's no 'mid' category
        // Both return 0 since 'mid' isn't in categories
        expect(scoreAtLuxury).toBe(0)
        expect(scoreAtBudget).toBe(0)
      })
    })

    describe('group type matching (weight 1.5)', () => {
      it('should map couple to romantic category', () => {
        userStore.profile.prefs = { groupType: 'couple' } as any
        const { calculateLocalScore } = useMatcher()

        // Luxury attraction has romantic: 0.9
        const score = calculateLocalScore(mockLuxuryAttraction)

        // Score = (0.9 * 1.5) / 1.5 * 100 = 90
        expect(score).toBe(90)
      })

      it('should map family to family category', () => {
        userStore.profile.prefs = { groupType: 'family' } as any
        const { calculateLocalScore } = useMatcher()

        // Family attraction has family: 0.9
        const score = calculateLocalScore(mockFamilyAttraction)

        // Score = (0.9 * 1.5) / 1.5 * 100 = 90
        expect(score).toBe(90)
      })

      it('should not affect solo travelers', () => {
        userStore.profile.prefs = { groupType: 'solo' } as any
        const { calculateLocalScore } = useMatcher()

        // Solo doesn't map to any category
        const score = calculateLocalScore(mockBeachAttraction)

        // Weight added but no score: 0/1.5 * 100 = 0
        expect(score).toBe(0)
      })
    })

    describe('trip type matching (weight 1.5)', () => {
      it('should boost score for digital nomad at nomad-friendly place', () => {
        userStore.profile.prefs = { tripType: 'digital_nomad' } as any
        const { calculateLocalScore } = useMatcher()

        // Nomad attraction has nomad: 0.95
        const score = calculateLocalScore(mockNomadAttraction)

        // Score = (0.95 * 1.5) / 1.5 * 100 = 95
        expect(score).toBe(95)
      })

      it('should not affect holiday travelers at nomad spots', () => {
        userStore.profile.prefs = { tripType: 'holiday' } as any
        const { calculateLocalScore } = useMatcher()

        const score = calculateLocalScore(mockNomadAttraction)

        // Holiday doesn't get nomad bonus: 0/1.5 * 100 = 0
        expect(score).toBe(0)
      })
    })

    describe('combined profile scoring', () => {
      it('should calculate weighted score for backpacker at temple', () => {
        userStore.updatePreferences(backpackerPrefs)
        const { calculateLocalScore } = useMatcher()

        // backpackerPrefs: interests: ['temples', 'food', 'nature'], travelStyle: ['adventure', 'culture']
        // budget: 'budget', groupType: 'solo', tripType: 'holiday'
        // Temple has: culture: 0.98, history: 0.95, photography: 0.85, authentic: 0.9
        const score = calculateLocalScore(mockTempleAttraction)

        // temples→culture (0.98*3) + food (0*3) + nature (0*3) = 2.94
        // adventure (0*2.5) + culture (0.98*2.5) = 2.45
        // budget (0*2 with penalty since no luxury) = 0
        // solo (0) = 0
        // holiday (0) = 0
        // Total: 5.39 / (9 + 5 + 2 + 1.5 + 1.5) = 5.39 / 19 = 0.284 -> 28
        expect(score).toBeGreaterThan(20)
        expect(score).toBeLessThan(40)
      })

      it('should calculate weighted score for luxury couple at beach resort', () => {
        userStore.updatePreferences(luxuryCouplePrefs)
        const { calculateLocalScore } = useMatcher()

        // luxuryCouplePrefs: interests: ['beach', 'wellness', 'food'], travelStyle: ['relaxation']
        // budget: 'luxury', groupType: 'couple', tripType: 'holiday'
        // Luxury has: beach 0.9, luxury 0.95, wellness 0.85, romantic 0.9, relaxation 0.85
        const score = calculateLocalScore(mockLuxuryAttraction)

        // Interests: beach(0.9*3) + wellness(0.85*3) + food(0*3) = 5.25
        // Style: relaxation(0.85*2.5) = 2.125
        // Budget: luxury(0.95*2) = 1.9
        // Group: couple→romantic(0.9*1.5) = 1.35
        // Trip: holiday(0) = 0
        // Total: 10.625 / (9 + 2.5 + 2 + 1.5 + 1.5) = 10.625 / 16.5 = 0.644 -> 64
        expect(score).toBeGreaterThan(55)
        expect(score).toBeLessThan(75)
      })

      it('should calculate weighted score for digital nomad at Chiang Mai', () => {
        userStore.updatePreferences(digitalNomadPrefs)
        const { calculateLocalScore } = useMatcher()

        // digitalNomadPrefs: interests: ['food', 'nature'], travelStyle: ['culture']
        // budget: 'mid', groupType: 'solo', tripType: 'digital_nomad'
        // Nomad has: nomad 0.95, culture 0.85, food 0.9, budget 0.8, authentic 0.85, nature 0.7
        const score = calculateLocalScore(mockNomadAttraction)

        // Interests: food(0.9*3) + nature(0.7*3) = 4.8
        // Style: culture(0.85*2.5) = 2.125
        // Budget: mid(0) = 0
        // Group: solo(0) = 0
        // Trip: nomad(0.95*1.5) = 1.425
        // Total: 8.35 / (6 + 2.5 + 2 + 1.5 + 1.5) = 8.35 / 13.5 = 0.619 -> 62
        expect(score).toBeGreaterThan(55)
        expect(score).toBeLessThan(70)
      })

      it('should calculate weighted score for family at family-friendly place', () => {
        userStore.updatePreferences(familyPrefs)
        const { calculateLocalScore } = useMatcher()

        // familyPrefs: interests: ['beach', 'nature'], travelStyle: ['relaxation', 'adventure']
        // budget: 'mid', groupType: 'family', tripType: 'holiday'
        // Family has: beach 0.85, family 0.9, relaxation 0.8, budget 0.6, authentic 0.7
        const score = calculateLocalScore(mockFamilyAttraction)

        // Interests: beach(0.85*3) + nature(0*3) = 2.55
        // Style: relaxation(0.8*2.5) + adventure(0*2.5) = 2.0
        // Budget: mid(0) = 0
        // Group: family(0.9*1.5) = 1.35
        // Trip: holiday(0) = 0
        // Total: 5.9 / (6 + 5 + 2 + 1.5 + 1.5) = 5.9 / 16 = 0.369 -> 37
        expect(score).toBeGreaterThan(30)
        expect(score).toBeLessThan(50)
      })
    })
  })

  describe('getMatchBreakdown', () => {
    it('should return empty factors for empty preferences', () => {
      const { getMatchBreakdown } = useMatcher()

      const breakdown = getMatchBreakdown(mockBeachAttraction)

      expect(breakdown.factors).toEqual([])
      expect(breakdown.totalScore).toBe(50)
    })

    it('should return factors sorted by contribution (highest first)', () => {
      userStore.profile.prefs = {
        interests: ['beach', 'food'],
        travelStyle: ['relaxation'],
      } as any
      const { getMatchBreakdown } = useMatcher()

      const attractionWithScores: Attraction = {
        ...mockBeachAttraction,
        categories: { beach: 0.9, food: 0.5, relaxation: 0.7 },
      }
      const breakdown = getMatchBreakdown(attractionWithScores)

      // Should be sorted descending
      for (let i = 1; i < breakdown.factors.length; i++) {
        expect(breakdown.factors[i - 1].contribution)
          .toBeGreaterThanOrEqual(breakdown.factors[i].contribution)
      }
    })

    it('should only include factors with score > 0.3', () => {
      userStore.profile.prefs = { interests: ['beach', 'wellness'] } as any
      const { getMatchBreakdown } = useMatcher()

      const attractionWithLowWellness: Attraction = {
        ...mockBeachAttraction,
        categories: { beach: 0.9, wellness: 0.2 }, // wellness below threshold
      }
      const breakdown = getMatchBreakdown(attractionWithLowWellness)

      // Should only include beach factor
      expect(breakdown.factors.some(f => f.label.toLowerCase().includes('beach'))).toBe(true)
      expect(breakdown.factors.some(f => f.label.toLowerCase().includes('wellness'))).toBe(false)
    })

    it('should provide human-readable labels', () => {
      userStore.profile.prefs = {
        interests: ['beach'],
        travelStyle: ['relaxation'],
        groupType: 'couple',
      } as any
      const { getMatchBreakdown } = useMatcher()

      const breakdown = getMatchBreakdown(mockLuxuryAttraction)

      const labels = breakdown.factors.map(f => f.label)
      // Should have human-readable labels, not raw keys
      expect(labels.every(l => l.length > 3)).toBe(true)
    })

    it('should normalize contributions to percentages', () => {
      userStore.profile.prefs = {
        interests: ['beach'],
        travelStyle: ['relaxation'],
      } as any
      const { getMatchBreakdown } = useMatcher()

      const breakdown = getMatchBreakdown(mockBeachAttraction)

      // All contributions should be reasonable percentages
      breakdown.factors.forEach(f => {
        expect(f.contribution).toBeGreaterThanOrEqual(0)
        expect(f.contribution).toBeLessThanOrEqual(100)
      })
    })

    it('should include strength as 0-100 value', () => {
      userStore.profile.prefs = { interests: ['beach'] } as any
      const { getMatchBreakdown } = useMatcher()

      const breakdown = getMatchBreakdown(mockBeachAttraction)

      breakdown.factors.forEach(f => {
        expect(f.strength).toBeGreaterThanOrEqual(0)
        expect(f.strength).toBeLessThanOrEqual(100)
      })
    })

    it('should handle digital nomad trip type', () => {
      userStore.profile.prefs = { tripType: 'digital_nomad' } as any
      const { getMatchBreakdown } = useMatcher()

      const breakdown = getMatchBreakdown(mockNomadAttraction)

      expect(breakdown.factors.some(f => f.label === 'Digital nomad friendly')).toBe(true)
    })
  })

  describe('getMatchReason', () => {
    it('should return empty string for empty preferences', () => {
      const { getMatchReason } = useMatcher()

      const reason = getMatchReason(mockBeachAttraction)

      expect(reason).toBe('')
    })

    it('should return reason for strong match (>= 0.7)', () => {
      userStore.profile.prefs = { interests: ['beach'] } as any
      const { getMatchReason } = useMatcher()

      // Beach attraction has beach: 0.95
      const reason = getMatchReason(mockBeachAttraction)

      expect(reason).toBe('Great for beach lovers')
    })

    it('should return empty for weak matches (< 0.7)', () => {
      userStore.profile.prefs = { interests: ['wellness'] } as any
      const { getMatchReason } = useMatcher()

      const weakWellnessAttraction: Attraction = {
        ...mockBeachAttraction,
        categories: { beach: 0.9, wellness: 0.5 },
      }
      const reason = getMatchReason(weakWellnessAttraction)

      expect(reason).toBe('')
    })

    it('should return best matching reason when multiple match', () => {
      userStore.profile.prefs = {
        interests: ['beach', 'food'],
        travelStyle: ['relaxation'],
      } as any
      const { getMatchReason } = useMatcher()

      const multiMatchAttraction: Attraction = {
        ...mockBeachAttraction,
        categories: { beach: 0.95, food: 0.85, relaxation: 0.9 },
      }
      const reason = getMatchReason(multiMatchAttraction)

      // Should return highest scoring match
      expect(reason).toBe('Great for beach lovers')
    })

    it('should match travel styles to reasons', () => {
      userStore.profile.prefs = { travelStyle: ['adventure'] } as any
      const { getMatchReason } = useMatcher()

      const adventureAttraction: Attraction = {
        ...mockBeachAttraction,
        categories: { adventure: 0.9 },
      }
      const reason = getMatchReason(adventureAttraction)

      expect(reason).toBe('Adventure awaits')
    })
  })

  describe('sortedByMatch computed', () => {
    it('should return unsorted attractions when no profile', () => {
      // hasProfile requires nationality and travelStyle - set empty values
      userStore.profile.prefs = { nationality: '', travelStyle: [] } as any
      const { sortedByMatch, hasProfile } = useMatcher()

      expect(hasProfile.value).toBe(false)
      expect(sortedByMatch.value).toEqual(countryStore.attractions)
    })

    it('should sort attractions by score descending when profile exists', () => {
      userStore.updatePreferences({
        ...backpackerPrefs,
        nationality: 'US',
        travelStyle: ['adventure'],
      })
      const { sortedByMatch, calculateLocalScore } = useMatcher()

      const sorted = sortedByMatch.value

      // Verify descending order
      for (let i = 1; i < sorted.length; i++) {
        const prevScore = calculateLocalScore(sorted[i - 1])
        const currScore = calculateLocalScore(sorted[i])
        expect(prevScore).toBeGreaterThanOrEqual(currScore)
      }
    })

    it('should put best matches first for beach lover', () => {
      userStore.updatePreferences({
        interests: ['beach'],
        travelStyle: ['relaxation'],
        nationality: 'US',
      })
      const { sortedByMatch } = useMatcher()

      // Beach-heavy attractions should be near top
      const topAttractions = sortedByMatch.value.slice(0, 3)
      const hasBeachInTop = topAttractions.some(
        a => (a.categories.beach || 0) > 0.7
      )

      expect(hasBeachInTop).toBe(true)
    })

    it('should be reactive to preference changes', () => {
      const { sortedByMatch } = useMatcher()

      userStore.updatePreferences({
        nationality: 'US',
        travelStyle: ['culture'],
        interests: ['temples'],
      })

      const cultureSorted = sortedByMatch.value
      // Temple should be near top for culture lovers
      const templePosition = cultureSorted.findIndex(a => a.slug === 'wat-phra-kaew')
      expect(templePosition).toBeLessThan(3)
    })
  })

  describe('hasProfile computed', () => {
    it('should reflect userStore.hasProfile', () => {
      const { hasProfile } = useMatcher()

      expect(hasProfile.value).toBe(false)

      userStore.updatePreferences({
        nationality: 'US',
        travelStyle: ['adventure'],
      })

      expect(hasProfile.value).toBe(true)
    })
  })
})
